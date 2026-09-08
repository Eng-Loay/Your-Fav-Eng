import prisma from '../../config/database';
import { parsePagination, calculatePeakStudents, calculateTieredPrice } from '../../utils/helpers';
import { getCommissionConfig, calculatePlatformFee } from '../../services/commission.service';

const DEFAULT_VIDEO_STORAGE_RATE_PER_GB = 0.10;

async function getPlatformSetting(key: string, defaultValue: number): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key },
  });
  if (setting?.value) {
    const parsed = parseFloat(setting.value);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

export interface GenerateBillingInput {
  teacherId: string;
  billingMonth: string; // YYYY-MM format
}

export const billingService = {
  async getMySummary(userId: string) {
    const records = await prisma.billingRecord.findMany({
      where: { userId },
      orderBy: { billingMonth: 'desc' },
      take: 12,
    });

    const totalOwed = records
      .filter((r) => r.status === 'pending' || r.status === 'overdue')
      .reduce((sum, r) => sum + r.total, 0);

    const lastPaid = records.find((r) => r.status === 'paid');

    return {
      summary: {
        totalOwed,
        lastBillingMonth: records[0]?.billingMonth ?? null,
        pendingCount: records.filter((r) => r.status === 'pending' || r.status === 'overdue').length,
      },
      recentRecords: records,
    };
  },

  async getMyTransactions(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [records, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { billingMonth: 'desc' },
      }),
      prisma.billingRecord.count({ where: { userId } }),
    ]);

    return { data: records, total, page, limit };
  },

  async listAdmin(query: Record<string, unknown>, filters: { userId?: string; month?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { userId, month } = filters;

    const where: { userId?: string; billingMonth?: Date } = {};
    if (userId) where.userId = userId;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.billingMonth = new Date(y, m - 1, 1);
    }

    const [records, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ billingMonth: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.billingRecord.count({ where }),
    ]);

    return { data: records, total, page, limit };
  },

  async generateBilling(input: GenerateBillingInput) {
    const { teacherId, billingMonth } = input;
    const [year, month] = billingMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });

    if (!user || !user.teacherProfile) return null;

    const teacherProfileId = user.teacherProfile.id;

    const snapshots = await prisma.teacherStudentSnapshot.findMany({
      where: {
        teacherProfileId,
        recordedAt: { gte: monthStart, lte: monthEnd },
      },
      select: { studentCount: true },
    });

    let peakStudents = calculatePeakStudents(snapshots);

    if (peakStudents === 0) {
      const classStudentCount = await prisma.classStudent.count({
        where: {
          class: { teacherId },
          joinedAt: { lte: monthEnd },
        },
      });
      peakStudents = Math.max(peakStudents, classStudentCount);
    }

    const tiers = await prisma.pricingTier.findMany({
      where: { isActive: true },
      select: { minStudents: true, maxStudents: true, pricePerStudent: true },
    });

    const subtotal = calculateTieredPrice(peakStudents, tiers);
    const pricePerStudent = peakStudents > 0 ? subtotal / peakStudents : 0;

    const courses = await prisma.course.findMany({
      where: { instructorId: teacherId },
      select: { totalVideoSize: true },
    });

    const totalVideoSizeMB = courses.reduce((sum, c) => sum + (c.totalVideoSize ?? 0), 0);
    const totalVideoSizeGB = totalVideoSizeMB / 1024;
    const videoStorageRate = await getPlatformSetting('video_storage_rate_per_gb', DEFAULT_VIDEO_STORAGE_RATE_PER_GB);
    const videoStorageFee = Math.round(totalVideoSizeGB * videoStorageRate * 100) / 100;

    const commissionConfig = await getCommissionConfig(teacherId);
    const platformFeeRaw = await calculatePlatformFee(commissionConfig, subtotal, peakStudents);
    const platformFee = Math.round(platformFeeRaw * 100) / 100;
    const tax = 0;
    const total = Math.round((subtotal + platformFee + videoStorageFee + tax) * 100) / 100;

    const existing = await prisma.billingRecord.findUnique({
      where: { userId_billingMonth: { userId: teacherId, billingMonth: monthStart } },
    });

    if (existing) {
      return prisma.billingRecord.update({
        where: { id: existing.id },
        data: {
          peakStudents,
          studentCount: peakStudents,
          pricePerStudent,
          subtotal,
          platformFee,
          videoStorageFee,
          tax,
          total,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return prisma.billingRecord.create({
      data: {
        userId: teacherId,
        billingMonth: monthStart,
        peakStudents,
        studentCount: peakStudents,
        pricePerStudent,
        subtotal,
        platformFee,
        videoStorageFee,
        tax,
        total,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  async getPricingTiers() {
    return prisma.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { minStudents: 'asc' },
    });
  },

  async createPricingTier(data: {
    minStudents: number;
    maxStudents: number;
    pricePerStudent: number;
    currency?: string;
  }) {
    return prisma.pricingTier.create({
      data: {
        ...data,
        currency: data.currency ?? 'USD',
      },
    });
  },

  async updatePricingTier(
    id: string,
    data: Partial<{ minStudents: number; maxStudents: number; pricePerStudent: number; currency: string; isActive: boolean }>
  ) {
    return prisma.pricingTier.update({
      where: { id },
      data,
    });
  },

  async deletePricingTier(id: string) {
    return prisma.pricingTier.delete({
      where: { id },
    });
  },
};
