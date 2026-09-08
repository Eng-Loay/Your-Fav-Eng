import prisma from '../../config/database';

/**
 * Computes each student's total accumulated points: game scores + best-per-quiz attempts
 * (deduped since QuizAttempt has no unique constraint per (userId, quizId) and a student
 * can resubmit) + comprehensive exam results + graded class-assignment submissions.
 * Batched across all requested student IDs to avoid N+1 queries.
 */
export async function getTotalPointsForStudents(studentIds: string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>(studentIds.map((id) => [id, 0]));
  if (studentIds.length === 0) return totals;

  const [gameSums, quizAttempts, examSums, assignmentSubs] = await Promise.all([
    prisma.gameParticipant.groupBy({
      by: ['userId'],
      where: { userId: { in: studentIds } },
      _sum: { score: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, quizId: true, score: true },
    }),
    prisma.comprehensiveExamResult.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds } },
      _sum: { score: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId: { in: studentIds }, grade: { not: null } },
      select: { studentId: true, grade: true },
    }),
  ]);

  for (const g of gameSums) {
    totals.set(g.userId, (totals.get(g.userId) ?? 0) + (g._sum.score ?? 0));
  }

  const bestPerQuiz = new Map<string, number>();
  for (const a of quizAttempts) {
    const key = `${a.userId}:${a.quizId}`;
    bestPerQuiz.set(key, Math.max(bestPerQuiz.get(key) ?? 0, a.score));
  }
  for (const [key, score] of bestPerQuiz) {
    const userId = key.split(':')[0];
    totals.set(userId, (totals.get(userId) ?? 0) + score);
  }

  for (const e of examSums) {
    totals.set(e.studentId, (totals.get(e.studentId) ?? 0) + (e._sum.score ?? 0));
  }

  for (const s of assignmentSubs) {
    totals.set(s.studentId, (totals.get(s.studentId) ?? 0) + (s.grade ?? 0));
  }

  return totals;
}
