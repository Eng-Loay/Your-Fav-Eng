import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { getTotalPointsForStudents } from '../teacher/points.service';

export const usersService = {
  async getDashboardStats(userId: string) {
    const [enrolled, completed, certificates, wishlist, pointsMap] = await Promise.all([
      prisma.enrollment.count({
        where: { userId, status: 'ACTIVE' },
      }),
      prisma.enrollment.count({
        where: { userId, status: 'COMPLETED' },
      }),
      prisma.certificate.count({
        where: { userId },
      }),
      prisma.wishlistItem.count({
        where: { userId },
      }),
      getTotalPointsForStudents([userId]),
    ]);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: { duration: true },
        },
      },
    });

    const totalMinutes = enrollments.reduce((sum, e) => sum + (e.course?.duration ?? 0), 0);
    const hours = Math.round(totalMinutes / 60 * 10) / 10;

    return {
      enrolledCourses: enrolled,
      completedCourses: completed,
      totalHours: hours,
      certificates,
      wishlistCount: wishlist,
      totalPoints: pointsMap.get(userId) ?? 0,
    };
  },

  async getEnrolledCourses(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            duration: true,
            instructor: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });
  },

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            chapters: {
              include: {
                lessons: {
                  select: { id: true, title: true, duration: true },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) return null;

    const lessonIds = enrollment.course.chapters.flatMap((c) => c.lessons.map((l) => l.id));
    const progress = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, completed: true, watchTime: true },
    });

    const totalLessons = lessonIds.length;
    const completedLessons = progress.filter((p) => p.completed).length;

    return {
      enrollment,
      progress: progress.map((p) => ({ lessonId: p.lessonId, completed: p.completed, watchTime: p.watchTime })),
      totalLessons,
      completedLessons,
      progressPercent: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
    };
  },

  async getBillingSummary(userId: string) {
    const [orders, paymentRequests] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentRequest.findMany({
        where: { userId, status: 'APPROVED' },
        include: { course: { select: { title: true, titleAr: true } } },
      }),
    ]);

    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
    const totalSpent =
      completedOrders.reduce((sum, o) => sum + o.total, 0) +
      paymentRequests.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOrders = completedOrders.length + paymentRequests.length;

    const lastOrder = completedOrders[0];
    const lastPayment = paymentRequests[0];
    let lastPurchaseDate = '';
    if (lastOrder?.createdAt && lastPayment?.createdAt) {
      lastPurchaseDate =
        lastOrder.createdAt > lastPayment.createdAt
          ? lastOrder.createdAt.toISOString().split('T')[0]
          : lastPayment.createdAt.toISOString().split('T')[0];
    } else if (lastOrder?.createdAt) {
      lastPurchaseDate = lastOrder.createdAt.toISOString().split('T')[0];
    } else if (lastPayment?.createdAt) {
      lastPurchaseDate = lastPayment.createdAt.toISOString().split('T')[0];
    }

    return {
      totalOrders,
      totalSpent,
      currency: 'USD',
      lastPurchaseDate: lastPurchaseDate || null,
    };
  },

  async getTransactions(userId: string, query: Record<string, unknown>) {
    const { parsePagination } = await import('../../utils/helpers');
    const { page, limit, skip } = parsePagination(query);

    const [orders, paymentRequests] = await Promise.all([
      prisma.order.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { course: { select: { title: true, titleAr: true } } } } },
      }),
      prisma.paymentRequest.findMany({
        where: { userId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: { course: { select: { title: true, titleAr: true } } },
      }),
    ]);

    const orderItems = orders.map((o) => {
      const displayTotal =
        o.total !== 0
          ? o.total
          : (o.subtotal ?? o.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0));
      return {
        id: o.id,
        total: displayTotal,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items,
        source: 'order' as const,
      };
    });
    const paymentItems = paymentRequests.map((p) => ({
      id: p.id,
      total: Number(p.amount),
      status: 'COMPLETED',
      createdAt: p.createdAt,
      items: [{ title: p.course?.title ?? p.course?.titleAr ?? 'Course', course: p.course }],
      source: 'payment_request' as const,
    }));
    const combined = [...orderItems, ...paymentItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const paginated = combined.slice(skip, skip + limit);

    return { data: paginated, total: combined.length, page, limit };
  },

  async getWishlist(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            discountPrice: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });
  },

  async toggleWishlist(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) return null;

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { userId_courseId: { userId, courseId } },
      });
      return { added: false };
    }

    await prisma.wishlistItem.create({
      data: { userId, courseId },
    });
    return { added: true };
  },

  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        bio: true,
        studentProfile: true,
      },
    });
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; city?: string; country?: string; bio?: string }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        bio: true,
      },
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) return null;

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return false;

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return true;
  },

  async getComprehensiveExamsForStudent(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    const exams = await prisma.comprehensiveExam.findMany({
      where: { courseId: { in: courseIds }, status: 'active' },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        _count: { select: { questions: true } },
      },
    });
    const results = await prisma.comprehensiveExamResult.findMany({
      where: { studentId: userId, comprehensiveExamId: { in: exams.map((e) => e.id) } },
    });
    const resultMap = new Map(results.map((r) => [r.comprehensiveExamId, r]));
    return exams.map((e) => ({
      ...e,
      questionsCount: e._count.questions,
      myResult: resultMap.get(e.id) ?? null,
    }));
  },

  async getComprehensiveExamForStudent(userId: string, examId: string) {
    const exam = await prisma.comprehensiveExam.findUnique({
      where: { id: examId },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!exam) return null;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: exam.courseId }, status: 'ACTIVE' },
    });
    if (!enrollment) return null;
    const existing = await prisma.comprehensiveExamResult.findUnique({
      where: { comprehensiveExamId_studentId: { comprehensiveExamId: examId, studentId: userId } },
    });
    return { ...exam, existingResult: existing };
  },

  async completeComprehensiveExam(userId: string, examId: string, answers: Array<{ questionId: string; answer: string }>) {
    const exam = await prisma.comprehensiveExam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });
    if (!exam) return null;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: exam.courseId }, status: 'ACTIVE' },
    });
    if (!enrollment) return null;
    const existing = await prisma.comprehensiveExamResult.findUnique({
      where: { comprehensiveExamId_studentId: { comprehensiveExamId: examId, studentId: userId } },
    });
    const maxAttempts = exam.maxAttempts ?? 2;
    if (existing && existing.attempts >= maxAttempts) return { error: 'Max attempts reached' };

    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
    let totalScore = 0;
    let maxScore = 0;
    for (const q of exam.questions) {
      maxScore += q.points;
      const userAnswer = answerMap.get(q.id);
      if (!userAnswer) continue;
      let correct = false;
      if (q.correctAnswer) {
        correct = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      } else if (q.options) {
        try {
          const opts = JSON.parse(q.options) as Array<{ id?: string; isCorrect?: boolean }>;
          const correctOpt = opts.find((o) => o.isCorrect);
          if (correctOpt) correct = userAnswer === String(correctOpt.id);
        } catch {}
      }
      if (correct) totalScore += q.points;
    }
    const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passingThreshold = (exam as { passingScoreForCertificate?: number | null }).passingScoreForCertificate ?? exam.passingScore;
    const passed = scorePercent >= exam.passingScore;
    const certEligible = passed && scorePercent >= passingThreshold;

    const result = await prisma.comprehensiveExamResult.upsert({
      where: { comprehensiveExamId_studentId: { comprehensiveExamId: examId, studentId: userId } },
      create: {
        comprehensiveExamId: examId,
        studentId: userId,
        score: scorePercent,
        passed,
        attempts: 1,
      },
      update: {
        score: scorePercent,
        passed,
        attempts: { increment: 1 },
      },
    });

    const examWithCert = exam as { hasCertificate?: boolean; certificateTemplateId?: string | null };
    let certificate: { id: string } | null = null;
    if (certEligible && examWithCert.hasCertificate && examWithCert.certificateTemplateId) {
      const { certificatesService } = await import('../certificates/certificates.service');
      certificate = await certificatesService.issue(userId, exam.courseId, scorePercent, examWithCert.certificateTemplateId, { skipEnrollmentCheck: true });
    }

    return { result, score: scorePercent, passed, certificateId: certificate?.id ?? null };
  },

  /** A student's group(s) with a ranked leaderboard of points against groupmates. Empty if not in any group. */
  async getMyGroups(userId: string) {
    const memberships = await prisma.classStudent.findMany({
      where: { studentId: userId, status: 'active' },
      include: { class: { select: { id: true, name: true, nameAr: true, subject: true } } },
    });
    if (memberships.length === 0) return [];

    const classIds = memberships.map((m) => m.classId);
    const allClassStudents = await prisma.classStudent.findMany({
      where: { classId: { in: classIds }, status: 'active' },
    });
    const allStudentIds = [...new Set(allClassStudents.map((cs) => cs.studentId))];
    const users = await prisma.user.findMany({
      where: { id: { in: allStudentIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const pointsMap = await getTotalPointsForStudents(allStudentIds);

    return memberships.map((m) => {
      const memberIds = allClassStudents.filter((cs) => cs.classId === m.classId).map((cs) => cs.studentId);
      const leaderboard = memberIds
        .map((sid) => ({
          userId: sid,
          name: userMap.get(sid)?.name ?? 'Unknown',
          avatar: userMap.get(sid)?.avatar ?? null,
          points: pointsMap.get(sid) ?? 0,
          isMe: sid === userId,
        }))
        .sort((a, b) => b.points - a.points);
      const myRank = leaderboard.findIndex((r) => r.userId === userId) + 1;

      return {
        classId: m.classId,
        className: m.class.name,
        classNameAr: m.class.nameAr,
        subject: m.class.subject,
        myPoints: pointsMap.get(userId) ?? 0,
        myRank,
        totalMembers: leaderboard.length,
        leaderboard,
      };
    });
  },

  async getMyComprehensiveExamResults(userId: string) {
    return prisma.comprehensiveExamResult.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        comprehensiveExam: {
          select: { id: true, title: true, titleAr: true, courseId: true, course: { select: { title: true, titleAr: true } } },
        },
      },
    });
  },
};
