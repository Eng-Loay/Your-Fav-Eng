import prisma from '../../config/database';

export const reportsService = {
  async getTeacherStudents(teacherId: string, query: Record<string, unknown>) {
    const { parsePagination } = await import('../../utils/helpers');
    const { page, limit, skip } = parsePagination(query);

    const [classStudents, total] = await Promise.all([
      prisma.classStudent.findMany({
        where: { class: { teacherId } },
        skip,
        take: limit,
        include: {
          class: { select: { id: true, name: true, subject: true } },
          attendance: {
            take: 30,
            orderBy: { date: 'desc' },
          },
        },
      }),
      prisma.classStudent.count({
        where: { class: { teacherId } },
      }),
    ]);

    const studentIds = classStudents.map((cs) => cs.studentId);
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, email: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const data = classStudents.map((cs) => ({
      ...cs,
      student: studentMap.get(cs.studentId),
      attendanceRate:
        cs.attendance.length > 0
          ? (cs.attendance.filter((a) => a.status === 'present').length / cs.attendance.length) *
            100
          : 0,
    }));

    return { data, total, page, limit };
  },

  async getTeacherFinancial(teacherId: string) {
    const [billingRecords, payouts] = await Promise.all([
      prisma.billingRecord.findMany({
        where: { userId: teacherId },
        orderBy: { billingMonth: 'desc' },
        take: 12,
      }),
      prisma.payout.findMany({
        where: { userId: teacherId },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    const totalBilled = billingRecords.reduce((s, b) => s + b.total, 0);
    const totalPaid = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((s, p) => s + p.netAmount, 0);

    return {
      totalBilled,
      totalPaid,
      pendingBalance: totalBilled - totalPaid,
      billingHistory: billingRecords,
      recentPayouts: payouts.slice(0, 10),
    };
  },

};
