import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export interface ListEnrollmentsParams {
  userId?: string;
  status?: string;
  search?: string;
}

export interface EnrollInput {
  courseId: string;
  source?: 'purchase' | 'teacher_assigned' | 'admin' | 'free';
  assignedBy?: string;
}

export interface AssignInput {
  studentId: string;
  courseId: string;
}

export const enrollmentsService = {
  async getLiveSessions(userId: string) {
    const [enrollments, paymentRequests] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      }),
      prisma.paymentRequest.findMany({
        where: { userId, status: 'APPROVED', courseId: { not: null } },
        select: { courseId: true },
      }),
    ]);
    const courseIds = [...new Set([
      ...enrollments.map((e) => e.courseId),
      ...(paymentRequests.map((p) => p.courseId).filter(Boolean) as string[]),
    ])];
    if (courseIds.length === 0) return [];
    const lessons = await prisma.lesson.findMany({
      where: {
        type: 'LIVE_SESSION',
        scheduledAt: { gte: new Date() },
        chapter: { courseId: { in: courseIds } },
      },
      include: {
        chapter: {
          include: {
            course: {
              select: { id: true, title: true, titleAr: true, slug: true, thumbnail: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return lessons.map((l) => ({
      id: l.id,
      title: l.titleAr ?? l.title,
      scheduledAt: l.scheduledAt,
      meetingUrl: l.meetingUrl,
      meetingProvider: l.meetingProvider,
      duration: l.duration,
      course: l.chapter.course,
    }));
  },

  async listForUser(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              status: true,
              instructor: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
        },
      }),
      prisma.enrollment.count({ where: { userId } }),
    ]);

    return { data: enrollments, total, page, limit };
  },

  async listAdmin(query: Record<string, unknown>, filters: { search?: string; status?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { search, status } = filters;

    const where: Prisma.EnrollmentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { course: { title: { contains: search } } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data: enrollments, total, page, limit };
  },

  async enroll(userId: string, input: EnrollInput) {
    const { courseId, source = 'purchase', assignedBy } = input;

    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: { id: true, status: true, price: true, discountPrice: true },
    });

    if (!course) return { error: 'COURSE_NOT_FOUND' };
    if (course.status !== 'PUBLISHED') return { error: 'COURSE_NOT_PUBLISHED' };

    const effectivePrice = course.discountPrice ?? course.price ?? 0;
    if (source === 'free' && effectivePrice > 0) return { error: 'COURSE_NOT_FREE' };

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') return { error: 'ALREADY_ENROLLED' };
      if (existing.status === 'CANCELLED') {
        const updated = await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', source, assignedBy: assignedBy ?? null },
        });
        return { enrollment: updated };
      }
    }

    const created = await prisma.enrollment.create({
      data: {
        userId,
        courseId: course.id,
        source,
        assignedBy: assignedBy ?? null,
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    return { enrollment: created };
  },

  async assign(teacherId: string, input: AssignInput) {
    const { studentId, courseId } = input;

    const [course, student] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, instructorId: true, status: true },
      }),
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true },
      }),
    ]);

    if (!course || !student) return null;
    if (course.status !== 'PUBLISHED') return null;

    const isInstructor = course.instructorId === teacherId;
    const isTeacherInClass = await prisma.classStudent.findFirst({
      where: {
        class: { teacherId },
        studentId,
      },
    });

    if (!isInstructor && !isTeacherInClass) return null;

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') return existing;
      return prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', source: 'teacher_assigned', assignedBy: teacherId },
      });
    }

    const created = await prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId,
        source: 'teacher_assigned',
        assignedBy: teacherId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, titleAr: true } },
      },
    });
    import('../../services/notification.service').then(({ notifyEnrollment, notifyParentChildEnrollment }) => {
      notifyEnrollment(studentId, created.course.title, created.course.titleAr ?? undefined, 'ar').catch(() => {});
      prisma.parentChild.findMany({ where: { childId: studentId }, select: { parentId: true } }).then((pcs) => {
        for (const pc of pcs) {
          notifyParentChildEnrollment(pc.parentId, created.user.name, created.course.titleAr || created.course.title, 'ar').catch(() => {});
        }
      }).catch(() => {});
    }).catch(() => {});
    return created;
  },

  async cancel(id: string, userId: string, userRole: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!enrollment) return null;

    const canCancel =
      enrollment.userId === userId ||
      enrollment.course.instructorId === userId ||
      userRole === 'ADMIN';

    if (!canCancel) return null;

    return prisma.enrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  },

  async getProgress(id: string, userId: string, userRole: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, instructorId: true },
        },
      },
    });

    if (!enrollment) return null;

    const canView =
      enrollment.userId === userId ||
      enrollment.course.instructorId === userId ||
      userRole === 'ADMIN';

    if (!canView) return null;

    const totalLessons = await prisma.lesson.count({
      where: { chapter: { courseId: enrollment.courseId } },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: enrollment.userId,
        completed: true,
        lesson: { chapter: { courseId: enrollment.courseId } },
      },
    });

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await prisma.enrollment.update({
      where: { id },
      data: { progress },
    });

    return {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress,
        completedAt: enrollment.completedAt,
      },
      totalLessons,
      completedLessons,
    };
  },
};
