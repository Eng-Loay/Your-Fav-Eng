import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

// ==================== COMMISSION ENGINE ====================

import { getCommissionConfig, calculatePlatformFee } from '../../services/commission.service';

async function getInstructorStudentCount(instructorId: string): Promise<number> {
  const [enrollmentCount, prCount] = await Promise.all([
    prisma.enrollment.count({
      where: { course: { instructorId }, status: 'ACTIVE' },
    }),
    prisma.paymentRequest.count({
      where: { status: 'APPROVED', courseId: { not: null }, course: { instructorId } },
    }),
  ]);
  const enrolledIds = await prisma.enrollment.findMany({
    where: { course: { instructorId }, status: 'ACTIVE' },
    select: { userId: true },
    distinct: ['userId'],
  });
  const prIds = await prisma.paymentRequest.findMany({
    where: { status: 'APPROVED', courseId: { not: null }, course: { instructorId } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const uniqueIds = new Set([...enrolledIds.map(e => e.userId), ...prIds.map(p => p.userId)]);
  return uniqueIds.size;
}

interface CommissionResult {
  platformFee: number;
  commissionType: string;
  commissionDetail: string;
}

async function calculateCommission(
  instructorId: string,
  totalRevenue: number,
  revenueSharePercent: number,
): Promise<CommissionResult> {
  const config = await getCommissionConfig(instructorId);
  const instructorGross = totalRevenue * (revenueSharePercent / 100);
  const studentCount = await getInstructorStudentCount(instructorId);

  const platformFeeRaw = await calculatePlatformFee(config, instructorGross, studentCount);
  const platformFee = Math.round(platformFeeRaw * 100) / 100;

  let commissionDetail = '';
  if (config.type === 'percentage') {
    commissionDetail = `${config.percentage}%`;
  } else if (config.type === 'per_student') {
    commissionDetail = `${config.amountPerStudent} × ${studentCount} طلاب`;
  } else if (config.type === 'tiered') {
    commissionDetail = `شرائح (${studentCount} طالب)`;
  } else {
    return { platformFee: 0, commissionType: 'none', commissionDetail: 'لا عمولة' };
  }

  return {
    platformFee,
    commissionType: config.type,
    commissionDetail,
  };
}

async function getPlatformCommissionRate(instructorId?: string): Promise<number> {
  const config = await getCommissionConfig(instructorId);
  return config.type === 'percentage' ? config.percentage / 100 : 0;
}

async function getInstructorCourseRevenue(instructorId: string): Promise<number> {
  const revenueByCourse = await getInstructorRevenueByCourse(instructorId);
  const orderRevenue = revenueByCourse.reduce((sum, r) => sum + r.revenue, 0);
  return orderRevenue;
}

async function getInstructorRevenueByCourse(instructorId: string) {
  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      items: { some: { course: { instructorId } } },
    },
    include: { items: { include: { course: { select: { instructorId: true, title: true, titleAr: true } } } } },
  });
  const byCourse = new Map<string, { courseId: string; title: string; titleAr?: string; revenue: number }>();
  for (const order of orders) {
    const totalItemsValue = order.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
    if (totalItemsValue <= 0) continue;
    for (const item of order.items) {
      const course = (item as any).course;
      if (!item.courseId || !course || course.instructorId !== instructorId) continue;
      const itemValue = item.price * (item.quantity ?? 1);
      const share = order.total * (itemValue / totalItemsValue);
      const existing = byCourse.get(item.courseId);
      if (existing) {
        existing.revenue += share;
      } else {
        byCourse.set(item.courseId, {
          courseId: item.courseId,
          title: course.title ?? 'Course',
          titleAr: course.titleAr ?? undefined,
          revenue: share,
        });
      }
    }
  }
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      status: 'APPROVED',
      courseId: { not: null },
      course: { instructorId },
    },
    include: { course: { select: { id: true, title: true, titleAr: true } } },
  });
  for (const pr of paymentRequests) {
    if (!pr.courseId || !pr.course) continue;
    const amount = Number(pr.amount);
    const existing = byCourse.get(pr.courseId);
    if (existing) {
      existing.revenue += amount;
    } else {
      byCourse.set(pr.courseId, {
        courseId: pr.courseId,
        title: pr.course.title ?? 'Course',
        titleAr: pr.course.titleAr ?? undefined,
        revenue: amount,
      });
    }
  }
  return Array.from(byCourse.values());
}

export interface UpdateInstructorProfileInput {
  specialty?: string;
  experience?: string;
  website?: string;
  twitter?: string;
  payoutMethod?: string;
  payoutEmail?: string;
  bankDetails?: Record<string, unknown>;
  revenueShare?: number;
}

export interface UpdatePaymentSettingsInput {
  payoutMethod?: string;
  payoutEmail?: string;
  bankDetails?: Record<string, unknown>;
}

export interface UpdateNotificationSettingsInput {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  settings?: Record<string, unknown>;
}

export interface ReplyToReviewInput {
  reply: string;
}

export interface CreateConversationInput {
  userId: string;
  title?: string;
}

export interface SendMessageInput {
  content?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'audio';
}

export const instructorService = {
  async getDashboardStats(instructorId: string) {
    const [courses, enrollments, revenueItems] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId },
        select: {
          id: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
        },
      }),
      prisma.enrollment.count({
        where: { course: { instructorId }, status: 'ACTIVE' },
      }),
      prisma.orderItem.findMany({
        where: {
          order: { status: 'COMPLETED' },
          course: { instructorId },
          courseId: { not: null },
        },
        select: { price: true, quantity: true },
      }),
    ]);

    const totalCourses = courses.length;
    const totalStudents = enrollments;
    const totalRevenue = revenueItems.reduce(
      (s, i) => s + i.price * (i.quantity ?? 1),
      0
    );
    const ratings = courses.filter((c) => c.averageRating > 0).map((c) => c.averageRating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      totalCourses,
      totalStudents,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRating: Math.round(avgRating * 100) / 100,
    };
  },

  async getMonthlyRevenue(instructorId: string, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        course: { instructorId },
        courseId: { not: null },
      },
      select: {
        price: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const item of items) {
      const d = item.order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rev = item.price * (item.quantity ?? 1);
      byMonth.set(key, (byMonth.get(key) ?? 0) + rev);
    }

    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));
  },

  async getRecentEnrollments(instructorId: string, limit = 10) {
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { instructorId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        course: { select: { id: true, title: true } },
      },
    });
    return enrollments;
  },

  async getTopCourses(instructorId: string, limit = 5) {
    const courses = await prisma.course.findMany({
      where: { instructorId, status: 'PUBLISHED' },
      orderBy: [{ totalStudents: 'desc' }, { averageRating: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        totalStudents: true,
        averageRating: true,
        totalReviews: true,
      },
    });
    return courses;
  },

  async listCourses(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          thumbnail: true,
          price: true,
          status: true,
          totalStudents: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
          chapters: {
            select: {
              lessons: { select: { duration: true } },
            },
          },
        },
      }),
      prisma.course.count({ where: { instructorId } }),
    ]);

    const courseIds = courses.map((c) => c.id);
    const revenueByCourse = await getInstructorRevenueByCourse(instructorId);
    const revenueMap = new Map(revenueByCourse.map((r) => [r.courseId, r.revenue]));

    const coursesWithStats = courses.map((c) => {
      const lessonsCount = c.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
      const totalMinutes = c.chapters.reduce(
        (sum, ch) => sum + ch.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
        0
      );
      const { chapters, ...rest } = c;
      return {
        ...rest,
        revenue: revenueMap.get(c.id) ?? 0,
        lessons: lessonsCount,
        hours: Math.round(totalMinutes / 60),
      };
    });

    return { data: coursesWithStats, total, page, limit };
  },

  async listEnrolledStudents(instructorId: string) {
    const [enrollments, approvedRequests] = await Promise.all([
      prisma.enrollment.findMany({
        where: { course: { instructorId }, status: 'ACTIVE' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED', courseId: { not: null }, course: { instructorId } },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
    ]);
    const seen = new Set<string>();
    const students: { id: string; name: string; avatar: string | null }[] = [];
    for (const e of enrollments) {
      if (e.user && !seen.has(e.user.id)) {
        seen.add(e.user.id);
        students.push({ id: e.user.id, name: e.user.name, avatar: e.user.avatar });
      }
    }
    for (const pr of approvedRequests) {
      if (pr.user && !seen.has(pr.user.id)) {
        seen.add(pr.user.id);
        students.push({ id: pr.user.id, name: pr.user.name, avatar: pr.user.avatar });
      }
    }
    return students;
  },

  async listStudents(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      course: { instructorId },
      status: 'ACTIVE',
    };

    const [enrollments, enrollmentCount, paymentRequests] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          course: { select: { id: true, title: true, titleAr: true } },
        },
      }),
      prisma.enrollment.count({ where: enrollmentWhere }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED', courseId: { not: null }, course: { instructorId } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          course: { select: { id: true, title: true, titleAr: true } },
        },
      }),
    ]);

    const seen = new Set<string>();
    const combined: any[] = [];
    for (const e of enrollments) {
      const key = `${e.userId}-${e.courseId}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(e);
      }
    }
    for (const pr of paymentRequests) {
      const key = `${pr.userId}-${pr.courseId}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({
          id: pr.id,
          userId: pr.userId,
          courseId: pr.courseId,
          status: 'ACTIVE',
          progress: 0,
          createdAt: pr.createdAt,
          updatedAt: pr.createdAt,
          user: pr.user,
          course: pr.course,
        });
      }
    }

    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = combined.length;
    const paginated = combined.slice(skip, skip + limit);

    return { data: paginated, total, page, limit };
  },

  async exportStudents(instructorId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { instructorId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, titleAr: true } },
      },
    });

    return enrollments.map((e) => ({
      studentId: e.userId,
      studentName: e.user.name,
      studentEmail: e.user.email,
      courseId: e.courseId,
      courseTitle: e.course.title,
      enrolledAt: e.createdAt,
      progress: e.progress,
    }));
  },

  async getRevenueSummary(instructorId: string) {
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [profile, revenueByCourse, thisMonthOrders, paymentRequestsThisMonth, pendingPayouts] = await Promise.all([
      prisma.teacherProfile.findUnique({
        where: { userId: instructorId },
      }),
      getInstructorRevenueByCourse(instructorId),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thisMonthStart },
          items: { some: { course: { instructorId } } },
        },
        include: { items: { include: { course: { select: { instructorId: true } } } } },
      }),
      prisma.paymentRequest.findMany({
        where: {
          status: 'APPROVED',
          reviewedAt: { gte: thisMonthStart },
          course: { instructorId },
        },
        select: { amount: true },
      }),
      prisma.payout.aggregate({
        where: {
          userId: instructorId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = revenueByCourse.reduce((s, r) => s + r.revenue, 0);
    let thisMonthRevenue = 0;
    for (const order of thisMonthOrders) {
      const totalItemsValue = order.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
      if (totalItemsValue <= 0) continue;
      for (const item of order.items) {
        const itemCourse = (item as { course?: { instructorId: string } }).course;
        if (!item.courseId || !itemCourse || itemCourse.instructorId !== instructorId) continue;
        const itemValue = item.price * (item.quantity ?? 1);
        thisMonthRevenue += order.total * (itemValue / totalItemsValue);
      }
    }
    thisMonthRevenue += paymentRequestsThisMonth.reduce((s, p) => s + Number(p.amount), 0);

    const revenueShare = (profile?.revenueShare ?? 70) / 100;
    const instructorShare = totalRevenue * revenueShare;
    const pending = pendingPayouts._sum.amount ?? 0;

    return {
      total: Math.round(totalRevenue * 100) / 100,
      instructorShare: Math.round(instructorShare * 100) / 100,
      thisMonth: Math.round(thisMonthRevenue * 100) / 100,
      pending: Math.round(pending * 100) / 100,
    };
  },

  async getRevenueByCourse(instructorId: string) {
    return getInstructorRevenueByCourse(instructorId);
  },

  async listPayouts(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where: { userId: instructorId },
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.payout.count({ where: { userId: instructorId } }),
    ]);

    return { data: payouts, total, page, limit };
  },

  async getWalletSummary(instructorId: string) {
    const [profile, totalRevenue, paidPayouts, pendingPayouts] = await Promise.all([
      prisma.teacherProfile.findUnique({ where: { userId: instructorId } }),
      getInstructorCourseRevenue(instructorId),
      prisma.payout.aggregate({
        where: { userId: instructorId, status: 'COMPLETED' },
        _sum: { netAmount: true },
      }),
      prisma.payout.aggregate({
        where: { userId: instructorId, status: { in: ['PENDING', 'PROCESSING'] } },
        _sum: { netAmount: true },
      }),
    ]);

    const revenueSharePercent = profile?.revenueShare ?? 70;
    const commission = await calculateCommission(instructorId, totalRevenue, revenueSharePercent);
    const instructorGross = totalRevenue * (revenueSharePercent / 100);
    const totalEarnings = Math.max(0, instructorGross - commission.platformFee);
    const totalPaid = paidPayouts._sum.netAmount ?? 0;
    const totalPending = pendingPayouts._sum.netAmount ?? 0;
    const availableBalance = Math.max(0, totalEarnings - totalPaid - totalPending);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      platformFee: Math.round(commission.platformFee * 100) / 100,
      commissionType: commission.commissionType,
      commissionDetail: commission.commissionDetail,
      revenueSharePercent,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      payoutMethod: profile?.payoutMethod ?? null,
      payoutEmail: profile?.payoutEmail ?? null,
    };
  },

  async requestPayout(instructorId: string, requestedAmount?: number) {
    const wallet = await instructorService.getWalletSummary(instructorId);
    if (!wallet.payoutEmail && !wallet.payoutMethod) return null;

    const amount = requestedAmount && requestedAmount > 0
      ? Math.min(requestedAmount, wallet.availableBalance)
      : wallet.availableBalance;

    if (amount <= 0) return null;

    const commissionRate = await getPlatformCommissionRate(instructorId);
    const profile = await prisma.teacherProfile.findUnique({ where: { userId: instructorId } });

    return prisma.payout.create({
      data: {
        userId: instructorId,
        amount,
        currency: 'USD',
        method: profile?.payoutMethod ?? 'vodafone_cash',
        status: 'PENDING',
        courseRevenue: wallet.totalRevenue,
        studentRevenue: wallet.totalRevenue,
        platformFee: wallet.platformFee,
        netAmount: amount,
      },
    });
  },

  async getAnalyticsMetrics(instructorId: string) {
    const [courses, enrollments, progress, lessonProgress] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId },
        select: { id: true },
      }),
      prisma.enrollment.count({
        where: { course: { instructorId } },
      }),
      prisma.enrollment.aggregate({
        where: { course: { instructorId } },
        _avg: { progress: true },
      }),
      prisma.lessonProgress.aggregate({
        where: {
          lesson: { chapter: { course: { instructorId } } },
        },
        _sum: { watchTime: true },
      }),
    ]);

    const courseIds = courses.map((c) => c.id);
    const totalLessons = await prisma.lesson.count({
      where: { chapter: { courseId: { in: courseIds } } },
    });

    const completionRate = progress._avg.progress ?? 0;
    const totalWatchTime = lessonProgress._sum.watchTime ?? 0;

    return {
      totalCourses: courses.length,
      totalEnrollments: enrollments,
      completionRate: Math.round(completionRate * 100) / 100,
      totalWatchTime,
      totalLessons,
    };
  },

  async getEnrollmentTrends(instructorId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: { instructorId },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const e of enrollments) {
      const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));
  },

  async getCoursePerformance(instructorId: string) {
    const courses = await prisma.course.findMany({
      where: { instructorId },
      select: {
        id: true,
        title: true,
        totalStudents: true,
        averageRating: true,
        totalReviews: true,
      },
    });

    const revenueByCourse = await getInstructorRevenueByCourse(instructorId);
    const revenueMap = new Map(revenueByCourse.map((r) => [r.courseId, r.revenue]));

    return courses.map((c) => ({
      ...c,
      revenue: revenueMap.get(c.id) ?? 0,
    }));
  },

  async getPopularLessons(instructorId: string, limit = 10) {
    const progress = await prisma.lessonProgress.findMany({
      where: {
        lesson: { chapter: { course: { instructorId } } },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            duration: true,
            chapter: { select: { course: { select: { title: true } } } },
          },
        },
      },
    });

    const lessonCounts = new Map<
      string,
      { lesson: (typeof progress)[0]['lesson']; views: number; watchTime: number }
    >();

    for (const p of progress) {
      const lid = p.lessonId;
      const existing = lessonCounts.get(lid);
      if (existing) {
        existing.views += 1;
        existing.watchTime += p.watchTime;
      } else {
        lessonCounts.set(lid, {
          lesson: p.lesson,
          views: 1,
          watchTime: p.watchTime,
        });
      }
    }

    return Array.from(lessonCounts.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },

  async listReviews(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { course: { instructorId } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.review.count({ where: { course: { instructorId } } }),
    ]);

    return { data: reviews, total, page, limit };
  },

  async getReviewSummary(instructorId: string) {
    const reviews = await prisma.review.findMany({
      where: { course: { instructorId } },
      select: { rating: true },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      distribution[r.rating as keyof typeof distribution]++;
      sum += r.rating;
    }

    return {
      total: reviews.length,
      average: reviews.length > 0 ? sum / reviews.length : 0,
      distribution,
    };
  },

  async replyToReview(reviewId: string, instructorId: string, reply: string) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, course: { instructorId } },
    });
    if (!review) return null;

    return prisma.review.update({
      where: { id: reviewId },
      data: { reply, repliedAt: new Date() },
    });
  },

  async reportReview(reviewId: string, instructorId: string) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, course: { instructorId } },
    });
    if (!review) return null;

    return prisma.review.update({
      where: { id: reviewId },
      data: { reported: true },
    });
  },

  async listConversations(instructorId: string, query: Record<string, unknown>) {
    const { messagesService } = await import('../messages/messages.service');
    const [enrolledStudents, enrolledParents] = await Promise.all([
      this.listEnrolledStudents(instructorId),
      messagesService.listEnrolledStudentsParents(instructorId),
    ]);
    const enrolledStudentIds = new Set(enrolledStudents.map((s: { id: string }) => s.id));
    const enrolledParentIds = new Set(enrolledParents.map((p: { id: string }) => p.id));

    const members = await prisma.conversationMember.findMany({
      where: { userId: instructorId },
      orderBy: { joinedAt: 'desc' },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: instructorId } },
              include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const filtered = members.filter((m) => {
      if (m.conversation.isGroup) return true;
      const other = m.conversation.members[0]?.user;
      if (!other) return false;
      return enrolledStudentIds.has(other.id) || enrolledParentIds.has(other.id);
    });

    const { page, limit, skip } = parsePagination(query);
    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit).map((m) => ({
      ...m.conversation,
      otherMember: m.conversation.members[0]?.user,
      lastMessage: m.conversation.messages[0],
    }));

    return { data, total, page, limit };
  },

  async getConversationMessages(conversationId: string, instructorId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: instructorId },
    });
    if (!member) return null;

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  async createConversation(instructorId: string, input: CreateConversationInput) {
    const { messagesService } = await import('../messages/messages.service');
    const [enrolledStudents, enrolledParents] = await Promise.all([
      this.listEnrolledStudents(instructorId),
      messagesService.listEnrolledStudentsParents(instructorId),
    ]);
    const allowedIds = new Set([
      ...enrolledStudents.map((s: { id: string }) => s.id),
      ...enrolledParents.map((p: { id: string }) => p.id),
    ]);
    if (!allowedIds.has(input.userId)) return null;

    const existing = await prisma.conversationMember.findFirst({
      where: {
        userId: instructorId,
        conversation: {
          isGroup: false,
          members: { some: { userId: input.userId } },
        },
      },
      include: { conversation: true },
    });
    if (existing) return existing.conversation;

    const conversation = await prisma.conversation.create({
      data: {
        title: input.title,
        isGroup: false,
        members: {
          create: [
            { userId: instructorId },
            { userId: input.userId },
          ],
        },
      },
    });

    return conversation;
  },

  async sendMessage(
    conversationId: string,
    instructorId: string,
    input: SendMessageInput
  ) {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: instructorId },
      include: { conversation: { include: { members: true } } },
    });
    if (!member) return null;

    const otherMembers = member.conversation.members.filter((m) => m.userId !== instructorId);
    const receiverId = member.conversation.isGroup ? null : otherMembers[0]?.userId ?? null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: instructorId,
        receiverId,
        content: input.content || '',
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentType: input.attachmentType ?? null,
      },
    });

    for (const om of otherMembers) {
      await prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId: om.userId } },
        data: { unreadCount: { increment: 1 } },
      });
    }

    return message;
  },

  async getProfile(instructorId: string) {
    return prisma.user.findUnique({
      where: { id: instructorId },
      include: { teacherProfile: true },
    });
  },

  async updateProfile(instructorId: string, input: UpdateInstructorProfileInput) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: instructorId },
    });
    if (!profile) return null;

    return prisma.teacherProfile.update({
      where: { userId: instructorId },
      data: {
        ...input,
        bankDetails: input.bankDetails !== undefined ? JSON.stringify(input.bankDetails) : undefined,
      },
    });
  },

  async updatePaymentSettings(
    instructorId: string,
    input: UpdatePaymentSettingsInput
  ) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: instructorId },
    });
    if (!profile) return null;

    return prisma.teacherProfile.update({
      where: { userId: instructorId },
      data: {
        payoutMethod: input.payoutMethod,
        payoutEmail: input.payoutEmail,
        bankDetails: input.bankDetails !== undefined ? JSON.stringify(input.bankDetails) : undefined,
      },
    });
  },

  async updateNotificationSettings(
    instructorId: string,
    input: UpdateNotificationSettingsInput
  ) {
    const existing = await prisma.notificationSetting.findUnique({
      where: { userId: instructorId },
    });

    const data = {
      email: input.email ?? existing?.email ?? true,
      push: input.push ?? existing?.push ?? true,
      inApp: input.inApp ?? existing?.inApp ?? true,
      settings: input.settings !== undefined ? JSON.stringify(input.settings) : existing?.settings,
    };

    if (existing) {
      return prisma.notificationSetting.update({
        where: { userId: instructorId },
        data,
      });
    }

    return prisma.notificationSetting.create({
      data: { userId: instructorId, ...data },
    });
  },

  // ==================== CONTENT BANK (per-instructor/teacher) ====================
  async listContentBank(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const where = { createdById: userId };
    const [items, total] = await Promise.all([
      prisma.contentBankItem.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.contentBankItem.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async createContentBankItem(userId: string, data: { title: string; titleAr?: string; type: string; content?: string; videoUrl?: string; pdfUrl?: string; duration?: number }) {
    return prisma.contentBankItem.create({ data: { ...data, createdById: userId } });
  },

  async deleteContentBankItem(userId: string, id: string) {
    const item = await prisma.contentBankItem.findUnique({ where: { id } });
    if (!item || item.createdById !== userId) return null;
    return prisma.contentBankItem.delete({ where: { id } });
  },

  // ==================== QUESTION BANK (per-instructor/teacher) ====================
  async listQuestionBank(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const where = { createdById: userId };
    const [items, total] = await Promise.all([
      prisma.questionBankItem.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.questionBankItem.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async createQuestionBankItem(userId: string, data: { question: string; questionAr?: string; type: string; options?: string; correctAnswer?: string; points?: number }) {
    return prisma.questionBankItem.create({ data: { ...data, createdById: userId } });
  },

  async deleteQuestionBankItem(userId: string, id: string) {
    const item = await prisma.questionBankItem.findUnique({ where: { id } });
    if (!item || item.createdById !== userId) return null;
    return prisma.questionBankItem.delete({ where: { id } });
  },

  // ==================== EXAMS (INSTRUCTOR-FILTERED) ====================
  async listExams(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const courseIds = (await prisma.course.findMany({ where: { instructorId }, select: { id: true } })).map(c => c.id);
    const where: Prisma.ExamWhereInput = { OR: [{ creatorId: instructorId }, { courseId: { in: courseIds } }] };
    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          _count: { select: { questions: true, results: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);
    return {
      data: exams.map(e => ({
        ...e, courseTitle: e.course?.titleAr ?? e.course?.title ?? '',
        questionsCount: e._count.questions, participantsCount: e._count.results,
      })),
      total, page, limit,
    };
  },

  async getExamById(instructorId: string, examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: { select: { id: true, title: true, titleAr: true, instructorId: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!exam) return null;
    if (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId) return null;
    return exam;
  },

  async createExam(instructorId: string, data: any) {
    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId }, select: { instructorId: true } });
      if (!course || course.instructorId !== instructorId) return null;
    }
    return prisma.exam.create({ data: { ...data, creatorId: instructorId } });
  },

  async updateExam(instructorId: string, examId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId)) return null;
    return prisma.exam.update({ where: { id: examId }, data });
  },

  async deleteExam(instructorId: string, examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId)) return null;
    return prisma.exam.delete({ where: { id: examId } });
  },

  async getExamQuestions(instructorId: string, examId: string) {
    const exam = await this.getExamById(instructorId, examId);
    if (!exam) return null;
    return exam.questions;
  },

  async addExamQuestion(instructorId: string, examId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId)) return null;
    const maxPos = await prisma.quiz.aggregate({ where: { examId }, _max: { order: true } });
    return prisma.quiz.create({ data: { ...data, examId, order: (maxPos._max.order ?? 0) + 1 } });
  },

  async updateExamQuestion(instructorId: string, examId: string, questionId: string, data: any) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId)) return null;
    return prisma.quiz.update({ where: { id: questionId }, data });
  },

  async deleteExamQuestion(instructorId: string, examId: string, questionId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || (exam.creatorId !== instructorId && exam.course?.instructorId !== instructorId)) return null;
    return prisma.quiz.delete({ where: { id: questionId } });
  },

  async getExamResults(instructorId: string, query: Record<string, unknown>) {
    const courseIds = (await prisma.course.findMany({ where: { instructorId }, select: { id: true } })).map(c => c.id);
    const { page, limit, skip } = parsePagination(query);
    const where = { exam: { OR: [{ creatorId: instructorId }, { courseId: { in: courseIds } }] } };
    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where: where as any, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          exam: { select: { id: true, title: true, titleAr: true } },
        },
      }),
      prisma.examResult.count({ where } as any),
    ]);
    const studentIds = results.map(r => r.studentId);
    const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, email: true } });
    const studentMap = new Map(students.map(s => [s.id, s]));
    return { data: results.map(r => ({ ...r, student: studentMap.get(r.studentId) ?? null })), total, page, limit };
  },

  // ==================== COMPREHENSIVE EXAMS (INSTRUCTOR-FILTERED) ====================
  async listComprehensiveExams(instructorId: string, query: Record<string, unknown>) {
    const courseIds = (await prisma.course.findMany({ where: { instructorId }, select: { id: true } })).map(c => c.id);
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.ComprehensiveExamWhereInput = { courseId: { in: courseIds } };
    const [exams, total] = await Promise.all([
      prisma.comprehensiveExam.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          _count: { select: { questions: true, results: true } },
        },
      }),
      prisma.comprehensiveExam.count({ where }),
    ]);
    return {
      data: exams.map(e => ({
        ...e, courseTitle: e.course?.titleAr ?? e.course?.title ?? '',
        questionsCount: e._count.questions, participantsCount: e._count.results,
      })),
      total, page, limit,
    };
  },

  async getComprehensiveExamById(instructorId: string, examId: string) {
    const exam = await prisma.comprehensiveExam.findUnique({
      where: { id: examId },
      include: {
        course: { select: { id: true, title: true, titleAr: true, instructorId: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!exam || exam.course?.instructorId !== instructorId) return null;
    return exam;
  },

  async createComprehensiveExam(instructorId: string, data: any) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId }, select: { instructorId: true } });
    if (!course || course.instructorId !== instructorId) return null;
    return prisma.comprehensiveExam.create({ data });
  },

  async updateComprehensiveExam(instructorId: string, examId: string, data: any) {
    const exam = await prisma.comprehensiveExam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || exam.course?.instructorId !== instructorId) return null;
    return prisma.comprehensiveExam.update({ where: { id: examId }, data });
  },

  async deleteComprehensiveExam(instructorId: string, examId: string) {
    const exam = await prisma.comprehensiveExam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || exam.course?.instructorId !== instructorId) return null;
    return prisma.comprehensiveExam.delete({ where: { id: examId } });
  },

  async addComprehensiveExamQuestion(instructorId: string, examId: string, data: any) {
    const exam = await prisma.comprehensiveExam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || exam.course?.instructorId !== instructorId) return null;
    const maxPos = await prisma.comprehensiveExamQuestion.aggregate({ where: { comprehensiveExamId: examId }, _max: { order: true } });
    return prisma.comprehensiveExamQuestion.create({ data: { ...data, comprehensiveExamId: examId, order: (maxPos._max.order ?? 0) + 1 } });
  },

  async deleteComprehensiveExamQuestion(instructorId: string, examId: string, questionId: string) {
    const exam = await prisma.comprehensiveExam.findUnique({ where: { id: examId }, include: { course: { select: { instructorId: true } } } });
    if (!exam || exam.course?.instructorId !== instructorId) return null;
    return prisma.comprehensiveExamQuestion.delete({ where: { id: questionId } });
  },

  async getComprehensiveExamResults(instructorId: string, query: Record<string, unknown>) {
    const courseIds = (await prisma.course.findMany({ where: { instructorId }, select: { id: true } })).map(c => c.id);
    const { page, limit, skip } = parsePagination(query);
    const where = { comprehensiveExam: { courseId: { in: courseIds } } };
    const [results, total] = await Promise.all([
      prisma.comprehensiveExamResult.findMany({
        where: where as any, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          comprehensiveExam: { select: { id: true, title: true, titleAr: true } },
        },
      }),
      prisma.comprehensiveExamResult.count({ where } as any),
    ]);
    const studentIds = results.map(r => r.studentId);
    const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, email: true } });
    const studentMap = new Map(students.map(s => [s.id, s]));
    return { data: results.map(r => ({ ...r, student: studentMap.get(r.studentId) ?? null })), total, page, limit };
  },

  // ==================== COURSE ASSIGNMENTS ====================
  async listCourseAssignments(instructorId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const courseId = query.courseId as string | undefined;

    const where: { instructorId: string; courseId?: string } = { instructorId };
    if (courseId) where.courseId = courseId;

    const [assignments, total] = await Promise.all([
      prisma.courseAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.courseAssignment.count({ where }),
    ]);

    return { data: assignments, total, page, limit };
  },

  async createCourseAssignment(instructorId: string, input: { title: string; titleAr?: string; description?: string; courseId: string; dueDate?: string; totalPoints?: number }) {
    const course = await prisma.course.findFirst({ where: { id: input.courseId, instructorId } });
    if (!course) return null;

    return prisma.courseAssignment.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        courseId: input.courseId,
        instructorId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        totalPoints: input.totalPoints ?? 100,
        status: 'active',
      },
      include: { course: { select: { id: true, title: true } } },
    });
  },

  async getCourseAssignmentByLessonId(lessonId: string, instructorId: string) {
    const assignment = await prisma.courseAssignment.findFirst({ where: { lessonId, instructorId } });
    if (!assignment) return null;
    return this.getCourseAssignmentById(assignment.id, instructorId);
  },

  async getCourseAssignmentById(id: string, instructorId: string) {
    const assignment = await prisma.courseAssignment.findFirst({
      where: { id, instructorId },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        submissions: true,
      },
    });
    if (!assignment) return null;

    const studentIds = assignment.submissions.map((s) => s.studentId);
    const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, avatar: true } });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    return {
      ...assignment,
      submissions: assignment.submissions.map((s) => ({ ...s, student: studentMap.get(s.studentId) ?? null })),
    };
  },

  async updateCourseAssignment(id: string, instructorId: string, input: { title?: string; titleAr?: string; description?: string; dueDate?: string; totalPoints?: number; status?: string }) {
    const assignment = await prisma.courseAssignment.findFirst({ where: { id, instructorId } });
    if (!assignment) return null;

    return prisma.courseAssignment.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
      },
    });
  },

  async deleteCourseAssignment(id: string, instructorId: string) {
    const assignment = await prisma.courseAssignment.findFirst({ where: { id, instructorId } });
    if (!assignment) return null;
    await prisma.courseAssignment.delete({ where: { id } });
    return true;
  },

  async gradeCourseAssignmentSubmission(assignmentId: string, studentId: string, instructorId: string, input: { grade?: number; feedback?: string }) {
    const assignment = await prisma.courseAssignment.findFirst({ where: { id: assignmentId, instructorId } });
    if (!assignment) return null;

    const result = await prisma.courseAssignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: { assignmentId, studentId, grade: input.grade ?? null, feedback: input.feedback ?? null, autoGraded: false, gradedAt: new Date() },
      update: { grade: input.grade ?? undefined, feedback: input.feedback ?? undefined, autoGraded: false, gradedAt: new Date() },
    });
    const grade = input.grade ?? result.grade;
    if (grade != null) {
      import('../../services/notification.service').then(({ notifyAssignmentGraded, notifyParentChildGrade }) => {
        notifyAssignmentGraded(studentId, assignment.title, grade, 'ar').catch(() => {});
        prisma.parentChild.findMany({
          where: { childId: studentId },
          include: { child: { select: { name: true } } },
        }).then((pcs) => {
          for (const pc of pcs) {
            notifyParentChildGrade(pc.parentId, pc.child.name, assignment.title, grade, 'ar').catch(() => {});
          }
        }).catch(() => {});
      }).catch(() => {});
    }
    return result;
  },
};
