import prisma from '../../config/database';

export type GameQuestionConfig = Record<string, any>;

interface GradeResult {
  isCorrect: boolean;
  pointsEarned: number;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function fullCredit(isCorrect: boolean, points: number, secondsRemaining: number): GradeResult {
  if (!isCorrect) return { isCorrect: false, pointsEarned: 0 };
  const bonus = Math.floor(Math.max(0, secondsRemaining) * 0.5);
  return { isCorrect: true, pointsEarned: points + bonus };
}

function partialCredit(
  correctParts: number,
  totalParts: number,
  points: number,
  secondsRemaining: number
): GradeResult {
  if (totalParts > 0 && correctParts === totalParts) {
    return fullCredit(true, points, secondsRemaining);
  }
  const earned = totalParts > 0 ? Math.floor((correctParts / totalParts) * points) : 0;
  return { isCorrect: false, pointsEarned: earned };
}

/** Grades a raw submitted answer against a question's stored config. Server-authoritative: never trust client-reported correctness/timing. */
function gradeAnswer(
  question: { type: string; options: string | null; points: number },
  rawAnswer: any,
  secondsRemaining: number
): GradeResult {
  let config: GameQuestionConfig = {};
  try {
    config = question.options ? JSON.parse(question.options) : {};
  } catch {
    config = {};
  }

  switch (question.type) {
    case 'mc': {
      const options: Array<{ id: string; isCorrect?: boolean }> = config.options ?? [];
      const correctOpt = options.find((o) => o.isCorrect);
      const isCorrect = !!correctOpt && rawAnswer?.selected === correctOpt.id;
      return fullCredit(isCorrect, question.points, secondsRemaining);
    }
    case 'ms': {
      const options: Array<{ id: string; isCorrect?: boolean }> = config.options ?? [];
      const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const selected: string[] = Array.isArray(rawAnswer?.selected) ? [...rawAnswer.selected].sort() : [];
      const isCorrect = correctIds.length > 0 && JSON.stringify(correctIds) === JSON.stringify(selected);
      return fullCredit(isCorrect, question.points, secondsRemaining);
    }
    case 'tf': {
      const isCorrect = typeof config.correct === 'boolean' && rawAnswer?.selected === config.correct;
      return fullCredit(isCorrect, question.points, secondsRemaining);
    }
    case 'di': {
      const answers: string[] = Array.isArray(config.answers) ? config.answers : [];
      const isCorrect = answers.some((a) => normalizeText(a) === normalizeText(rawAnswer?.text));
      return fullCredit(isCorrect, question.points, secondsRemaining);
    }
    case 'cat': {
      const items: Array<{ id: string; correctCategoryId: string }> = config.items ?? [];
      const assignments: Record<string, string> = rawAnswer?.assignments ?? {};
      const correctParts = items.filter((it) => assignments[it.id] === it.correctCategoryId).length;
      return partialCredit(correctParts, items.length, question.points, secondsRemaining);
    }
    case 'match': {
      const items: Array<{ id: string; correctChoiceId: string }> = config.items ?? [];
      const assignments: Record<string, string> = rawAnswer?.assignments ?? {};
      const correctParts = items.filter((it) => assignments[it.id] === it.correctChoiceId).length;
      return partialCredit(correctParts, items.length, question.points, secondsRemaining);
    }
    case 'fill': {
      const blanks: Array<{ key: string; answers: string[] }> = config.blanks ?? [];
      const submitted: Record<string, string> = rawAnswer?.blanks ?? {};
      const correctParts = blanks.filter((b) =>
        (b.answers ?? []).some((a) => normalizeText(a) === normalizeText(submitted[b.key]))
      ).length;
      return partialCredit(correctParts, blanks.length, question.points, secondsRemaining);
    }
    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}

/** Strips answer-key fields from a question's config before sending to a player. */
function sanitizeQuestion(q: { id: string; type: string; question: string; questionAr: string | null; points: number; order: number; options: string | null }) {
  let config: GameQuestionConfig = {};
  try {
    config = q.options ? JSON.parse(q.options) : {};
  } catch {
    config = {};
  }

  let sanitizedConfig: GameQuestionConfig = {};
  switch (q.type) {
    case 'mc':
    case 'ms':
      sanitizedConfig = {
        options: (config.options ?? []).map((o: any) => ({ id: o.id, text: o.text })),
      };
      break;
    case 'tf':
      sanitizedConfig = {};
      break;
    case 'di':
      sanitizedConfig = {};
      break;
    case 'cat':
      sanitizedConfig = {
        categories: config.categories ?? [],
        items: (config.items ?? []).map((it: any) => ({ id: it.id, text: it.text })),
      };
      break;
    case 'match':
      sanitizedConfig = {
        choices: config.choices ?? [],
        items: (config.items ?? []).map((it: any) => ({ id: it.id, text: it.text })),
      };
      break;
    case 'fill':
      sanitizedConfig = {
        passage: config.passage ?? '',
        blanks: (config.blanks ?? []).map((b: any) => ({ key: b.key, label: b.label })),
      };
      break;
  }

  return {
    id: q.id,
    type: q.type,
    question: q.question,
    questionAr: q.questionAr,
    points: q.points,
    order: q.order,
    config: sanitizedConfig,
  };
}

async function resolveHostAccess(courseInstructorId: string, userId: string, role: string) {
  return courseInstructorId === userId || role === 'ADMIN';
}

export const gamesService = {
  gradeAnswer,
  sanitizeQuestion,

  async getGameForLesson(lessonId: string, userId: string, role: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } }, game: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
    if (!lesson || !lesson.game) return null;

    const isHost = await resolveHostAccess(lesson.chapter.course.instructorId, userId, role);
    if (isHost) {
      return { id: lesson.game.id, lessonId, defaultTimerSeconds: lesson.game.defaultTimerSeconds, questions: lesson.game.questions };
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.chapter.courseId }, status: 'ACTIVE' },
    });
    if (!enrollment) return null;

    return {
      id: lesson.game.id,
      lessonId,
      defaultTimerSeconds: lesson.game.defaultTimerSeconds,
      questionCount: lesson.game.questions.length,
    };
  },

  async getActiveSession(lessonId: string) {
    const game = await prisma.lessonGame.findUnique({ where: { lessonId } });
    if (!game) return null;
    return prisma.gameSession.findFirst({
      where: { gameId: game.id, status: { in: ['LOBBY', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createSession(lessonId: string, hostUserId: string, hostRole: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } }, game: { include: { questions: true } } },
    });
    if (!lesson || !lesson.game) return { error: 'not_found' as const };
    if (lesson.game.questions.length === 0) return { error: 'no_questions' as const };

    const isHost = await resolveHostAccess(lesson.chapter.course.instructorId, hostUserId, hostRole);
    if (!isHost) return { error: 'forbidden' as const };

    const existing = await prisma.gameSession.findFirst({
      where: { gameId: lesson.game.id, status: { in: ['LOBBY', 'ACTIVE'] } },
    });
    if (existing) return { session: existing };

    const session = await prisma.gameSession.create({
      data: {
        gameId: lesson.game.id,
        hostId: hostUserId,
        status: 'LOBBY',
        timerSeconds: lesson.game.defaultTimerSeconds,
      },
    });
    return { session };
  },

  async getSessionDetail(sessionId: string) {
    return prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        game: { include: { lesson: { include: { chapter: { include: { course: true } } } } } },
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        host: { select: { id: true, name: true } },
      },
    });
  },

  async getSessionLeaderboard(sessionId: string) {
    const participants = await prisma.gameParticipant.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { score: 'desc' },
    });
    return participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.avatar,
      score: p.score,
      maxStreak: p.maxStreak,
      completed: p.completed,
    }));
  },

  /** Resolves whether a user is the host or an enrolled player for a session; null if neither. */
  async resolveSessionRole(sessionId: string, userId: string, role: string): Promise<'host' | 'player' | null> {
    const session = await this.getSessionDetail(sessionId);
    if (!session) return null;
    const course = session.game.lesson.chapter.course;
    const isHost = await resolveHostAccess(course.instructorId, userId, role);
    if (isHost || session.hostId === userId) return 'host';

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id }, status: 'ACTIVE' },
    });
    return enrollment ? 'player' : null;
  },

  async joinLobby(sessionId: string, userId: string) {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return { error: 'not_found' as const };
    if (session.status !== 'LOBBY') {
      const existing = await prisma.gameParticipant.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
      });
      if (existing) return { participant: existing, resumed: true };
      return { error: 'already_started' as const };
    }

    // A student who already completed this game (in any past session) may not join a fresh
    // lobby and replay it — one attempt per student per lesson-game, not per session.
    const priorCompletion = await prisma.gameParticipant.findFirst({
      where: { userId, completed: true, session: { gameId: session.gameId } },
    });
    if (priorCompletion) return { error: 'already_played' as const };

    const participant = await prisma.gameParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId },
      update: {},
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    return { participant, resumed: false };
  },

  async getLobbyParticipants(sessionId: string) {
    return prisma.gameParticipant.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async startSession(sessionId: string, hostUserId: string, timerSeconds: number) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
    if (!session) return { error: 'not_found' as const };
    if (session.hostId !== hostUserId) return { error: 'forbidden' as const };
    if (session.status !== 'LOBBY') return { error: 'already_started' as const };

    const participants = await prisma.gameParticipant.findMany({ where: { sessionId } });
    if (participants.length === 0) return { error: 'empty_lobby' as const };

    const now = new Date();
    const clampedTimer = Math.min(120, Math.max(5, Math.floor(timerSeconds) || session.timerSeconds));

    await prisma.$transaction([
      prisma.gameSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE', startedAt: now, timerSeconds: clampedTimer },
      }),
      prisma.gameParticipant.updateMany({
        where: { sessionId },
        data: { currentQuestionIndex: 0, currentQuestionStartedAt: now },
      }),
    ]);

    return {
      timerSeconds: clampedTimer,
      totalQuestions: session.game.questions.length,
      firstQuestion: session.game.questions[0] ? sanitizeQuestion(session.game.questions[0]) : null,
    };
  },

  /** Server-authoritative answer submission: computes elapsed time & correctness itself, never trusts the client. */
  async submitAnswer(sessionId: string, userId: string, questionId: string, rawAnswer: any) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
    if (!session || session.status !== 'ACTIVE') return { error: 'not_active' as const };

    const participant = await prisma.gameParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!participant || participant.completed) return { error: 'not_a_player' as const };

    const questions = session.game.questions;
    const expectedQuestion = questions[participant.currentQuestionIndex];
    if (!expectedQuestion || expectedQuestion.id !== questionId) {
      return { error: 'wrong_question' as const };
    }

    const alreadyAnswered = await prisma.gameAnswer.findUnique({
      where: { participantId_questionId: { participantId: participant.id, questionId } },
    });
    if (alreadyAnswered) return { error: 'already_answered' as const };

    const startedAt = participant.currentQuestionStartedAt ?? new Date();
    const elapsedMs = Math.max(0, Date.now() - startedAt.getTime());
    const graceMs = 1500;
    const timedOut = elapsedMs >= session.timerSeconds * 1000 + graceMs;
    const secondsRemaining = timedOut ? 0 : Math.max(0, session.timerSeconds - Math.floor(elapsedMs / 1000));

    const { isCorrect, pointsEarned } = timedOut
      ? { isCorrect: false, pointsEarned: 0 }
      : gradeAnswer(expectedQuestion, rawAnswer, secondsRemaining);

    const nextIndex = participant.currentQuestionIndex + 1;
    const nextQuestion = questions[nextIndex];
    const newStreak = isCorrect ? participant.streak + 1 : 0;
    const newMaxStreak = Math.max(participant.maxStreak, newStreak);
    const now = new Date();

    const [, updatedParticipant] = await prisma.$transaction([
      prisma.gameAnswer.create({
        data: {
          sessionId,
          participantId: participant.id,
          questionId,
          userId,
          rawAnswer: JSON.stringify(rawAnswer ?? null),
          isCorrect,
          pointsEarned,
        },
      }),
      prisma.gameParticipant.update({
        where: { id: participant.id },
        data: {
          score: { increment: pointsEarned },
          streak: newStreak,
          maxStreak: newMaxStreak,
          currentQuestionIndex: nextIndex,
          currentQuestionStartedAt: nextQuestion ? now : null,
          completed: !nextQuestion,
          finishedAt: !nextQuestion ? now : null,
        },
      }),
    ]);

    let sessionEnded = false;
    if (!nextQuestion) {
      const remaining = await prisma.gameParticipant.count({ where: { sessionId, completed: false } });
      if (remaining === 0) {
        // Concurrent last-answers can all observe remaining === 0 at once; the WHERE status:'ACTIVE'
        // guard makes only the first one actually flip the row (MySQL serializes the UPDATE), so
        // exactly one caller sees count === 1 and is responsible for the single game:ended broadcast.
        const { count } = await prisma.gameSession.updateMany({
          where: { id: sessionId, status: 'ACTIVE' },
          data: { status: 'ENDED', endedAt: new Date(), endedReason: 'all_completed' },
        });
        sessionEnded = count === 1;
      }
    }

    return {
      isCorrect,
      pointsEarned,
      newScore: updatedParticipant.score,
      newStreak: updatedParticipant.streak,
      nextQuestion: nextQuestion ? sanitizeQuestion(nextQuestion) : null,
      completed: !nextQuestion,
      sessionEnded,
    };
  },

  async endSession(sessionId: string, userId: string) {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return { error: 'not_found' as const };
    if (session.hostId !== userId) return { error: 'forbidden' as const };
    if (session.status === 'ENDED') return { session };

    const now = new Date();
    const [updated] = await prisma.$transaction([
      prisma.gameSession.update({
        where: { id: sessionId },
        data: { status: 'ENDED', endedAt: now, endedReason: 'host_ended' },
      }),
      prisma.gameParticipant.updateMany({
        where: { sessionId, completed: false },
        data: { completed: true, finishedAt: now },
      }),
    ]);
    return { session: updated };
  },

  async getSectionLeaderboard(chapterId: string) {
    const chapters = await prisma.chapter.findMany({
      where: { OR: [{ id: chapterId }, { parentId: chapterId }] },
      select: { id: true },
    });
    const chapterIds = chapters.map((c) => c.id);
    if (chapterIds.length === 0) return [];

    const grouped = await prisma.gameParticipant.groupBy({
      by: ['userId'],
      where: { session: { game: { lesson: { chapterId: { in: chapterIds } } } } },
      _sum: { score: true },
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped
      .map((g) => ({
        userId: g.userId,
        name: userMap.get(g.userId)?.name ?? 'Unknown',
        avatar: userMap.get(g.userId)?.avatar ?? null,
        totalScore: g._sum.score ?? 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  },
};
