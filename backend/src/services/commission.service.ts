/**
 * Shared commission calculation for instructors and teachers.
 * Types: percentage | per_student | tiered
 */
import prisma from '../config/database';

export interface CommissionTier {
  from: number;
  to: number | null;
  amount: number;
}

export interface CommissionConfig {
  type: 'percentage' | 'per_student' | 'tiered';
  percentage: number;
  amountPerStudent: number;
  tiers: CommissionTier[];
}

const DEFAULT_CONFIG: CommissionConfig = {
  type: 'percentage',
  percentage: 30,
  amountPerStudent: 0,
  tiers: [],
};

export async function getCommissionConfig(userId?: string): Promise<CommissionConfig> {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        teacherProfile: { select: { commissionConfig: true } },
      },
    });
    const configStr = user?.teacherProfile?.commissionConfig;
    if (configStr) {
      try {
        const parsed = JSON.parse(configStr) as Partial<CommissionConfig>;
        return {
          type: (parsed.type as CommissionConfig['type']) ?? 'percentage',
          percentage: parsed.percentage ?? 30,
          amountPerStudent: parsed.amountPerStudent ?? 0,
          tiers: Array.isArray(parsed.tiers) ? parsed.tiers : [],
        };
      } catch { /* fall through to global */ }
    }
  }
  const setting = await prisma.platformSetting.findUnique({
    where: { key: 'commission_config' },
  });
  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value) as Partial<CommissionConfig>;
      return {
        type: (parsed.type as CommissionConfig['type']) ?? 'percentage',
        percentage: parsed.percentage ?? 30,
        amountPerStudent: parsed.amountPerStudent ?? 0,
        tiers: Array.isArray(parsed.tiers) ? parsed.tiers : [],
      };
    } catch { /* fall through */ }
  }
  return DEFAULT_CONFIG;
}

function calculateTieredFee(studentCount: number, tiers: CommissionTier[]): number {
  if (tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  let fee = 0;
  let remaining = studentCount;
  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierStart = Math.max(tier.from, 1);
    const tierEnd = tier.to ?? Infinity;
    const tierSize = tierEnd - tierStart + 1;
    const studentsInTier = Math.min(remaining, tierSize);
    fee += studentsInTier * tier.amount;
    remaining -= studentsInTier;
  }
  return fee;
}

/**
 * Calculate platform fee for a given revenue and student count.
 * Used by both instructors (course revenue) and teachers (billing subtotal).
 */
export async function calculatePlatformFee(
  config: CommissionConfig,
  revenue: number,
  studentCount: number
): Promise<number> {
  let fee = 0;
  if (config.type === 'percentage') {
    fee = revenue * (config.percentage / 100);
  } else if (config.type === 'per_student') {
    fee = studentCount * config.amountPerStudent;
  } else if (config.type === 'tiered') {
    fee = calculateTieredFee(studentCount, config.tiers);
  }
  return Math.min(fee, revenue);
}
