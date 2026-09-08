import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';

export const reviewsService = {
  async listByCourse(courseId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const where = { courseId, reported: false, status: 'APPROVED' };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { data: reviews, total, page, limit };
  },

  async create(courseId: string, userId: string, rating: number, comment?: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });
    if (!enrollment) return null;

    const existing = await prisma.review.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return null;

    const review = await prisma.review.create({
      data: { userId, courseId, rating, comment: comment ?? null, status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await reviewsService.updateCourseRating(courseId);
    return review;
  },

  async update(id: string, userId: string, rating?: number, comment?: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true, courseId: true },
    });
    if (!review || review.userId !== userId) return null;

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await reviewsService.updateCourseRating(review.courseId);
    return updated;
  },

  async delete(id: string, userId: string, userRole: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true, courseId: true },
    });
    if (!review) return null;

    const canDelete = review.userId === userId || userRole === 'ADMIN';
    if (!canDelete) return null;

    await prisma.review.delete({ where: { id } });
    await reviewsService.updateCourseRating(review.courseId);
    return true;
  },

  async incrementHelpful(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!review) return null;

    return prisma.review.update({
      where: { id },
      data: { helpful: { increment: 1 } },
    });
  },

  async report(id: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!review) return null;

    return prisma.review.update({
      where: { id },
      data: { reported: true },
    });
  },

  async getFeatured(limit = 6, homePageOnly = false) {
    const where: Record<string, unknown> = {
      reported: false,
      status: 'APPROVED',
      rating: { gte: 4 },
      comment: { not: null },
    };
    if (homePageOnly) where.showOnHomepage = true;

    const reviews = await prisma.review.findMany({
      where,
      take: limit,
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, title: true, titleAr: true } },
      },
    });
    return reviews.map((r) => {
      let textEn = r.comment || '';
      let textAr = r.comment || '';
      if (r.comment && r.comment.includes('\n---\n')) {
        const parts = r.comment.split('\n---\n');
        textEn = parts[0].trim();
        textAr = parts[1]?.trim() || textEn;
      }
      return {
        id: r.id,
        rating: r.rating,
        textAr,
        textEn,
        nameAr: r.user.name,
        nameEn: r.user.name,
        avatar: r.user.avatar || '/user-avatar.png',
        roleAr: r.course?.titleAr || r.course?.title,
        roleEn: r.course?.title,
      };
    });
  },

  async updateCourseRating(courseId: string) {
    const agg = await prisma.review.aggregate({
      where: { courseId, reported: false, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        totalReviews: agg._count.id,
      },
    });
  },
};
