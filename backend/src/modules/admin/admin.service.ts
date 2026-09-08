import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import { env } from '../../config/env';
import { Prisma } from '@prisma/client';
import { createZoomMeeting } from '../../services/zoom.service';

function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec} sec ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hour${sec >= 7200 ? 's' : ''} ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} day${sec >= 172800 ? 's' : ''} ago`;
  return `${Math.floor(sec / 2592000)} month${sec >= 5184000 ? 's' : ''} ago`;
}

function formatTimeAgoAr(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `منذ ${sec} ثانية`;
  if (sec < 3600) return `منذ ${Math.floor(sec / 60)} دقيقة`;
  if (sec < 86400) return `منذ ${Math.floor(sec / 3600)} ساعة`;
  if (sec < 2592000) return `منذ ${Math.floor(sec / 86400)} يوم`;
  return `منذ ${Math.floor(sec / 2592000)} شهر`;
}

const CURRENCY_SYMBOLS: Record<string, { symbol: string; position: 'before' | 'after' }> = {
  USD: { symbol: '$', position: 'before' },
  SAR: { symbol: '﷼', position: 'after' },
  AED: { symbol: 'د.إ', position: 'before' },
  EGP: { symbol: 'ج.م', position: 'after' },
  EUR: { symbol: '€', position: 'before' },
  GBP: { symbol: '£', position: 'before' },
};

const SALT_ROUNDS = 10;
const SETTING_GROUPS = ['general', 'email', 'payment', 'appearance', 'branding', 'store', 'features', 'zoom'] as const;
const SETTING_KEYS: Record<string, string[]> = {
  general: [
    'platform_name',
    'site_url',
    'default_language',
    'currency',
    'timezone',
    'support_email',
  ],
  store: [
    'store_enabled',
  ],
  features: [
    'instructors_enabled',
    'video_watermark_enabled',
    'chat_enabled',
  ],
  zoom: [
    'zoom_client_id',
    'zoom_client_secret',
    'zoom_account_id',
  ],
  payment: [
    'stripe_enabled',
    'paypal_enabled',
    'tap_enabled',
    'admin_approval_enabled',
    'coupon_enabled',
    'platform_commission_rate',
    'tax_rate',
    'video_storage_rate_per_gb',
    'stripePublicKey',
    'stripeSecretKey',
  ],
  email: [
    'provider',
    'from_email',
    'smtp_host',
    'smtp_port',
    'smtp_username',
    'smtp_password',
  ],
  appearance: [
    'primary_color',
    'secondary_color',
    'font',
    'button_style',
    'custom_css',
  ],
  branding: [
    'platformName',
    'logo',
    'headerColor',
    'footerColor',
    'contactPhone',
    'contactEmail',
    'contactAddress',
    'socialTwitter',
    'socialLinkedin',
    'socialYoutube',
    'socialFacebook',
    'socialInstagram',
  ],
};

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  country?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  country?: string;
  phone?: string;
  bio?: string;
}

export interface ListUsersFilters {
  search?: string;
  role?: string;
  status?: string;
}

export interface UpdateSettingsInput {
  [key: string]: string | number | boolean;
}

export interface CreateContentInput {
  type: string;
  title: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
  slug?: string;
  image?: string;
  status?: string;
  position?: number;
  category?: string;
  author?: string;
}

export interface UpdateContentInput extends Partial<CreateContentInput> {}

export interface CreateServiceBundleInput {
  kind: 'SERVICE' | 'BUNDLE';
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  price?: number;
  ctaUrl?: string;
  status?: 'active' | 'inactive';
  position?: number;
}

export interface UpdateServiceBundleInput extends Partial<CreateServiceBundleInput> {}

export interface CreateExamInput {
  title: string;
  titleAr?: string;
  courseId?: string;
  classId?: string;
  creatorId: string;
  instructions?: string;
  duration?: number;
  maxAttempts?: number;
  passingScore?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  showCorrectAnswer?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
}

export interface SendNotificationInput {
  target: 'all' | 'students' | 'teachers' | 'instructors' | 'specific';
  title: string;
  message: string;
  type?: string;
  userIds?: string[];
}

export const adminService = {
  // ==================== DASHBOARD ====================
  async getDashboardStats() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      totalCourses,
      totalStudents,
      totalTeachers,
      totalEnrollments,
      totalCertificates,
      revenueResult,
      usersThisMonth,
      usersLastMonth,
      enrollmentsThisMonth,
      enrollmentsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      certificatesThisMonth,
      certificatesLastMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.certificate.count(),
      prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.enrollment.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.enrollment.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: thisMonthStart } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { total: true } }),
      prisma.certificate.count({ where: { issuedAt: { gte: thisMonthStart } } }),
      prisma.certificate.count({ where: { issuedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ]);

    const calcChange = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 1000) / 10);

    return {
      users: totalUsers,
      courses: totalCourses,
      students: totalStudents,
      teachers: totalTeachers,
      revenue: revenueResult._sum.total ?? 0,
      enrollments: totalEnrollments,
      certificates: totalCertificates,
      usersChange: calcChange(usersThisMonth, usersLastMonth),
      enrollmentsChange: calcChange(enrollmentsThisMonth, enrollmentsLastMonth),
      revenueChange: calcChange(revenueThisMonth._sum.total ?? 0, revenueLastMonth._sum.total ?? 0),
      certificatesChange: calcChange(certificatesThisMonth, certificatesLastMonth),
      lastUpdated: now.toISOString(),
    };
  },

  async getMonthlyRevenue(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { total: true, createdAt: true },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + order.total);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, revenue]) => {
        const [y, m] = key.split('-');
        const shortMonth = monthNames[parseInt(m, 10) - 1] || m;
        return { month: shortMonth, monthKey: key, value: Math.round(revenue * 100) / 100, revenue: Math.round(revenue * 100) / 100 };
      });
  },

  async getUserGrowth(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const user of users) {
      const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        const [, m] = key.split('-');
        const shortMonth = monthNames[parseInt(m, 10) - 1] || m;
        return { month: shortMonth, monthKey: key, value: count, count };
      });
  },

  async getEnrollmentsByCourse(limit = 6) {
    const enrollments = await prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const sorted = enrollments.sort((a, b) => b._count.id - a._count.id).slice(0, limit);
    const courseIds = sorted.map((e) => e.courseId).filter(Boolean);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, titleAr: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.title || c.titleAr]));

    return sorted.map((e) => ({
      name: courseMap.get(e.courseId) || 'Unknown',
      value: e._count.id,
      courseId: e.courseId,
    }));
  },

  async getEnrollmentsByCategory(limit = 6) {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE' },
      include: { course: { select: { category: true } } },
    });

    const byCategory = new Map<string, number>();
    for (const e of enrollments) {
      const cat = e.course?.category || 'غير مصنف';
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    }

    return Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  },

  async getTopCourses(limit = 10, sortBy: 'students' | 'revenue' = 'students') {
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { status: 'COMPLETED' } },
      select: { courseId: true, price: true, quantity: true },
    });
    const revenueByCourse = new Map<string, number>();
    for (const item of orderItems) {
      if (item.courseId) {
        const rev = item.price * (item.quantity ?? 1);
        revenueByCourse.set(item.courseId, (revenueByCourse.get(item.courseId) ?? 0) + rev);
      }
    }

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { totalStudents: 'desc' },
      take: limit * 2,
      select: {
        id: true,
        title: true,
        titleAr: true,
        slug: true,
        thumbnail: true,
        totalStudents: true,
        averageRating: true,
        price: true,
        instructor: { select: { id: true, name: true } },
      },
    });

    const withRevenue = courses.map((c) => ({
      ...c,
      students: c.totalStudents,
      revenue: revenueByCourse.get(c.id) ?? 0,
      rating: c.averageRating,
      instructor: c.instructor?.name ?? '',
    }));

    if (sortBy === 'revenue') {
      return withRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    }
    return withRevenue.slice(0, limit);
  },

  async getRecentActivity(limit = 20) {
    const activityLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (activityLogs.length > 0) {
      const userIds = [...new Set(activityLogs.map((a) => a.userId).filter(Boolean))] as string[];
      const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : [];
      const userMap = new Map(users.map((u) => [u.id, u.name]));
      return activityLogs.map((a) => ({
        id: a.id,
        user: (a.userId && userMap.get(a.userId)) || 'System',
        action: a.details || a.action,
        actionAr: a.details || a.action,
        time: formatTimeAgo(a.createdAt),
        timeAr: formatTimeAgoAr(a.createdAt),
        createdAt: a.createdAt,
      }));
    }

    const [recentEnrollments, recentOrders, recentCerts, recentReviews, currencySetting] = await Promise.all([
      prisma.enrollment.findMany({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
        include: { user: { select: { name: true } }, course: { select: { title: true, titleAr: true } } },
      }),
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
        include: { user: { select: { name: true } } },
      }),
      prisma.certificate.findMany({
        orderBy: { issuedAt: 'desc' },
        take: Math.ceil(limit / 4),
        include: { user: { select: { name: true } }, course: { select: { title: true, titleAr: true } } },
      }),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
        include: { user: { select: { name: true } }, course: { select: { title: true, titleAr: true } } },
      }),
      prisma.platformSetting.findFirst({ where: { group: 'general', key: 'currency' } }),
    ]);

    const items: { id: string; user: string; action: string; actionAr: string; time: string; timeAr: string; createdAt: Date }[] = [];
    for (const e of recentEnrollments) {
      items.push({
        id: e.id,
        user: e.user?.name ?? '',
        action: `enrolled in ${e.course?.title ?? 'course'}`,
        actionAr: `سجل في ${e.course?.titleAr ?? e.course?.title ?? 'دورة'}`,
        time: formatTimeAgo(e.createdAt),
        timeAr: formatTimeAgoAr(e.createdAt),
        createdAt: e.createdAt,
      });
    }
    const currencyCode = (currencySetting?.value || 'USD').toUpperCase();
    const currConfig = CURRENCY_SYMBOLS[currencyCode] || CURRENCY_SYMBOLS.USD;
    for (const o of recentOrders) {
      const amt = Number(o.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      const amtStr = currConfig.position === 'before' ? `${currConfig.symbol}${amt}` : `${amt} ${currConfig.symbol}`;
      items.push({
        id: o.id,
        user: o.user?.name ?? '',
        action: `completed payment of ${amtStr}`,
        actionAr: `أكمل دفع ${amtStr}`,
        time: formatTimeAgo(o.createdAt),
        timeAr: formatTimeAgoAr(o.createdAt),
        createdAt: o.createdAt,
      });
    }
    for (const c of recentCerts) {
      const d = c.issuedAt;
      items.push({
        id: c.id,
        user: c.user?.name ?? '',
        action: `earned certificate in ${c.course?.title ?? 'course'}`,
        actionAr: `حصل على شهادة في ${c.course?.titleAr ?? c.course?.title ?? 'دورة'}`,
        time: formatTimeAgo(d),
        timeAr: formatTimeAgoAr(d),
        createdAt: d,
      });
    }
    for (const r of recentReviews) {
      items.push({
        id: r.id,
        user: r.user?.name ?? '',
        action: `left ${r.rating}-star review on ${r.course?.title ?? 'course'}`,
        actionAr: `ترك تقييم ${r.rating} نجوم على ${r.course?.titleAr ?? r.course?.title ?? 'دورة'}`,
        time: formatTimeAgo(r.createdAt),
        timeAr: formatTimeAgoAr(r.createdAt),
        createdAt: r.createdAt,
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, limit);
  },

  // ==================== USERS ====================
  async listUsers(query: Record<string, unknown>, filters: ListUsersFilters) {
    const { page, limit, skip } = parsePagination(query);
    const { search, role, status } = filters;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          country: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit };
  },

  async getUsersStats() {
    const [student, teacher, parent, admin] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'PARENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);
    return { student, teacher, parent, admin, all: student + teacher + parent + admin };
  },

  async getUserDetail(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
        parentProfile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true, titleAr: true, slug: true, thumbnail: true, totalStudents: true } },
          },
        },
        orders: {
          where: { status: 'COMPLETED' },
          select: { id: true, total: true, createdAt: true, items: { select: { title: true, price: true, quantity: true } } },
        },
        paymentRequests: {
          where: { status: 'APPROVED' },
          select: { id: true, amount: true, createdAt: true, course: { select: { title: true, titleAr: true } } },
        },
        childParents: { include: { parent: { select: { id: true, name: true, email: true, phone: true } } } },
        parentChildren: { include: { child: { select: { id: true, name: true, email: true } } } },
        courses: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            slug: true,
            thumbnail: true,
            totalStudents: true,
            price: true,
            status: true,
          },
        },
        certificates: {
          include: {
            course: { select: { id: true, title: true, titleAr: true } },
          },
        },
        _count: { select: { certificates: true, enrollments: true, orders: true, courses: true } },
      },
    });
    if (!user) return null;

    const { password: _, ...safe } = user;

    // Compute totals for students (orders + approved payment requests)
    let totalPaid = 0;
    if (user.orders) {
      totalPaid += user.orders.reduce((sum, o) => sum + Number(o.total), 0);
    }
    const paymentRequests = (user as { paymentRequests?: Array<{ amount: number }> }).paymentRequests;
    if (paymentRequests?.length) {
      totalPaid += paymentRequests.reduce((sum, p) => sum + Number(p.amount), 0);
    }

    // Compute teacher stats
    let instructorStats: { totalSales: number; totalEarnings: number; platformEarnings: number; studentCount: number } | null = null;
    if (user.role === 'TEACHER' && user.teacherProfile) {
      const revShare = (user.teacherProfile.revenueShare ?? 70) / 100;
      const enrollCount = user._count?.enrollments ?? 0;
      instructorStats = {
        totalSales: 0,
        totalEarnings: 0,
        platformEarnings: 0,
        studentCount: enrollCount,
      };
    }

    // For students: fetch comprehensive exam results
    let comprehensiveExamResults: Array<{
      id: string;
      score: number;
      passed: boolean;
      attempts: number;
      comprehensiveExam: { id: string; title: string; titleAr?: string | null };
    }> = [];
    if (user.role === 'STUDENT') {
      const results = await prisma.comprehensiveExamResult.findMany({
        where: { studentId: id },
        include: {
          comprehensiveExam: { select: { id: true, title: true, titleAr: true } },
        },
      });
      comprehensiveExamResults = results.map((r) => ({
        id: r.id,
        score: Number(r.score),
        passed: r.passed,
        attempts: r.attempts,
        comprehensiveExam: r.comprehensiveExam,
      }));
    }

    return {
      ...safe,
      totalPaid,
      instructorStats,
      parent: user.childParents?.[0]?.parent ?? null,
      children: user.parentChildren?.map((pc) => pc.child) ?? [],
      comprehensiveExamResults: user.role === 'STUDENT' ? comprehensiveExamResults : undefined,
    };
  },

  async createUser(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) return null;

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashedPassword,
          name: input.name,
          role: input.role,
          country: input.country,
        },
      });

      switch (input.role) {
        case 'TEACHER':
          await tx.teacherProfile.create({ data: { userId: newUser.id } });
          break;
        case 'STUDENT':
          await tx.studentProfile.create({ data: { userId: newUser.id } });
          break;
        case 'PARENT':
          await tx.parentProfile.create({ data: { userId: newUser.id } });
          break;
      }

      return newUser;
    });

    const { password: _, ...safe } = user;
    return safe;
  },

  async updateUser(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing) return null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email.toLowerCase() }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.bio !== undefined && { bio: input.bio }),
      },
    });
    const { password: _, ...safe } = updated;
    return safe;
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    if (user.role === 'ADMIN') return null;

    await prisma.user.delete({ where: { id } });
    return { deleted: true };
  },

  async resetUserPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { success: true };
  },

  async updateUserStatus(id: string, status: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    if (user.role === 'ADMIN') return null;

    return prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  },

  async generateImpersonationToken(adminId: string, targetUserId: string) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return null;

    const token = jwt.sign(
      { userId: targetUserId, impersonatedBy: adminId },
      env.jwtSecret,
      { expiresIn: '1h' }
    );
    return { token, expiresIn: '1h' };
  },

  // ==================== STUDENTS ====================
  async listStudents(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;

    const where: Prisma.UserWhereInput = { role: 'STUDENT' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          createdAt: true,
          studentProfile: true,
          _count: {
            select: { enrollments: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      status: s.status,
      createdAt: s.createdAt,
      studentProfile: s.studentProfile,
      enrollmentCount: s._count?.enrollments ?? 0,
    }));

    return { data, total, page, limit };
  },

  async getStudentDetails(id: string) {
    const student = await prisma.user.findUnique({
      where: { id, role: 'STUDENT' },
      include: {
        studentProfile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        _count: { select: { certificates: true } },
      },
    });
    return student;
  },

  async getPendingTeachers() {
    return prisma.user.findMany({
      where: {
        role: 'TEACHER',
        teacherProfile: { verified: false },
      },
      include: { teacherProfile: true },
    });
  },

  async approveTeacher(id: string) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: id },
    });
    if (!profile) return null;

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { userId: id },
        data: { verified: true },
      }),
      prisma.user.update({
        where: { id },
        data: { status: 'ACTIVE' },
      }),
    ]);
    import('../../services/notification.service').then(({ notifyTeacherApproved }) =>
      notifyTeacherApproved(id, 'ar').catch(() => {})
    );
    return prisma.user.findUnique({
      where: { id },
      include: { teacherProfile: true },
    });
  },

  async rejectTeacher(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, role: 'TEACHER' },
    });
    if (!user) return null;
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return { rejected: true };
  },

  async approveStudent(id: string, teacherId: string) {
    const user = await prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
    if (!user) return null;

    const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' } });
    if (!teacher) return { error: 'invalid_teacher' as const };

    return prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE', assignedTeacherId: teacherId },
    });
  },

  async rejectStudent(id: string) {
    const user = await prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
    if (!user) return null;
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return { rejected: true };
  },

  async setInstructorRevenueShare(id: string, revenueShare: number) {
    const user = await prisma.user.findUnique({ where: { id }, include: { teacherProfile: true } });
    if (!user) return null;
    if (user.teacherProfile) {
      return prisma.teacherProfile.update({
        where: { userId: id },
        data: { revenueShare },
      });
    }
    return null;
  },

  async setUserCommissionConfig(userId: string, config: {
    type: string;
    percentage?: number;
    amountPerStudent?: number;
    tiers?: Array<{ from: number; to: number | null; amount: number }>;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
    if (!user) return null;
    const validTypes = ['percentage', 'per_student', 'tiered'];
    if (!validTypes.includes(config.type)) throw new Error('Invalid commission type');
    const data = {
      type: config.type,
      percentage: Math.max(0, Math.min(100, config.percentage ?? 30)),
      amountPerStudent: Math.max(0, config.amountPerStudent ?? 0),
      tiers: (config.tiers ?? []).map((t) => ({
        from: Math.max(1, t.from),
        to: t.to != null ? Math.max(t.from, t.to) : null,
        amount: Math.max(0, t.amount),
      })),
    };
    const json = JSON.stringify(data);
    if (user.teacherProfile) {
      return prisma.teacherProfile.update({
        where: { userId },
        data: { commissionConfig: json },
      });
    }
    return null;
  },

  // ==================== PARENTS ====================
  async listParents(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;

    const where: Prisma.UserWhereInput = { role: 'PARENT' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [parents, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parentProfile: true,
          _count: { select: { parentChildren: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = parents.map((p) => {
      const { _count, ...user } = p;
      return { ...user, childrenCount: _count?.parentChildren ?? 0 };
    });

    return { data, total, page, limit };
  },

  async linkParentToStudent(parentId: string, studentId: string) {
    const [parent, student] = await Promise.all([
      prisma.user.findUnique({ where: { id: parentId, role: 'PARENT' } }),
      prisma.user.findUnique({ where: { id: studentId, role: 'STUDENT' } }),
    ]);
    if (!parent || !student) return null;

    const existing = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId: studentId } },
    });
    if (existing) return existing;

    return prisma.parentChild.create({
      data: { parentId, childId: studentId },
      include: {
        parent: { select: { id: true, name: true, email: true } },
        child: { select: { id: true, name: true, email: true } },
      },
    });
  },

  // ==================== COURSES ====================
  async listCourses(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    let status = query.status as string | undefined;
    const search = query.search as string | undefined;

    // Normalize status: frontend sends "review"/"pending" (lowercase), DB uses "REVIEW"/"PENDING_REVIEW" (uppercase)
    if (status) {
      const s = status.toLowerCase();
      if (s === 'review' || s === 'pending') status = 'REVIEW';
      else status = status.toUpperCase();
    }

    const where: Prisma.CourseWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [courses, total, ordersWithItems, paymentRequests] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              teacherProfile: { select: { revenueShare: true } },
            },
          },
          chapters: { select: { _count: { select: { lessons: true } } } },
        },
      }),
      prisma.course.count({ where }),
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        include: {
          items: { select: { courseId: true, price: true, quantity: true } },
        },
      }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED', courseId: { not: null } },
        select: { courseId: true, amount: true },
      }),
      Promise.resolve([]),
    ]);

    const courseIds = courses.map((c) => c.id);

    // Compute real revenue per course (Orders + PaymentRequests)
    const totalRevenueByCourse = new Map<string, number>();
    const revenueByPaymentMethod = new Map<string, Record<string, number>>();

    for (const order of ordersWithItems) {
      const totalItemsValue = order.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
      if (totalItemsValue <= 0) continue;
      const paymentMethod = order.paymentMethod || 'other';
      for (const item of order.items) {
        if (!item.courseId || !courseIds.includes(item.courseId)) continue;
        const itemValue = item.price * (item.quantity ?? 1);
        const share = Number(order.total) * (itemValue / totalItemsValue);
        totalRevenueByCourse.set(item.courseId, (totalRevenueByCourse.get(item.courseId) ?? 0) + share);
        const byMethod = revenueByPaymentMethod.get(item.courseId) ?? {};
        byMethod[paymentMethod] = (byMethod[paymentMethod] ?? 0) + share;
        revenueByPaymentMethod.set(item.courseId, byMethod);
      }
    }

    for (const pr of paymentRequests) {
      if (!pr.courseId || !courseIds.includes(pr.courseId)) continue;
      const amount = Number(pr.amount);
      totalRevenueByCourse.set(pr.courseId, (totalRevenueByCourse.get(pr.courseId) ?? 0) + amount);
      const byMethod = revenueByPaymentMethod.get(pr.courseId) ?? {};
      byMethod['payment_request'] = (byMethod['payment_request'] ?? 0) + amount;
      revenueByPaymentMethod.set(pr.courseId, byMethod);
    }

    const data = courses.map((c) => {
      const totalRev = totalRevenueByCourse.get(c.id) ?? 0;
      const inst = c.instructor as { teacherProfile?: { revenueShare?: number } } | null;
      const revenueSharePct = inst?.teacherProfile?.revenueShare ?? 70;
      const instructorShare = revenueSharePct / 100;
      const platformShare = 1 - instructorShare;
      const platformRevenue = totalRev * platformShare;
      const lessonsCount = (c.chapters ?? []).reduce((s, ch) => s + (ch._count?.lessons ?? 0), 0);

      const { chapters, ...rest } = c;
      return {
        ...rest,
        students: c.totalStudents ?? 0,
        rating: c.averageRating ?? 0,
        lessonsCount,
        revenue: Math.round(platformRevenue * 100) / 100,
        totalRevenue: Math.round(totalRev * 100) / 100,
        revenueByPaymentMethod: revenueByPaymentMethod.get(c.id) ?? {},
      };
    });

    return { data, total, page, limit };
  },

  async updateCourseStatus(id: string, status: string) {
    return prisma.course.update({
      where: { id },
      data: { status },
    });
  },

  async getCourseAnalytics(courseId: string) {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      include: { instructor: { select: { id: true, name: true } } },
    });
    if (!course) return null;

    const lessonsCount = await prisma.lesson.count({
      where: { chapter: { courseId: course.id } },
    });

    const now = new Date();
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Last 6 months
    const monthlyData: { month: string; monthAr: string; revenue: number; students: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      monthlyData.push({
        month: monthNamesEn[d.getMonth()],
        monthAr: monthNamesAr[d.getMonth()],
        revenue: 0,
        students: 0,
      });

      const enrollmentsThisMonth = await prisma.enrollment.count({
        where: { courseId: course.id, createdAt: { gte: d, lte: nextMonth } },
      });
      monthlyData[monthlyData.length - 1].students = enrollmentsThisMonth;

      const ordersThisMonth = await prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: d, lte: nextMonth },
          items: { some: { courseId: course.id } },
        },
        include: { items: { select: { courseId: true, price: true, quantity: true } } },
      });
      const orderRevenueSum = ordersThisMonth.reduce((sum, order) => {
        const totalItemsValue = order.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
        const courseItemsValue = order.items
          .filter((i) => i.courseId === course.id)
          .reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
        return sum + (totalItemsValue > 0 ? order.total * (courseItemsValue / totalItemsValue) : 0);
      }, 0);
      const paymentRequestRevenue = await prisma.paymentRequest.aggregate({
        where: {
          courseId: course.id,
          status: 'APPROVED',
          reviewedAt: { gte: d, lte: nextMonth },
        },
        _sum: { amount: true },
      });
      monthlyData[monthlyData.length - 1].revenue = orderRevenueSum + (paymentRequestRevenue._sum.amount ?? 0);
    }

    const [enrollmentsCount, ordersWithCourse, totalPaymentRequestRevenue, enrollments, reviewAgg] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: course.id, status: 'ACTIVE' } }),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          items: { some: { courseId: course.id } },
        },
        include: { items: { select: { courseId: true, price: true, quantity: true } } },
      }),
      prisma.paymentRequest.aggregate({
        where: { courseId: course.id, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const totalOrderRevenue = ordersWithCourse.reduce((sum, order) => {
      const totalItemsValue = order.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
      const courseItemsValue = order.items
        .filter((i) => i.courseId === course.id)
        .reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
      return sum + (totalItemsValue > 0 ? order.total * (courseItemsValue / totalItemsValue) : 0);
    }, 0);
    const totalRevenue = totalOrderRevenue + (totalPaymentRequestRevenue._sum.amount ?? 0);
    const completedCount = enrollments.filter((e) => e.progress >= 100).length;
    const completionRate = enrollmentsCount > 0 ? Math.round((completedCount / enrollmentsCount) * 100) : 0;

    const students = enrollments.map((e) => ({
      id: e.userId,
      name: e.user?.name ?? '',
      email: e.user?.email ?? '',
      progress: Math.round(e.progress ?? 0),
      date: e.createdAt?.toISOString?.()?.slice(0, 10) ?? '',
    }));

    const courseWithInstructor = course as { instructor?: { name: string } | null };
    return {
      course: {
        id: course.id,
        title: course.title,
        titleAr: course.titleAr,
        thumbnail: course.thumbnail,
        category: course.category,
        instructor: courseWithInstructor.instructor?.name ?? '',
        hours: course.duration ?? 0,
      },
      stats: {
        revenue: totalRevenue,
        students: enrollmentsCount,
        completionRate,
        lessonsCount,
        quizzesCount: 0,
        rating: reviewAgg._avg.rating ?? 0,
        reviewsCount: reviewAgg._count,
      },
      monthlyData,
      students,
    };
  },

  // ==================== ENROLLMENTS ====================
  async listEnrollments(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;

    const where: Prisma.EnrollmentWhereInput = {};
    if (status) where.status = status;
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
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { data: enrollments, total, page, limit };
  },

  async manualEnroll(userId: string, courseId: string, adminId: string) {
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!user || !course) return null;

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && existing.status === 'ACTIVE') return null;

    if (existing && existing.status === 'CANCELLED') {
      return prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', source: 'admin', assignedBy: adminId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      });
    }

    return prisma.enrollment.create({
      data: {
        userId,
        courseId,
        source: 'admin',
        assignedBy: adminId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  },

  async cancelEnrollment(id: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) return null;

    return prisma.enrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  },

  // ==================== SETTINGS ====================
  async getAllSettings() {
    const settings = await prisma.platformSetting.findMany();
    const grouped: Record<string, Record<string, string>> = {};
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    }
    return grouped;
  },

  async getSettingsByGroup(group: string) {
    if (!SETTING_GROUPS.includes(group as (typeof SETTING_GROUPS)[number])) return null;

    const settings = await prisma.platformSetting.findMany({
      where: { group },
    });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return result;
  },

  async updateSettingsGroup(group: string, input: UpdateSettingsInput) {
    if (!SETTING_KEYS[group]) return null;

    const keys = SETTING_KEYS[group];
    for (const [key, value] of Object.entries(input)) {
      if (keys.includes(key)) {
        await prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: String(value), group },
          update: { value: String(value) },
        });
      }
    }
    return this.getSettingsByGroup(group);
  },

  async sendTestEmail(toEmail?: string) {
    const { sendEmail, clearEmailCache } = await import('../../services/email.service');
    clearEmailCache(); // reload SMTP config
    const to = toEmail?.trim();
    if (!to) return { sent: false, message: 'No recipient email' };
    const result = await sendEmail({
      to,
      subject: 'Test Email - Platform SMTP',
      text: 'This is a test email from your platform. SMTP is configured correctly.',
      html: '<p>This is a test email from your platform.</p><p><strong>SMTP is configured correctly.</strong></p>',
    });
    return result.sent
      ? { sent: true, message: 'Test email sent successfully' }
      : { sent: false, message: result.error || 'Failed to send' };
  },

  // ==================== ROLES & PERMISSIONS ====================
  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  },

  async createRole(name: string, description?: string) {
    return prisma.role.create({
      data: { name, description },
    });
  },

  async updateRole(id: string, name?: string, description?: string) {
    return prisma.role.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }) },
    });
  },

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return null;
    if (role.isSystem) return null;

    await prisma.role.delete({ where: { id } });
    return { deleted: true };
  },

  async updateRolePermissions(id: string, permissionIds: string[], permissionNames?: string[]) {
    let ids = permissionIds ?? [];
    if (permissionNames && permissionNames.length > 0) {
      const byName = await prisma.permission.findMany({
        where: { name: { in: permissionNames } },
        select: { id: true },
      });
      ids = byName.map((p) => p.id);
    }
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    if (ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
  },

  async listPermissions(module?: string) {
    const where = module ? { module } : {};
    return prisma.permission.findMany({
      where,
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
  },

  // ==================== CONTENT ====================
  async listContent(type?: string, query?: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query ?? {});
    const where: Prisma.ContentWhereInput = {};
    if (type) where.type = type;

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.content.count({ where }),
    ]);

    return { data: content, total, page, limit };
  },

  async createContent(input: CreateContentInput) {
    return prisma.content.create({
      data: {
        type: input.type,
        title: input.title,
        titleAr: input.titleAr,
        content: input.content,
        contentAr: input.contentAr,
        slug: input.slug,
        image: input.image,
        status: input.status ?? 'active',
        position: input.position ?? 0,
        category: input.category,
        author: input.author,
      },
    });
  },

  async updateContent(id: string, input: UpdateContentInput) {
    return prisma.content.update({
      where: { id },
      data: input,
    });
  },

  async deleteContent(id: string) {
    await prisma.content.delete({ where: { id } });
    return { deleted: true };
  },

  // ==================== SERVICES & BUNDLES ====================
  async listServiceBundles(query?: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query ?? {});
    const search = (query?.search as string | undefined)?.trim();
    const status = query?.status as string | undefined;
    const kind = (query?.kind as string | undefined)?.toUpperCase();

    const where: Prisma.ContentWhereInput = {
      type: { in: ['SERVICE', 'BUNDLE'] },
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleAr: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (kind === 'SERVICE' || kind === 'BUNDLE') where.type = kind;

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.content.count({ where }),
    ]);

    return {
      data: items.map((item) => {
        let meta: { price?: number; ctaUrl?: string } = {};
        try {
          meta = item.author ? JSON.parse(item.author) : {};
        } catch {}
        return {
        id: item.id,
        kind: item.type,
        title: item.title,
        titleAr: item.titleAr,
        description: item.content,
        descriptionAr: item.contentAr,
        image: item.image,
        status: item.status,
        position: item.position,
        price: typeof meta.price === 'number' ? meta.price : null,
        ctaUrl: meta.ctaUrl || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }}),
      total,
      page,
      limit,
    };
  },

  async createServiceBundle(input: CreateServiceBundleInput) {
    const meta = JSON.stringify({
      price: input.price ?? null,
      ctaUrl: input.ctaUrl ?? null,
    });
    const created = await prisma.content.create({
      data: {
        type: input.kind,
        title: input.title,
        titleAr: input.titleAr,
        content: input.description,
        contentAr: input.descriptionAr,
        image: input.image,
        status: input.status ?? 'active',
        position: input.position ?? 0,
        author: meta,
      },
    });
    return {
      id: created.id,
      kind: created.type,
      title: created.title,
      titleAr: created.titleAr,
      description: created.content,
      descriptionAr: created.contentAr,
      image: created.image,
      status: created.status,
      position: created.position,
      price: input.price ?? null,
      ctaUrl: input.ctaUrl || null,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async updateServiceBundle(id: string, input: UpdateServiceBundleInput) {
    const existing = await prisma.content.findFirst({
      where: { id, type: { in: ['SERVICE', 'BUNDLE'] } },
    });
    if (!existing) return null;

    const prevMeta = (() => {
      try {
        return existing.author ? JSON.parse(existing.author) : {};
      } catch {
        return {};
      }
    })();
    const nextMeta = JSON.stringify({
      price: input.price ?? prevMeta.price ?? null,
      ctaUrl: input.ctaUrl ?? prevMeta.ctaUrl ?? null,
    });

    const updated = await prisma.content.update({
      where: { id },
      data: {
        type: input.kind,
        title: input.title,
        titleAr: input.titleAr,
        content: input.description,
        contentAr: input.descriptionAr,
        image: input.image,
        status: input.status,
        position: input.position,
        author: nextMeta,
      },
    });

    const parsedMeta = (() => {
      try {
        return updated.author ? JSON.parse(updated.author) : {};
      } catch {
        return {};
      }
    })();

    return {
      id: updated.id,
      kind: updated.type,
      title: updated.title,
      titleAr: updated.titleAr,
      description: updated.content,
      descriptionAr: updated.contentAr,
      image: updated.image,
      status: updated.status,
      position: updated.position,
      price: typeof parsedMeta.price === 'number' ? parsedMeta.price : null,
      ctaUrl: parsedMeta.ctaUrl || null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  async deleteServiceBundle(id: string) {
    const existing = await prisma.content.findFirst({
      where: { id, type: { in: ['SERVICE', 'BUNDLE'] } },
      select: { id: true },
    });
    if (!existing) return null;
    await prisma.content.delete({ where: { id } });
    return true;
  },

  // ==================== FILES ====================
  async uploadFile(userId: string, file: Express.Multer.File) {
    const filename = file.filename || (file as any).filename || '';
    const relativePath = `uploads/${filename}`;
    const sizeMb = file.size ? file.size / (1024 * 1024) : 0;
    const mime = (file.mimetype || '').toLowerCase();
    let type = 'OTHER';
    if (mime.startsWith('video/')) type = 'VIDEO';
    else if (mime === 'application/pdf') type = 'PDF';
    else if (mime.startsWith('image/')) type = 'IMAGE';
    else if (mime.includes('word') || mime.includes('excel') || mime.includes('document')) type = 'DOCUMENT';

    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname || filename || 'file',
        type,
        size: sizeMb,
        url: relativePath,
        uploadedBy: userId,
      },
    });

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      url: `/${relativePath}`,
      type: type.toLowerCase(),
    };
  },

  async listFiles(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const type = query.type as string | undefined;

    const where: Prisma.FileWhereInput = {};
    if (type) where.type = type;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return { data: files, total, page, limit };
  },

  async getStorageStats() {
    const [totalFiles, totalSize, byType] = await Promise.all([
      prisma.file.count(),
      prisma.file.aggregate({ _sum: { size: true } }),
      prisma.file.groupBy({
        by: ['type'],
        _sum: { size: true },
        _count: true,
      }),
    ]);

    return {
      totalFiles,
      totalSizeMB: totalSize._sum.size ?? 0,
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
        sizeMB: t._sum.size ?? 0,
      })),
    };
  },

  async deleteFile(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return null;
    await prisma.file.delete({ where: { id } });
    return { deleted: true };
  },

  // ==================== EXAMS ====================
  async listExams(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
          course: { select: { id: true, title: true, titleAr: true } },
          _count: { select: { questions: true, results: true } },
        },
      }),
      prisma.exam.count(),
    ]);

    const data = exams.map((e) => {
      const { _count, course, ...rest } = e;
      return {
        ...rest,
        courseId: e.courseId ?? '',
        course: course?.titleAr ?? course?.title ?? '',
        questions: _count.questions,
        participants: _count.results,
      };
    });
    return { data, total, page, limit };
  },

  async getExamResults(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const examId = query.examId as string | undefined;

    const where: Prisma.ExamResultWhereInput = {};
    if (examId) where.examId = examId;

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: { select: { id: true, title: true } },
        },
      }),
      prisma.examResult.count({ where }),
    ]);

    return { data: results, total, page, limit };
  },

  async createExam(input: CreateExamInput) {
    return prisma.exam.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        courseId: input.courseId ?? null,
        classId: input.classId,
        creatorId: input.creatorId,
        instructions: input.instructions,
        duration: input.duration ?? 60,
        maxAttempts: input.maxAttempts ?? 1,
        passingScore: input.passingScore ?? 60,
        status: input.status ?? 'draft',
        startDate: input.startDate,
        endDate: input.endDate,
        showCorrectAnswer: input.showCorrectAnswer ?? true,
        randomizeQuestions: input.randomizeQuestions ?? false,
        randomizeOptions: input.randomizeOptions ?? false,
      },
    });
  },

  async updateExam(id: string, input: Partial<CreateExamInput>) {
    return prisma.exam.update({
      where: { id },
      data: {
        ...(input.title != null && { title: input.title }),
        ...(input.titleAr != null && { titleAr: input.titleAr }),
        ...(input.courseId != null && { courseId: input.courseId || null }),
        ...(input.classId != null && { classId: input.classId }),
        ...(input.instructions != null && { instructions: input.instructions }),
        ...(input.duration != null && { duration: input.duration }),
        ...(input.maxAttempts != null && { maxAttempts: input.maxAttempts }),
        ...(input.passingScore != null && { passingScore: input.passingScore }),
        ...(input.status != null && { status: input.status }),
        ...(input.startDate != null && { startDate: input.startDate }),
        ...(input.endDate != null && { endDate: input.endDate }),
        ...(input.showCorrectAnswer != null && { showCorrectAnswer: input.showCorrectAnswer }),
        ...(input.randomizeQuestions != null && { randomizeQuestions: input.randomizeQuestions }),
        ...(input.randomizeOptions != null && { randomizeOptions: input.randomizeOptions }),
      },
    });
  },

  async deleteExam(id: string) {
    await prisma.exam.delete({ where: { id } });
    return { deleted: true };
  },

  async getExamById(id: string) {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
  },

  async addExamQuestion(examId: string, data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number; order?: number }) {
    const maxOrder = await prisma.quiz
      .findFirst({ where: { examId }, orderBy: { order: 'desc' }, select: { order: true } })
      .then((r) => (r?.order ?? -1) + 1);
    return prisma.quiz.create({
      data: {
        examId,
        lessonId: null,
        question: data.question,
        questionAr: data.questionAr ?? null,
        type: data.type ?? 'multiple_choice',
        options: data.options,
        correctAnswer: data.correctAnswer ?? null,
        points: data.points ?? 1,
        order: data.order ?? maxOrder,
      },
    });
  },

  async updateExamQuestion(examId: string, questionId: string, data: Partial<{ question: string; questionAr: string; type: string; options: string; correctAnswer: string; points: number; order: number }>) {
    return prisma.quiz.update({
      where: { id: questionId, examId },
      data: {
        ...(data.question != null && { question: data.question }),
        ...(data.questionAr != null && { questionAr: data.questionAr }),
        ...(data.type != null && { type: data.type }),
        ...(data.options != null && { options: data.options }),
        ...(data.correctAnswer != null && { correctAnswer: data.correctAnswer }),
        ...(data.points != null && { points: data.points }),
        ...(data.order != null && { order: data.order }),
      },
    });
  },

  async deleteExamQuestion(examId: string, questionId: string) {
    await prisma.quiz.delete({ where: { id: questionId, examId } });
    return { deleted: true };
  },

  // ==================== QUESTION BANK ====================
  async listQuestionBank(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      prisma.questionBankItem.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.questionBankItem.count(),
    ]);
    return { data: items, total, page, limit };
  },

  async createQuestionBankItem(data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number }) {
    return prisma.questionBankItem.create({
      data: {
        question: data.question,
        questionAr: data.questionAr ?? null,
        type: data.type ?? 'multiple_choice',
        options: data.options,
        correctAnswer: data.correctAnswer ?? null,
        points: data.points ?? 1,
      },
    });
  },

  async updateQuestionBankItem(id: string, data: Partial<{ question: string; questionAr: string; type: string; options: string; correctAnswer: string; points: number }>) {
    return prisma.questionBankItem.update({ where: { id }, data });
  },

  async deleteQuestionBankItem(id: string) {
    await prisma.questionBankItem.delete({ where: { id } });
    return { deleted: true };
  },

  // ==================== CONTENT BANK ====================
  async listContentBank(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      prisma.contentBankItem.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.contentBankItem.count(),
    ]);
    return { data: items, total, page, limit };
  },

  async createContentBankItem(data: { title: string; titleAr?: string; type?: string; content?: string; videoUrl?: string; pdfUrl?: string; duration?: number }) {
    return prisma.contentBankItem.create({
      data: {
        title: data.title,
        titleAr: data.titleAr ?? null,
        type: data.type ?? 'VIDEO',
        content: data.content ?? null,
        videoUrl: data.videoUrl ?? null,
        pdfUrl: data.pdfUrl ?? null,
        duration: data.duration ?? 0,
      },
    });
  },

  async updateContentBankItem(id: string, data: Partial<{ title: string; titleAr: string; type: string; content: string; videoUrl: string; pdfUrl: string; duration: number }>) {
    return prisma.contentBankItem.update({ where: { id }, data });
  },

  async deleteContentBankItem(id: string) {
    await prisma.contentBankItem.delete({ where: { id } });
    return { deleted: true };
  },

  // ==================== COMPREHENSIVE EXAMS ====================
  async listComprehensiveExams(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const [exams, total] = await Promise.all([
      prisma.comprehensiveExam.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          _count: { select: { questions: true, results: true } },
        },
      }),
      prisma.comprehensiveExam.count(),
    ]);
    const data = exams.map((e) => {
      const { _count, ...rest } = e;
      return { ...rest, questions: _count.questions, participants: _count.results };
    });
    return { data, total, page, limit };
  },

  async createComprehensiveExam(data: {
    courseId: string;
    title: string;
    titleAr?: string;
    duration?: number;
    passingScore?: number;
    maxAttempts?: number;
    showCorrectAnswer?: boolean;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: string;
    hasCertificate?: boolean;
    passingScoreForCertificate?: number | null;
    certificateTemplateId?: string | null;
  }) {
    const payload = { ...data };
    if (typeof payload.startDate === 'string') payload.startDate = new Date(payload.startDate);
    if (typeof payload.endDate === 'string') payload.endDate = new Date(payload.endDate);
    return prisma.comprehensiveExam.create({ data: payload });
  },

  async getComprehensiveExam(id: string) {
    return prisma.comprehensiveExam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
  },

  async updateComprehensiveExam(id: string, data: Partial<{ courseId: string; title: string; titleAr?: string; duration?: number; passingScore?: number; maxAttempts?: number; showCorrectAnswer?: boolean; randomizeQuestions?: boolean; randomizeOptions?: boolean; startDate?: Date | string; endDate?: Date | string; status?: string; hasCertificate?: boolean; passingScoreForCertificate?: number | null; certificateTemplateId?: string | null }>) {
    const payload = { ...data };
    if (typeof payload.startDate === 'string') payload.startDate = new Date(payload.startDate);
    if (typeof payload.endDate === 'string') payload.endDate = new Date(payload.endDate);
    return prisma.comprehensiveExam.update({ where: { id }, data: payload });
  },

  async deleteComprehensiveExam(id: string) {
    await prisma.comprehensiveExam.delete({ where: { id } });
    return { deleted: true };
  },

  async addComprehensiveExamQuestion(examId: string, data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number; order?: number }) {
    const maxOrder = await prisma.comprehensiveExamQuestion
      .findFirst({ where: { comprehensiveExamId: examId }, orderBy: { order: 'desc' }, select: { order: true } })
      .then((r) => (r?.order ?? -1) + 1);
    return prisma.comprehensiveExamQuestion.create({
      data: {
        comprehensiveExamId: examId,
        question: data.question,
        questionAr: data.questionAr ?? null,
        type: data.type ?? 'multiple_choice',
        options: data.options,
        correctAnswer: data.correctAnswer ?? null,
        points: data.points ?? 1,
        order: data.order ?? maxOrder,
      },
    });
  },

  async deleteComprehensiveExamQuestion(examId: string, questionId: string) {
    await prisma.comprehensiveExamQuestion.delete({ where: { id: questionId, comprehensiveExamId: examId } });
    return { deleted: true };
  },

  async getComprehensiveExamResults(examId?: string) {
    const where = examId ? { comprehensiveExamId: examId } : {};
    const results = await prisma.comprehensiveExamResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        comprehensiveExam: { select: { id: true, title: true, titleAr: true, courseId: true } },
      },
    });
    const userIds = [...new Set(results.map((r) => r.studentId))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, phone: true } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return results.map((r) => ({
      ...r,
      student: userMap.get(r.studentId)?.name ?? 'Unknown',
      studentEmail: userMap.get(r.studentId)?.email ?? '',
    }));
  },

  // ==================== REVIEWS ====================
  async listReviews(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const status = (query.status as string) || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, titleAr: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { data: reviews, total, page, limit };
  },

  async approveReview(id: string) {
    const review = await prisma.review.findUnique({ where: { id }, include: { course: true } });
    if (!review) return null;
    await prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    const { reviewsService } = await import('../reviews/reviews.service');
    await reviewsService.updateCourseRating(review.courseId);
    return prisma.review.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, course: { select: { title: true, titleAr: true } } },
    });
  },

  async rejectReview(id: string) {
    return prisma.review.update({
      where: { id },
      data: { status: 'REJECTED', showOnHomepage: false },
    });
  },

  async setReviewShowOnHomepage(id: string, showOnHomepage: boolean) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return null;
    if (showOnHomepage && review.status !== 'APPROVED') return null;
    return prisma.review.update({
      where: { id },
      data: { showOnHomepage },
    });
  },

  // ==================== CERTIFICATES ====================
  async listCertificates(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: {
            select: {
              id: true,
              title: true,
              titleAr: true,
              instructor: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.certificate.count(),
    ]);

    return { data: certificates, total, page, limit };
  },

  async verifyCertificate(certNo: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateNo: certNo },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    return cert;
  },

  async listCertificateTemplates() {
    return prisma.certificateTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async createCertificateTemplate(data: {
    name: string;
    nameAr?: string;
    imageUrl?: string;
    overlayFields?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({ data: { isDefault: false } });
    }
    return prisma.certificateTemplate.create({
      data: {
        name: data.name,
        nameAr: data.nameAr ?? null,
        imageUrl: data.imageUrl ?? null,
        thumbnail: data.imageUrl ?? null,
        overlayFields: data.overlayFields ?? null,
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async updateCertificateTemplate(
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      imageUrl?: string;
      overlayFields?: string;
      isDefault?: boolean;
    }
  ) {
    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.nameAr != null && { nameAr: data.nameAr }),
        ...(data.imageUrl != null && { imageUrl: data.imageUrl, thumbnail: data.imageUrl }),
        ...(data.overlayFields != null && { overlayFields: data.overlayFields }),
        ...(data.isDefault != null && { isDefault: data.isDefault }),
      },
    });
  },

  async deleteCertificateTemplate(id: string) {
    return prisma.certificateTemplate.delete({ where: { id } });
  },

  // ==================== NOTIFICATIONS ====================
  async getNotificationStats() {
    const [totalSent, readCount, totalUsers] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: true } }),
      prisma.notification.groupBy({ by: ['userId'], _count: true }),
    ]);

    const readRate = totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

    return {
      totalSent,
      readRate,
      totalRecipients: totalUsers.length,
    };
  },

  async getNotificationHistory(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const logs = await prisma.activityLog.findMany({
      where: { action: 'send_notification' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const totalLogs = await prisma.activityLog.count({ where: { action: 'send_notification' } });

    const history = await Promise.all(
      logs.map(async (log) => {
        const details = JSON.parse(log.details ?? '{}');
        const title = details.title ?? '';
        const target = details.target ?? 'all';
        const count = details.count ?? 0;

        const readCount = await prisma.notification.count({
          where: { title, read: true },
        });

        return {
          id: log.id,
          title,
          target,
          channel: 'inapp',
          sentAt: log.createdAt.toISOString().split('T')[0],
          read: readCount,
          total: count,
          status: 'delivered' as const,
        };
      })
    );

    return { data: history, total: totalLogs, page, limit };
  },

  async sendNotification(input: SendNotificationInput & { targetEmail?: string }, adminId: string) {
    let userIds: string[] = [];
    const target = input.target as string;

    const roleMap: Record<string, string> = {
      students: 'STUDENT',
      teachers: 'TEACHER',
      parents: 'PARENT',
      admins: 'ADMIN',
    };

    if (target === 'all') {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map((u) => u.id);
    } else if (roleMap[target]) {
      const users = await prisma.user.findMany({ where: { role: roleMap[target] }, select: { id: true } });
      userIds = users.map((u) => u.id);
    } else if (target === 'specific') {
      if (input.targetEmail) {
        const user = await prisma.user.findUnique({ where: { email: input.targetEmail }, select: { id: true } });
        if (user) userIds = [user.id];
      }
      if (input.userIds?.length) {
        userIds = [...userIds, ...input.userIds];
      }
    }

    if (userIds.length === 0) {
      return { sent: 0, userIds: [] };
    }

    const created = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'info',
        channel: 'IN_APP',
      })),
    });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'send_notification',
        entity: 'Notification',
        details: JSON.stringify({
          target: input.target,
          count: created.count,
          title: input.title,
        }),
      },
    });

    return { sent: created.count, userIds };
  },

  // ==================== REPORTS ====================
  async getReport(type: string, dateRange?: string) {
    const t = (type || '').trim();
    if (!t) return null;
    const months = dateRange === '1year' ? 12 : dateRange === '30days' ? 1 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // === تقارير تفصيلية شاملة ===
    if (t === 'students-detail') {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true, name: true, email: true, phone: true, city: true, country: true,
          status: true, createdAt: true, lastLoginAt: true,
          enrollments: { select: { courseId: true, progress: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const courseIds = [...new Set(students.flatMap(s => s.enrollments.map(e => e.courseId)))];
      const courses = await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true, titleAr: true } });
      const courseMap = new Map(courses.map(c => [c.id, c]));
      const rows = students.map(s => ({
        id: s.id, name: s.name, email: s.email, phone: s.phone || '', city: s.city || '', country: s.country || '',
        status: s.status, createdAt: s.createdAt, lastLoginAt: s.lastLoginAt,
        enrollmentsCount: s.enrollments.length,
        courses: s.enrollments.map(e => courseMap.get(e.courseId)?.titleAr || courseMap.get(e.courseId)?.title || '').join('; '),
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'teachers-detail') {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: {
          teacherProfile: true,
          courses: { select: { totalStudents: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const rows = teachers.map(u => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone || '',
        specialty: u.teacherProfile?.specialty || u.teacherProfile?.subject || '',
        totalStudents: u.courses.reduce((sum, c) => sum + (c.totalStudents ?? 0), 0),
        totalCourses: u.courses.length,
        verified: u.teacherProfile?.verified ?? false,
        createdAt: u.createdAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'courses-detail') {
      const courses = await prisma.course.findMany({
        include: { instructor: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = courses.map(c => ({
        id: c.id, title: c.titleAr || c.title, slug: c.slug,
        instructor: c.instructor?.name || '', instructorEmail: c.instructor?.email || '',
        price: c.price, discountPrice: c.discountPrice, currency: c.currency,
        status: c.status, level: c.level, category: c.category,
        totalStudents: c.totalStudents, averageRating: c.averageRating, totalReviews: c.totalReviews,
        duration: c.duration, language: c.language, featured: c.featured,
        createdAt: c.createdAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'orders-detail') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: { user: { select: { name: true, email: true } }, items: { include: { course: true, bundle: true } } },
        orderBy: { createdAt: 'desc' },
      });
      let rows = orders.flatMap(o => o.items.length > 0
        ? o.items.map(item => ({
            orderId: o.id, orderDate: o.createdAt, status: o.status,
            customerName: o.user?.name || '', customerEmail: o.user?.email || '',
            itemTitle: item.title, itemType: item.courseId ? 'course' : item.bundleId ? 'bundle' : 'product',
            price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity,
            orderTotal: o.total, currency: o.currency, paymentMethod: o.paymentMethod || '',
          }))
        : [{
            orderId: o.id, orderDate: o.createdAt, status: o.status,
            customerName: o.user?.name || '', customerEmail: o.user?.email || '',
            itemTitle: '-', itemType: '-', price: 0, quantity: 0, subtotal: 0,
            orderTotal: o.total, currency: o.currency, paymentMethod: o.paymentMethod || '',
          }]
      );
      return { summary: { total: orders.length, totalRevenue: orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.total, 0) }, detailedData: rows };
    }

    if (t === 'enrollments-detail') {
      const enrollments = await prisma.enrollment.findMany({
        where: { createdAt: { gte: startDate } },
        include: { user: { select: { name: true, email: true } }, course: { select: { title: true, titleAr: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = enrollments.map(e => ({
        id: e.id, studentName: e.user?.name || '', studentEmail: e.user?.email || '',
        course: e.course?.titleAr || e.course?.title || '', progress: e.progress, status: e.status,
        source: e.source, createdAt: e.createdAt, completedAt: e.completedAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'exams-detail') {
      const results = await prisma.comprehensiveExamResult.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          student: { select: { name: true, email: true } },
          comprehensiveExam: { select: { title: true, titleAr: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const rows = results.map(r => ({
        id: r.id, studentName: r.student?.name || '', studentEmail: r.student?.email || '',
        exam: r.comprehensiveExam?.titleAr || r.comprehensiveExam?.title || '',
        score: r.score, passed: r.passed, attempts: r.attempts, timeTaken: r.timeTaken,
        createdAt: r.createdAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'reviews-detail') {
      const reviews = await prisma.review.findMany({
        include: { user: { select: { name: true, email: true } }, course: { select: { title: true, titleAr: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = reviews.map(r => ({
        id: r.id, userName: r.user?.name || '', userEmail: r.user?.email || '',
        course: r.course?.titleAr || r.course?.title || '', rating: r.rating, comment: r.comment || '',
        status: r.status, helpful: r.helpful, createdAt: r.createdAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'certificates-detail') {
      const certs = await prisma.certificate.findMany({
        include: { user: { select: { name: true, email: true } }, course: { select: { title: true, titleAr: true } } },
        orderBy: { issuedAt: 'desc' },
      });
      const rows = certs.map(c => ({
        certificateNo: c.certificateNo, userName: c.user?.name || '', userEmail: c.user?.email || '',
        course: c.course?.titleAr || c.course?.title || '', grade: c.grade, issuedAt: c.issuedAt,
      }));
      return { summary: { total: rows.length }, detailedData: rows };
    }

    if (t === 'students') {
      const [enrollments, studentsWithExams, totalStudents] = await Promise.all([
        prisma.enrollment.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        }),
        prisma.comprehensiveExamResult.findMany({
          include: {
            student: { select: { id: true, name: true, email: true } },
            comprehensiveExam: { select: { id: true, title: true, titleAr: true } },
          },
          orderBy: { score: 'desc' },
          take: 20,
        }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
      ]);

      const monthCounts: Record<string, number> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = d.toLocaleString('en', { month: 'short' });
        monthCounts[key] = 0;
      }
      for (const e of enrollments) {
        const key = new Date(e.createdAt).toLocaleString('en', { month: 'short' });
        if (monthCounts[key] !== undefined) monthCounts[key]++;
      }

      const monthlyData = Object.entries(monthCounts).map(([month, students]) => ({
        month,
        students,
        courses: 0,
        revenue: 0,
        exams: 0,
      }));

      const topPerformers = studentsWithExams.slice(0, 8).map((r) => ({
        name: r.student?.name ?? r.student?.email ?? '—',
        metric: `${r.score.toFixed(0)}%`,
        metricAr: `${r.score.toFixed(0)}%`,
        type: 'student' as const,
        examTitle: r.comprehensiveExam?.titleAr ?? r.comprehensiveExam?.title ?? undefined,
      }));

      return { monthlyData, topPerformers, rawStudents: totalStudents };
    }

    if (t === 'exams') {
      const [results, examStats] = await Promise.all([
        prisma.comprehensiveExamResult.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        }),
        prisma.comprehensiveExamResult.groupBy({
          by: ['comprehensiveExamId'],
          _avg: { score: true },
          _count: true,
        }),
      ]);

      const examIds = examStats.map((e) => e.comprehensiveExamId);
      const exams = await prisma.comprehensiveExam.findMany({
        where: { id: { in: examIds } },
        select: { id: true, title: true, titleAr: true },
      });
      const examMap = new Map(exams.map((e) => [e.id, e]));

      const monthCounts: Record<string, number> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = d.toLocaleString('en', { month: 'short' });
        monthCounts[key] = 0;
      }
      for (const r of results) {
        const key = new Date(r.createdAt).toLocaleString('en', { month: 'short' });
        if (monthCounts[key] !== undefined) monthCounts[key]++;
      }

      const monthlyData = Object.entries(monthCounts).map(([month, exams]) => ({
        month,
        students: 0,
        courses: 0,
        revenue: 0,
        exams,
      }));

      const topPerformers = examStats.slice(0, 8).map((s) => {
        const exam = examMap.get(s.comprehensiveExamId);
        const passRate = s._count > 0 && s._avg?.score != null ? s._avg.score : 0;
        return {
          name: exam?.titleAr ?? exam?.title ?? '—',
          metric: `${passRate.toFixed(0)}% avg · ${s._count} attempts`,
          metricAr: `${passRate.toFixed(0)}% متوسط · ${s._count} محاولة`,
          type: 'exam' as const,
        };
      });

      return { monthlyData, topPerformers };
    }

    if (t === 'courses') {
      const courses = await prisma.course.findMany({
        include: { instructor: { select: { id: true, name: true } } },
      });
      const enrollments = await prisma.enrollment.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      });
      const monthCounts: Record<string, number> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = d.toLocaleString('en', { month: 'short' });
        monthCounts[key] = 0;
      }
      for (const e of enrollments) {
        const key = new Date(e.createdAt).toLocaleString('en', { month: 'short' });
        if (monthCounts[key] !== undefined) monthCounts[key]++;
      }
      const monthlyData = Object.entries(monthCounts).map(([month, students]) => ({
        month,
        students,
        courses: courses.length,
        revenue: 0,
        exams: 0,
      }));
      const topPerformers = courses.slice(0, 8).map((c) => ({
        name: c.titleAr ?? c.title,
        metric: `${c.totalStudents ?? 0} students`,
        metricAr: `${c.totalStudents ?? 0} طالب`,
        type: 'course' as const,
      }));
      return { monthlyData, topPerformers };
    }

    if (t === 'revenue') {
      const orders = await prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: startDate } },
        select: { total: true, createdAt: true },
      });
      const monthRevenue: Record<string, number> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = d.toLocaleString('en', { month: 'short' });
        monthRevenue[key] = 0;
      }
      for (const o of orders) {
        const key = new Date(o.createdAt).toLocaleString('en', { month: 'short' });
        if (monthRevenue[key] !== undefined) monthRevenue[key] += o.total;
      }
      const totalRev = orders.reduce((s, o) => s + o.total, 0);
      const monthlyData = Object.entries(monthRevenue).map(([month, revenue]) => ({
        month,
        students: 0,
        courses: 0,
        revenue,
        exams: 0,
      }));
      const topPerformers = [{
        name: 'Total Revenue',
        metric: `$${totalRev.toLocaleString()}`,
        metricAr: `${totalRev.toLocaleString()} $`,
        type: 'instructor' as const,
      }];
      return { monthlyData, topPerformers };
    }

    if (t === 'financial-detail') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { total: true, status: true, createdAt: true, paymentMethod: true },
        orderBy: { createdAt: 'desc' },
      });
      const completedOrders = orders.filter(o => o.status === 'COMPLETED');
      const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
      const monthStats: Record<string, { revenue: number; ordersCount: number }> = {};
      for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = d.toLocaleString('en', { month: 'short' });
        monthStats[key] = { revenue: 0, ordersCount: 0 };
      }
      for (const o of orders) {
        const key = new Date(o.createdAt).toLocaleString('en', { month: 'short' });
        if (monthStats[key]) {
          monthStats[key].ordersCount++;
          if (o.status === 'COMPLETED') monthStats[key].revenue += o.total;
        }
      }
      const rows = Object.entries(monthStats).map(([month, stats]) => ({
        month,
        revenue: Math.round(stats.revenue * 100) / 100,
        ordersCount: stats.ordersCount,
        avgOrderValue: stats.ordersCount > 0 ? Math.round((stats.revenue / stats.ordersCount) * 100) / 100 : 0,
      }));
      return {
        summary: { total: orders.length, totalRevenue, completedOrders: completedOrders.length },
        detailedData: rows,
      };
    }

    switch (t) {
      case 'enrollments':
        return prisma.enrollment.findMany({
          include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true } },
          },
          take: 100,
          orderBy: { createdAt: 'desc' },
        });
      default:
        // Return empty report for unknown types instead of 400
        return { summary: { total: 0 }, detailedData: [] };
    }
  },

  async exportReport(type: string, format: string, dateRange?: string): Promise<{ buffer?: Buffer; data?: unknown } | null> {
    const XLSX = await import('xlsx');
    const data = await this.getReport(type, dateRange);
    if (!data) return null;

    let rows: Record<string, unknown>[] = [];
    const d = data as { detailedData?: unknown[]; monthlyData?: unknown[]; topPerformers?: unknown[] };
    if (d.detailedData && Array.isArray(d.detailedData)) {
      rows = d.detailedData as Record<string, unknown>[];
    } else if (d.monthlyData && Array.isArray(d.monthlyData)) {
      rows = d.monthlyData as Record<string, unknown>[];
    } else if (d.topPerformers && Array.isArray(d.topPerformers)) {
      rows = d.topPerformers as Record<string, unknown>[];
    } else if (Array.isArray(data)) {
      rows = data as Record<string, unknown>[];
    } else {
      rows = [data as Record<string, unknown>];
    }

    if (rows.length === 0) rows = [{ message: 'No data' }];

    // Flatten dates for Excel
    const flatRows = rows.map(r => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        out[k] = v instanceof Date ? v.toISOString() : v;
      }
      return out;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatRows);
    XLSX.utils.book_append_sheet(wb, ws, type || 'Report');

    if (format === 'excel' || (format as string) === 'xlsx') {
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { buffer: buf as Buffer };
    }
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return { buffer: Buffer.from(csv, 'utf-8') };
    }
    return { data: flatRows };
  },

  // ==================== ADMIN COURSE CRUD ====================
  async createCourse(
    adminId: string,
    data: {
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
      instructorId?: string;
    }
  ) {
    const { slugify } = await import('../../utils/helpers');
    const instructorId = data.instructorId || adminId;
    const { instructorId: _, ...rest } = data;

    const baseSlug = slugify(rest.title || rest.titleAr || 'course');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return prisma.course.create({
      data: {
        ...rest,
        slug,
        instructorId,
        status: rest.status || 'DRAFT',
      },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  async updateCourse(
    id: string,
    data: Partial<{
      title: string;
      titleAr: string;
      description: string;
      descriptionAr: string;
      thumbnail: string;
      previewVideo: string;
      price: number;
      currency: string;
      discountPrice: number;
      category: string;
      level: string;
      language: string;
      status: string;
      featured: boolean;
      instructorId: string;
      certificateTemplateId: string | null;
    }>
  ) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return null;

    return prisma.course.update({
      where: { id },
      data,
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  async deleteCourse(id: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return null;

    await prisma.course.delete({ where: { id } });
    return true;
  },

  // ==================== ADMIN PRODUCTS (STORE) ====================
  async listProducts(query: Record<string, string>) {
    const { page, limit, skip } = parsePagination(query);
    const search = query.search;
    const status = query.status;

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleAr: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, name: true } },
          _count: { select: { orderItems: true, productOrders: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit };
  },

  async listStoreOrders(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const status = query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.productOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, title: true, titleAr: true, thumbnail: true, price: true, type: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.productOrder.count({ where }),
    ]);

    return { data: orders, total, page, limit };
  },

  async getStoreOrderStats() {
    const [totalOrders, totalRevenue, pendingCount] = await Promise.all([
      prisma.productOrder.count(),
      prisma.productOrder.aggregate({ _sum: { total: true } }),
      prisma.productOrder.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      pendingCount,
    };
  },

  async updateStoreOrderStatus(id: string, status: string) {
    const order = await prisma.productOrder.findUnique({ where: { id } });
    if (!order) return null;
    return prisma.productOrder.update({
      where: { id },
      data: { status },
    });
  },

  async deleteStoreOrder(id: string) {
    const order = await prisma.productOrder.findUnique({ where: { id } });
    if (!order) return null;
    await prisma.productOrder.delete({ where: { id } });
    return true;
  },

  async createProduct(
    adminId: string,
    data: {
      title: string;
      titleAr?: string;
      description?: string;
      price: number;
      currency?: string;
      type?: string;
      category?: string;
      thumbnail?: string;
      fileUrl?: string;
      stock?: number;
      status?: string;
    }
  ) {
    return prisma.product.create({
      data: {
        sellerId: adminId,
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        price: data.price,
        currency: data.currency || 'USD',
        type: data.type || 'DIGITAL',
        category: data.category,
        thumbnail: data.thumbnail,
        fileUrl: data.fileUrl,
        stock: data.stock,
        status: data.status || 'active',
      },
      include: {
        seller: { select: { id: true, name: true } },
      },
    });
  },

  async updateProduct(
    id: string,
    data: Partial<{
      title: string;
      titleAr: string;
      description: string;
      price: number;
      currency: string;
      type: string;
      category: string;
      thumbnail: string;
      fileUrl: string;
      stock: number;
      status: string;
    }>
  ) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;

    return prisma.product.update({
      where: { id },
      data,
      include: {
        seller: { select: { id: true, name: true } },
      },
    });
  },

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;

    await prisma.product.update({
      where: { id },
      data: { status: 'inactive' },
    });
    return true;
  },

  // ==================== CATEGORIES ====================
  async listCategories(query: Record<string, string>) {
    const service = query.service;
    const where: Prisma.CategoryWhereInput = {};
    if (service) where.service = service;

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        parent: { select: { id: true, name: true, nameEn: true, slug: true } },
        children: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    return categories;
  },

  async createCategory(data: {
    name: string;
    nameEn?: string;
    slug: string;
    service?: string;
    icon?: string;
    position?: number;
    parentId?: string | null;
  }) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) {
      let newSlug = data.slug;
      let counter = 1;
      while (await prisma.category.findUnique({ where: { slug: newSlug } })) {
        newSlug = `${data.slug}-${counter++}`;
      }
      data.slug = newSlug;
    }

    return prisma.category.create({
      data: {
        name: data.name,
        nameEn: data.nameEn,
        slug: data.slug,
        service: data.service || 'platform',
        icon: data.icon,
        position: data.position ?? 0,
        parentId: data.parentId || null,
      },
    });
  },

  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      nameEn: string;
      slug: string;
      service: string;
      icon: string;
      position: number;
      status: string;
      parentId: string | null;
    }>
  ) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return null;
    if (data.parentId === id) data.parentId = null; // prevent self-reference

    return prisma.category.update({ where: { id }, data });
  },

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return null;

    await prisma.category.delete({ where: { id } });
    return true;
  },

  // ==================== ADMIN COURSE CONTENT ====================
  async getCourseContentWithLessons(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return null;

    return prisma.chapter.findMany({
      where: { courseId, parentId: null },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { attachments: true },
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
  },

  /** @internal Sync lesson attachments */
  async _syncLessonAttachments(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    lessonId: string,
    attachments: Array<{ id?: string; name: string; url: string; type: string }>
  ) {
    const payloadIds = new Set<string>();
    for (const att of attachments) {
      if (att.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(att.id)) {
        payloadIds.add(att.id);
      }
    }
    await tx.lessonAttachment.deleteMany({
      where: payloadIds.size > 0
        ? { lessonId, id: { notIn: Array.from(payloadIds) } }
        : { lessonId },
    });
    for (const att of attachments) {
      const url = att.url?.startsWith('/') ? att.url : `/${att.url}`;
      if (att.id && payloadIds.has(att.id)) {
        await tx.lessonAttachment.updateMany({
          where: { id: att.id, lessonId },
          data: { name: att.name, url, type: att.type || 'OTHER' },
        });
      } else if (!att.id) {
        await tx.lessonAttachment.create({
          data: {
            lessonId,
            name: att.name,
            url,
            type: att.type || 'OTHER',
            size: 0,
          },
        });
      }
    }
  },

  /** @internal Sync quiz questions from lesson content JSON to Quiz table */
  async _syncLessonQuizToTable(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    lessonId: string,
    contentStr: string
  ) {
    let parsed: { questions?: Array<{ id?: string; type?: string; question?: string; questionAr?: string; options?: Array<{ id?: string; text?: string; textAr?: string; textEn?: string; isCorrect?: boolean }> }> };
    try {
      parsed = JSON.parse(contentStr);
    } catch {
      return;
    }
    const questions = parsed?.questions;
    if (!Array.isArray(questions) || questions.length === 0) return;

    await tx.quiz.deleteMany({ where: { lessonId } });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const opts = q.options ?? [];
      const correctOpt = opts.find((o) => o.isCorrect);
      const correctAnswer = correctOpt ? String(correctOpt.id ?? '') : '';
      const optionsJson = JSON.stringify(
        opts.map((o) => ({
          id: String(o.id ?? ''),
          text: o.text ?? '',
          textAr: o.textAr ?? o.text ?? '',
          textEn: o.textEn ?? o.text ?? '',
          isCorrect: o.isCorrect ?? false,
        }))
      );
      await tx.quiz.create({
        data: {
          lessonId,
          question: q.question ?? q.questionAr ?? '',
          questionAr: q.questionAr ?? q.question ?? null,
          type: (q.type ?? 'multiple_choice').replace('mcq', 'multiple_choice'),
          options: optionsJson,
          correctAnswer: correctAnswer || null,
          points: 1,
          order: i,
        },
      });
    }
  },

  /**
   * @internal Sync live-game questions from lesson content JSON to the GameQuestion table.
   * Unlike _syncLessonQuizToTable, this upserts by id and only deletes ids no longer present —
   * a wholesale delete+recreate would cascade-delete historical GameAnswer rows (real students'
   * scoring history) the moment a teacher edits a question after any session has been played,
   * silently corrupting past leaderboard totals.
   */
  async _syncLessonGameToTable(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    lessonId: string,
    contentStr: string
  ) {
    let parsed: {
      settings?: { defaultTimerSeconds?: number };
      questions?: Array<{ id?: string; type?: string; question?: string; questionAr?: string; points?: number; [key: string]: unknown }>;
    };
    try {
      parsed = JSON.parse(contentStr);
    } catch {
      return;
    }
    const questions = parsed?.questions;
    if (!Array.isArray(questions)) return;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (s: string | undefined): s is string => !!s && UUID_REGEX.test(s);

    const game = await tx.lessonGame.upsert({
      where: { lessonId },
      create: { lessonId, defaultTimerSeconds: parsed.settings?.defaultTimerSeconds ?? 30 },
      update: { defaultTimerSeconds: parsed.settings?.defaultTimerSeconds ?? 30 },
    });

    const keptQuestionIds = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { id, type, question, questionAr, points, ...rest } = q;
      const data = {
        gameId: game.id,
        type: type ?? 'mc',
        question: question ?? '',
        questionAr: questionAr ?? null,
        options: JSON.stringify(rest),
        points: points ?? 10,
        order: i,
      };

      let questionId: string;
      if (isValidUuid(id)) {
        const existing = await tx.gameQuestion.findFirst({ where: { id, gameId: game.id } });
        if (existing) {
          await tx.gameQuestion.update({ where: { id }, data });
          questionId = id;
        } else {
          const created = await tx.gameQuestion.create({ data });
          questionId = created.id;
        }
      } else {
        const created = await tx.gameQuestion.create({ data });
        questionId = created.id;
      }
      keptQuestionIds.add(questionId);
    }

    await tx.gameQuestion.deleteMany({
      where: keptQuestionIds.size > 0
        ? { gameId: game.id, id: { notIn: Array.from(keptQuestionIds) } }
        : { gameId: game.id },
    });
  },

  /**
   * @internal Sync a homework lesson item to the CourseAssignment table (reusing the same
   * model + student submission/grading flow already used by course-level assignments).
   * Upserts by lessonId (unique) so a teacher editing due date/points after students have
   * already submitted never loses those submissions/grades.
   */
  async _syncLessonAssignmentToTable(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    lessonId: string,
    courseId: string,
    instructorId: string,
    title: string,
    titleAr: string,
    contentStr?: string
  ) {
    let parsed: { description?: string; dueDate?: string; totalPoints?: number; gradingType?: string; questions?: unknown[] } = {};
    try {
      parsed = contentStr ? JSON.parse(contentStr) : {};
    } catch {
      parsed = {};
    }

    const gradingType = parsed.gradingType === 'AUTO' ? 'AUTO' : 'MANUAL';

    const data = {
      title,
      titleAr,
      courseId,
      instructorId,
      description: parsed.description ?? null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      totalPoints: parsed.totalPoints ?? 100,
      gradingType,
      content: gradingType === 'AUTO' ? JSON.stringify({ questions: parsed.questions ?? [] }) : null,
    };

    await tx.courseAssignment.upsert({
      where: { lessonId },
      create: { lessonId, ...data },
      update: data,
    });
  },

  /** @internal Upsert a single chapter/sub-section row; returns its id */
  async _upsertChapterRow(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    courseId: string,
    parentId: string | null,
    order: number,
    ch: { id?: string; title: string; titleAr?: string }
  ): Promise<string> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (s: string | undefined): s is string => !!s && UUID_REGEX.test(s);

    if (isValidUuid(ch.id)) {
      const existing = await tx.chapter.findFirst({ where: { id: ch.id!, courseId } });
      if (existing) {
        await tx.chapter.update({
          where: { id: ch.id! },
          data: { title: ch.title, titleAr: ch.titleAr ?? ch.title, order, parentId },
        });
        return ch.id!;
      }
    }
    const created = await tx.chapter.create({
      data: { courseId, title: ch.title, titleAr: ch.titleAr ?? ch.title, order, parentId },
    });
    return created.id;
  },

  /** @internal Upsert lessons for one chapter/sub-section row, and delete lessons no longer in the payload */
  async _syncLessonsForChapter(
    tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    chapterId: string,
    courseId: string,
    instructorId: string,
    lessons: Array<{
      id?: string;
      title: string;
      titleAr?: string;
      type?: string;
      duration?: number;
      isFree?: boolean;
      videoUrl?: string;
      content?: string;
      meetingProvider?: string;
      meetingUrl?: string;
      scheduledAt?: string;
      attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
    }>
  ) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (s: string | undefined): s is string => !!s && UUID_REGEX.test(s);
    const keptLessonIds = new Set<string>();

    for (let lesIdx = 0; lesIdx < lessons.length; lesIdx++) {
      const les = lessons[lesIdx];
      const lessonType = (les.type?.toUpperCase() || 'VIDEO') as string;
      const validTypes = ['VIDEO', 'TEXT', 'QUIZ', 'PDF', 'LIVE_SESSION', 'GAME', 'ASSIGNMENT'];
      const type = validTypes.includes(lessonType) ? lessonType : 'VIDEO';

      const videoUrl = type === 'PDF' ? undefined : (les.videoUrl ?? undefined);
      const pdfUrl = type === 'PDF' ? (les.videoUrl ?? undefined) : undefined;

      let meetingUrl = les.meetingUrl ?? null;
      const meetingProvider = type === 'LIVE_SESSION' ? (les.meetingProvider ?? 'zoom') : null;
      let scheduledAt: Date | null = null;
      if (type === 'LIVE_SESSION' && les.scheduledAt) {
        const d = new Date(les.scheduledAt);
        if (!isNaN(d.getTime())) scheduledAt = d;
      }
      if (type === 'LIVE_SESSION' && meetingProvider === 'zoom' && scheduledAt && !meetingUrl) {
        const zoomMeeting = await createZoomMeeting({
          topic: les.titleAr ?? les.title,
          startTime: scheduledAt,
          durationMinutes: les.duration ?? 60,
        });
        if (zoomMeeting) meetingUrl = zoomMeeting.joinUrl;
      }

      const lessonData = {
        title: les.title,
        titleAr: les.titleAr ?? les.title,
        type,
        duration: les.duration ?? 0,
        isFree: les.isFree ?? false,
        videoUrl: videoUrl ?? null,
        pdfUrl: pdfUrl ?? null,
        content: les.content ?? null,
        meetingProvider,
        meetingUrl,
        scheduledAt,
        order: lesIdx,
      };

      let lessonId: string;
      if (isValidUuid(les.id)) {
        const existingLesson = await tx.lesson.findFirst({ where: { id: les.id!, chapterId } });
        if (existingLesson) {
          await tx.lesson.update({ where: { id: les.id! }, data: { ...lessonData } });
          lessonId = les.id!;
        } else {
          const created = await tx.lesson.create({ data: { chapterId, ...lessonData } });
          lessonId = created.id;
        }
      } else {
        const created = await tx.lesson.create({ data: { chapterId, ...lessonData } });
        lessonId = created.id;
      }
      keptLessonIds.add(lessonId);
      await adminService._syncLessonAttachments(tx as any, lessonId, les.attachments ?? []);
      if (type === 'QUIZ' && les.content) {
        await adminService._syncLessonQuizToTable(tx as any, lessonId, les.content);
      }
      if (type === 'GAME' && les.content) {
        await adminService._syncLessonGameToTable(tx as any, lessonId, les.content);
      }
      if (type === 'ASSIGNMENT') {
        await adminService._syncLessonAssignmentToTable(
          tx as any,
          lessonId,
          courseId,
          instructorId,
          les.title,
          les.titleAr ?? les.title,
          les.content
        );
      }
    }

    await tx.lesson.deleteMany({
      where: keptLessonIds.size > 0
        ? { chapterId, id: { notIn: Array.from(keptLessonIds) } }
        : { chapterId },
    });
  },

  async syncCourseContent(
    courseId: string,
    chapters: Array<{
      id?: string;
      title: string;
      titleAr?: string;
      lessons: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        type?: string;
        duration?: number;
        isFree?: boolean;
        videoUrl?: string;
        content?: string;
        meetingProvider?: string;
        meetingUrl?: string;
        scheduledAt?: string;
        attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
      }>;
      subsections?: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        lessons: Array<{
          id?: string;
          title: string;
          titleAr?: string;
          type?: string;
          duration?: number;
          isFree?: boolean;
          videoUrl?: string;
          content?: string;
          meetingProvider?: string;
          meetingUrl?: string;
          scheduledAt?: string;
          attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
        }>;
      }>;
    }>
  ) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return null;

    const existingChapters = await prisma.chapter.findMany({
      where: { courseId },
      include: { lessons: true },
    });

    const payloadChapterIds = new Set<string>();

    const syncedChapters = await prisma.$transaction(async (tx) => {
      const result: Array<{ id: string; title: string; titleAr: string | null; order: number; lessons: any[]; children: any[] }> = [];

      for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
        const ch = chapters[chIdx];
        const chapterId = await adminService._upsertChapterRow(tx as any, courseId, null, chIdx, ch);
        payloadChapterIds.add(chapterId);
        await adminService._syncLessonsForChapter(tx as any, chapterId, courseId, course.instructorId, ch.lessons ?? []);

        const subsections = ch.subsections ?? [];
        for (let subIdx = 0; subIdx < subsections.length; subIdx++) {
          const sub = subsections[subIdx];
          const subId = await adminService._upsertChapterRow(tx as any, courseId, chapterId, subIdx, sub);
          payloadChapterIds.add(subId);
          await adminService._syncLessonsForChapter(tx as any, subId, courseId, course.instructorId, sub.lessons ?? []);
        }

        const chapter = await tx.chapter.findUnique({
          where: { id: chapterId },
          include: {
            lessons: { orderBy: { order: 'asc' }, include: { attachments: true } },
            children: {
              orderBy: { order: 'asc' },
              include: { lessons: { orderBy: { order: 'asc' }, include: { attachments: true } } },
            },
          },
        });
        if (chapter) result.push(chapter as any);
      }

      const toDelete = existingChapters.filter((c) => !payloadChapterIds.has(c.id));
      // Delete sub-sections before top-level chapters so a cascade delete of a
      // removed parent never races with an explicit delete of its (also removed) child.
      const toDeleteSubsections = toDelete.filter((c) => (c as any).parentId !== null);
      const toDeleteTopLevel = toDelete.filter((c) => (c as any).parentId === null);
      for (const ch of toDeleteSubsections) {
        await tx.chapter.delete({ where: { id: ch.id } });
      }
      for (const ch of toDeleteTopLevel) {
        await tx.chapter.delete({ where: { id: ch.id } });
      }

      return result;
    });

    return syncedChapters;
  },

  // ==================== PAYMENT REQUESTS (طلبات الطلاب) ====================
  async listPaymentRequests(query: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const where: { status?: string } = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
              status: true,
              city: true,
              country: true,
              createdAt: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              titleAr: true,
              slug: true,
              price: true,
              discountPrice: true,
              currency: true,
              thumbnail: true,
              category: true,
              description: true,
            },
          },
        },
      }),
      prisma.paymentRequest.count({ where }),
    ]);

    const reviewerIds = [...new Set(items.map((i) => i.reviewedBy).filter(Boolean))] as string[];
    const reviewers =
      reviewerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: reviewerIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
    const reviewerMap = new Map(reviewers.map((r) => [r.id, r]));

    const enriched = items.map((item) => ({
      ...item,
      reviewedByUser: item.reviewedBy ? reviewerMap.get(item.reviewedBy) : null,
    }));

    return { data: enriched, total, page, limit };
  },

  async approvePaymentRequest(id: string, adminId: string) {
    const req = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!req || req.status !== 'PENDING') return null;
    await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
    });
    if (req.courseId) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: req.userId, courseId: req.courseId } },
        create: { userId: req.userId, courseId: req.courseId, source: 'purchase' },
        update: { status: 'ACTIVE' },
      });
    }
    import('../../services/notification.service').then(({ notifyPaymentRequestApproved }) =>
      notifyPaymentRequestApproved(req.userId, Number(req.amount), 'ar').catch(() => {})
    );
    return true;
  },

  async rejectPaymentRequest(id: string, adminId: string, notes?: string) {
    const req = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!req || req.status !== 'PENDING') return null;
    await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), notes: notes ?? null },
    });
    import('../../services/notification.service').then(({ notifyPaymentRequestRejected }) =>
      notifyPaymentRequestRejected(req.userId, notes, 'ar').catch(() => {})
    );
    return true;
  },

  // ==================== COUPONS ====================
  async listCoupons(query: { used?: boolean; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const where: { usedCount?: { gt?: number; equals?: number } } = {};
    if (query.used === true) where.usedCount = { gt: 0 };
    else if (query.used === false) where.usedCount = { equals: 0 };

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { courseIds: { include: { course: { select: { id: true, title: true, titleAr: true } } } } },
      }),
      prisma.coupon.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async createCoupon(data: {
    code: string;
    discount: number;
    discountType?: string;
    maxUses?: number;
    minPurchase?: number;
    expiresAt?: Date;
    courseIds?: string[];
  }) {
    const { courseIds, ...rest } = data;
    const coupon = await prisma.coupon.create({
      data: rest,
      include: { courseIds: { include: { course: true } } },
    });
    if (courseIds?.length) {
      for (const cid of courseIds) {
        await prisma.couponCourse.create({ data: { couponId: coupon.id, courseId: cid } });
      }
    }
    return prisma.coupon.findUnique({
      where: { id: coupon.id },
      include: { courseIds: { include: { course: { select: { id: true, title: true, titleAr: true } } } } },
    });
  },

  async bulkCreateCoupons(
    count: number,
    data: { discount: number; discountType?: string; maxUses?: number; minPurchase?: number; expiresAt?: Date; courseIds?: string[] }
  ) {
    const { courseIds, ...couponData } = data;
    const codes: string[] = [];
    const coupons: { id: string; code: string }[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
      if (codes.includes(code)) { i--; continue; }
      codes.push(code);
      const coupon = await prisma.coupon.create({
        data: { ...couponData, code },
      });
      coupons.push({ id: coupon.id, code: coupon.code });
      if (courseIds?.length) {
        for (const cid of courseIds) {
          await prisma.couponCourse.create({ data: { couponId: coupon.id, courseId: cid } });
        }
      }
    }
    return coupons;
  },

  async updateCoupon(id: string, data: Partial<{ isActive: boolean; expiresAt: Date | null; maxUses: number }>) {
    return prisma.coupon.update({ where: { id }, data });
  },

  async deleteCoupon(id: string) {
    await prisma.couponCourse.deleteMany({ where: { couponId: id } });
    await prisma.coupon.delete({ where: { id } });
    return true;
  },

  // ==================== PAYOUTS (طلبات السحب) ====================
  async listPayouts(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const statusFilter = (query.status as string) || undefined;
    const where = statusFilter ? { status: statusFilter } : {};

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, name: true, email: true, phone: true, avatar: true, role: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    const enriched = await Promise.all(
      payouts.map(async (p) => {
        const teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId: p.userId },
        });
        return {
          ...p,
          payoutMethod: teacherProfile?.payoutMethod ?? null,
          payoutEmail: teacherProfile?.payoutEmail ?? null,
          bankDetails: teacherProfile?.bankDetails ?? null,
        };
      })
    );

    return { data: enriched, total, page, limit };
  },

  async getPayoutDetail(id: string) {
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, phone: true, avatar: true, role: true, city: true, country: true,
          },
        },
      },
    });
    if (!payout) return null;
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: payout.userId } });
    return {
      ...payout,
      payoutMethod: teacherProfile?.payoutMethod ?? null,
      payoutEmail: teacherProfile?.payoutEmail ?? null,
      bankDetails: teacherProfile?.bankDetails ?? null,
      revenueShare: teacherProfile?.revenueShare ?? 70,
    };
  },

  async approvePayout(id: string) {
    const payout = await prisma.payout.findUnique({ where: { id } });
    if (!payout || payout.status !== 'PENDING') return null;
    const result = await prisma.payout.update({
      where: { id },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });
    import('../../services/notification.service').then(({ notifyPayoutProcessed }) =>
      notifyPayoutProcessed(payout.userId, Number(payout.netAmount ?? payout.amount), payout.currency ?? 'USD', 'ar').catch(() => {})
    ).catch(() => {});
    return result;
  },

  async rejectPayout(id: string, notes?: string) {
    const payout = await prisma.payout.findUnique({ where: { id } });
    if (!payout || payout.status !== 'PENDING') return null;
    return prisma.payout.update({
      where: { id },
      data: { status: 'REJECTED', reference: notes ?? null, processedAt: new Date() },
    });
  },

  // ==================== COMMISSION CONFIG ====================
  async getCommissionConfig() {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'commission_config' },
    });
    if (setting?.value) {
      try {
        return JSON.parse(setting.value);
      } catch { /* fall through */ }
    }
    return {
      type: 'percentage',
      percentage: 30,
      amountPerStudent: 0,
      tiers: [],
    };
  },

  async updateCommissionConfig(config: {
    type: string;
    percentage?: number;
    amountPerStudent?: number;
    tiers?: Array<{ from: number; to: number | null; amount: number }>;
  }) {
    const validTypes = ['percentage', 'per_student', 'tiered'];
    if (!validTypes.includes(config.type)) {
      throw new Error('Invalid commission type');
    }

    const data = {
      type: config.type,
      percentage: Math.max(0, Math.min(100, config.percentage ?? 30)),
      amountPerStudent: Math.max(0, config.amountPerStudent ?? 0),
      tiers: (config.tiers ?? []).map((t) => ({
        from: Math.max(1, t.from),
        to: t.to != null ? Math.max(t.from, t.to) : null,
        amount: Math.max(0, t.amount),
      })),
    };

    await prisma.platformSetting.upsert({
      where: { key: 'commission_config' },
      create: { key: 'commission_config', value: JSON.stringify(data), group: 'payment' },
      update: { value: JSON.stringify(data) },
    });

    return data;
  },

  async previewCommission(config: {
    type: string;
    percentage?: number;
    amountPerStudent?: number;
    tiers?: Array<{ from: number; to: number | null; amount: number }>;
  }, exampleRevenue: number, exampleStudents: number) {
    const pct = config.percentage ?? 30;
    const perStudent = config.amountPerStudent ?? 0;
    const tiers = config.tiers ?? [];

    let platformFee = 0;
    let detail = '';

    if (config.type === 'percentage') {
      platformFee = exampleRevenue * (pct / 100);
      detail = `${pct}% of ${exampleRevenue} = ${Math.round(platformFee * 100) / 100}`;
    } else if (config.type === 'per_student') {
      platformFee = exampleStudents * perStudent;
      detail = `${perStudent} × ${exampleStudents} students = ${Math.round(platformFee * 100) / 100}`;
    } else if (config.type === 'tiered') {
      const sorted = [...tiers].sort((a: any, b: any) => a.from - b.from);
      let remaining = exampleStudents;
      const breakdown: string[] = [];
      for (const tier of sorted) {
        if (remaining <= 0) break;
        const tierEnd = tier.to ?? Infinity;
        const tierSize = tierEnd - tier.from + 1;
        const count = Math.min(remaining, tierSize);
        const tierFee = count * tier.amount;
        platformFee += tierFee;
        breakdown.push(`${count} × ${tier.amount}`);
        remaining -= count;
      }
      detail = breakdown.join(' + ') + ` = ${Math.round(platformFee * 100) / 100}`;
    }

    const instructorEarnings = Math.max(0, exampleRevenue - platformFee);
    return {
      platformFee: Math.round(platformFee * 100) / 100,
      instructorEarnings: Math.round(instructorEarnings * 100) / 100,
      detail,
    };
  },

  async listAssignments(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const type = (query.type as string) || 'all'; // 'all' | 'teacher' | 'instructor'

    const [teacherAssignments, courseAssignments] = await Promise.all([
      type === 'instructor' ? [] : prisma.assignment.findMany({
        include: {
          class: { select: { id: true, name: true, nameAr: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
      }),
      type === 'teacher' ? [] : prisma.courseAssignment.findMany({
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          instructor: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
      }),
    ]);

    const teacherItems = teacherAssignments.map((a) => ({
      id: a.id,
      type: 'teacher' as const,
      title: a.title,
      titleAr: null,
      context: a.class?.name,
      contextAr: a.class?.nameAr,
      creator: a.creator?.name,
      dueDate: a.dueDate,
      totalPoints: a.totalPoints,
      status: a.status,
      submissionsCount: a._count?.submissions ?? 0,
      createdAt: a.createdAt,
    }));

    const courseItems = courseAssignments.map((a) => ({
      id: a.id,
      type: 'instructor' as const,
      title: a.title,
      titleAr: a.titleAr,
      context: a.course?.title,
      contextAr: a.course?.titleAr,
      creator: a.instructor?.name,
      dueDate: a.dueDate,
      totalPoints: a.totalPoints,
      status: a.status,
      submissionsCount: a._count?.submissions ?? 0,
      createdAt: a.createdAt,
    }));

    const combined = [...teacherItems, ...courseItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = combined.length;
    const data = combined.slice(skip, skip + limit);
    return { data, total, page, limit };
  },
};
