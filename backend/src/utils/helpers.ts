export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

export function generateCertificateNo(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function calculatePeakStudents(snapshots: { studentCount: number }[]): number {
  if (snapshots.length === 0) return 0;
  return Math.max(...snapshots.map(s => s.studentCount));
}

export function calculateTieredPrice(studentCount: number, tiers: { minStudents: number; maxStudents: number; pricePerStudent: number }[]): number {
  const sorted = [...tiers].sort((a, b) => a.minStudents - b.minStudents);
  for (const tier of sorted) {
    if (studentCount >= tier.minStudents && studentCount <= tier.maxStudents) {
      return tier.pricePerStudent * studentCount;
    }
  }
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    return last.pricePerStudent * studentCount;
  }
  return 0;
}
