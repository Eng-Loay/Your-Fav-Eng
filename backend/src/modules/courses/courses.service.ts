import prisma from '../../config/database';
import { parsePagination, slugify } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export type CourseSort = 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating';

export interface ListCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: CourseSort;
}

export interface CreateCourseInput {
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  thumbnail?: string;
  previewVideo?: string;
  price?: number;
  currency?: string;
  discountPrice?: number;
  category?: string;
  level?: string;
  language?: string;
  status?: string;
  featured?: boolean;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

export const coursesService = {
  async list(params: ListCoursesParams, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { search, category, status, sort } = params;

    const where: Prisma.CourseWhereInput = {};

    if (search) {
      where.title = { contains: search };
    }
    if (category) {
      where.category = category;
    }
    // Public listing: only show PUBLISHED courses unless status is explicitly requested.
    // Historically some rows may have lowercase 'published' status; include both to avoid missing courses.
    const effectiveStatus = (status ?? 'PUBLISHED').toUpperCase();
    if (effectiveStatus === 'PUBLISHED') {
      where.OR = [{ status: 'PUBLISHED' }, { status: 'published' }];
    } else {
      where.status = effectiveStatus;
    }

    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    switch (sort) {
      case 'popular':
        orderBy.totalStudents = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'priceAsc':
        orderBy.price = 'asc';
        break;
      case 'priceDesc':
        orderBy.price = 'desc';
        break;
      case 'rating':
        orderBy.averageRating = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const coursesWithCounts = courses.map((c) => ({
      ...c,
      chaptersCount: c._count.chapters,
      lessonsCount: 0,
    }));

    const lessonCounts = await prisma.chapter.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      select: {
        courseId: true,
        _count: { select: { lessons: true } },
      },
    });

    const lessonCountMap = lessonCounts.reduce(
      (acc, ch) => {
        acc[ch.courseId] = (acc[ch.courseId] || 0) + ch._count.lessons;
        return acc;
      },
      {} as Record<string, number>
    );

    const result = coursesWithCounts.map((c) => {
      const { _count, ...rest } = c;
      return {
        ...rest,
        chaptersCount: c.chaptersCount,
        lessonsCount: lessonCountMap[c.id] || 0,
      };
    });

    return { data: result, total, page, limit };
  },

  async listInstructors(params: { role?: string; limit?: number }) {
    const { limit = 50 } = params;
    const where: Prisma.UserWhereInput = {
      role: 'TEACHER',
      status: 'ACTIVE',
    };
    const instructors = await prisma.user.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
      include: {
        teacherProfile: { select: { subject: true, specialty: true } },
        _count: { select: { courses: true } },
      },
    });
    return instructors.map((u) => {
      const teacher = u.teacherProfile;
      const specialty = teacher?.subject ?? teacher?.specialty ?? 'مدرس';
      return {
        id: u.id,
        nameAr: u.name,
        nameEn: u.name,
        titleAr: specialty,
        titleEn: specialty,
        avatar: u.avatar || '/user-avatar.png',
        role: u.role,
        courses: u._count.courses ?? 0,
        students: 0,
        rating: 4.5,
      };
    });
  },

  async getFeaturedInstructors(limit = 6) {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        teacherProfile: {
          select: {
            subject: true,
            specialty: true,
          },
        },
        _count: { select: { courses: true } },
      },
    });
    return instructors.map((u) => {
      const teacher = u.teacherProfile;
      const specialty = teacher?.subject ?? teacher?.specialty ?? 'مدرس';
      return {
        id: u.id,
        nameAr: u.name,
        nameEn: u.name,
        titleAr: specialty,
        titleEn: specialty,
        avatar: u.avatar || '/user-avatar.png',
        courses: u._count.courses ?? 0,
        students: 0,
        rating: 4.5,
      };
    });
  },

  async getInstructorProfile(instructorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: instructorId },
      include: {
        teacherProfile: true,
        courses: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { chapters: true, enrollments: true } },
          },
        },
        _count: { select: { courses: true } },
      },
    });
    if (!user || user.role !== 'TEACHER') return null;

    // Calculate real average rating from approved student reviews on instructor's courses
    const courseIds = user.courses.map((c) => c.id);
    const reviewsAgg = courseIds.length
      ? await prisma.review.aggregate({
          where: {
            courseId: { in: courseIds },
            status: 'APPROVED',
          },
          _avg: { rating: true },
          _count: { id: true },
        })
      : { _avg: { rating: null }, _count: { id: 0 } };
    const averageRating =
      reviewsAgg._count.id > 0 && reviewsAgg._avg.rating != null
        ? Math.round(reviewsAgg._avg.rating * 10) / 10
        : 0;

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      city: user.city,
      country: user.country,
      createdAt: user.createdAt,
      specialty: user.teacherProfile?.subject ?? user.teacherProfile?.specialty,
      website: user.teacherProfile?.website,
      twitter: user.teacherProfile?.twitter,
      totalStudents: 0,
      totalCourses: user._count.courses,
      averageRating,
      totalReviews: reviewsAgg._count.id,
      totalRevenue: 0,
      verified: user.teacherProfile?.verified ?? false,
      courses: user.courses.map((c) => ({
        id: c.id,
        title: c.title,
        titleAr: c.titleAr,
        slug: c.slug,
        thumbnail: c.thumbnail,
        price: c.price,
        currency: c.currency,
        level: c.level,
        category: c.category,
        totalStudents: c.totalStudents,
        averageRating: c.averageRating,
        totalReviews: c.totalReviews,
        chaptersCount: c._count.chapters,
        enrollmentsCount: c._count.enrollments,
      })),
    };
  },

  async getFeatured(limit = 10) {
    const courses = await prisma.course.findMany({
      where: { featured: true, status: 'PUBLISHED' },
      take: limit,
      orderBy: { totalStudents: 'desc' },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: { select: { chapters: true } },
      },
    });

    const courseIds = courses.map((c) => c.id);
    const chaptersWithLessons = await prisma.chapter.findMany({
      where: { courseId: { in: courseIds } },
      select: { courseId: true, _count: { select: { lessons: true } } },
    });

    const lessonCountMap = chaptersWithLessons.reduce(
      (acc, ch) => {
        acc[ch.courseId] = (acc[ch.courseId] || 0) + ch._count.lessons;
        return acc;
      },
      {} as Record<string, number>
    );

    return courses.map((c) => {
      const { _count, ...rest } = c;
      return {
        ...rest,
        chaptersCount: _count.chapters,
        lessonsCount: lessonCountMap[c.id] || 0,
      };
    });
  },

  async getById(idOrSlug: string, userId?: string, userRole?: string) {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            _count: { select: { courses: true } },
            teacherProfile: {
              select: {
                specialty: true,
              },
            },
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
    });

    if (!course) return null;

    // Non-PUBLISHED courses: only visible to instructor or admin
    if (course.status !== 'PUBLISHED') {
      const isOwner = userId && course.instructorId === userId;
      const isAdmin = userRole === 'ADMIN';
      if (!isOwner && !isAdmin) return null;
    }

    const lessonsCount = await prisma.lesson.count({
      where: { chapter: { courseId: course.id } },
    });

    const { _count, ...rest } = course;
    return {
      ...rest,
      chaptersCount: _count.chapters,
      lessonsCount,
    };
  },

  async getCurriculum(courseIdOrSlug: string, userId?: string, userRole?: string) {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
      select: { id: true, instructorId: true, status: true },
    });
    if (!course) return null;

    // Non-PUBLISHED courses: only visible to instructor or admin
    if (course.status !== 'PUBLISHED') {
      const isOwner = userId && course.instructorId === userId;
      const isAdmin = userRole === 'ADMIN';
      if (!isOwner && !isAdmin) return null;
    }
    const courseId = course.id;

    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
          status: 'ACTIVE',
        },
      });
      isEnrolled = !!enrollment;
    }

    const chapters = await prisma.chapter.findMany({
      where: { courseId, parentId: null },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            attachments: true,
          },
        },
        children: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: { attachments: true },
            },
          },
        },
      },
    });

    const filterLesson = <T extends { videoUrl: string | null; content: string | null; pdfUrl: string | null; description: string | null; attachments: unknown[]; isFree: boolean; isPreview: boolean }>(l: T) => {
      const { videoUrl, content, pdfUrl, description, attachments, ...rest } = l;
      if (isEnrolled) {
        return { ...rest, videoUrl, content, pdfUrl, description, attachments };
      }
      const canAccessFree = (l.isFree === true) || (l.isPreview === true);
      if (canAccessFree) {
        return { ...rest, videoUrl, content, pdfUrl, description, attachments };
      }
      return { ...rest, attachments: [] };
    };

    const chaptersWithFilteredLessons = chapters.map((ch) => ({
      ...ch,
      lessons: ch.lessons.map(filterLesson),
      children: ch.children.map((sub) => ({
        ...sub,
        lessons: sub.lessons.map(filterLesson),
      })),
    }));

    return { courseId, chapters: chaptersWithFilteredLessons, isEnrolled };
  },

  async create(instructorId: string, input: CreateCourseInput, isAdmin = false) {
    const baseSlug = slugify(input.title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    let status = input.status || 'DRAFT';
    if (!isAdmin && (status === 'PUBLISHED' || status === 'published')) {
      status = 'REVIEW';
    }

    return prisma.course.create({
      data: {
        ...input,
        slug,
        instructorId,
        status,
      },
    });
  },

  async update(id: string, userId: string, input: UpdateCourseInput, userRole?: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return null;
    const isAdmin = userRole === 'ADMIN';
    if (course.instructorId !== userId && !isAdmin) return null;

    // Instructors cannot set status to PUBLISHED - only admin can approve
    const data = { ...input };
    if (!isAdmin && data.status === 'PUBLISHED') {
      data.status = 'REVIEW';
    }

    return prisma.course.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string, userRole: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return null;
    const canDelete =
      course.instructorId === userId || userRole === 'ADMIN';
    if (!canDelete) return null;

    await prisma.course.delete({ where: { id } });
    return true;
  },

  async updateStatus(
    id: string,
    userId: string,
    userRole: string,
    status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT'
  ) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return null;
    const isAdmin = userRole === 'ADMIN';
    const canUpdate = course.instructorId === userId || isAdmin;
    if (!canUpdate) return null;

    // Only admin can set status to PUBLISHED (approve course)
    const effectiveStatus = !isAdmin && status === 'PUBLISHED' ? 'REVIEW' : status;

    return prisma.course.update({
      where: { id },
      data: { status: effectiveStatus },
    });
  },

  async recalculateTotalVideoSize(courseId: string) {
    const result = await prisma.lesson.aggregate({
      where: {
        chapter: { courseId },
        videoSize: { not: null },
      },
      _sum: { videoSize: true },
    });
    const totalVideoSize = result._sum.videoSize ?? 0;
    await prisma.course.update({
      where: { id: courseId },
      data: { totalVideoSize },
    });
    return totalVideoSize;
  },
};
