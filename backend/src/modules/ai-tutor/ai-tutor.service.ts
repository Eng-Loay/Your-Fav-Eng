import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { geminiChat, geminiJson, type GeminiMessage } from '../../services/gemini.service';

const DAILY_AI_LIMIT = 40;
const HISTORY_WINDOW = 12;

export type AiTutorError = 'not_found' | 'not_enrolled' | 'rate_limited' | 'generation_failed';
type Result<T> = { ok: true; data: T } | { ok: false; error: AiTutorError };

interface QuizQuestionOut {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type LessonWithCourse = Prisma.LessonGetPayload<{ include: { chapter: { include: { course: true } } } }>;

async function loadLessonForStudent(lessonId: string, userId: string): Promise<Result<LessonWithCourse>> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson) return { ok: false, error: 'not_found' };

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId: lesson.chapter.courseId, status: 'ACTIVE' },
  });
  if (!enrollment) return { ok: false, error: 'not_enrolled' };

  return { ok: true, data: lesson };
}

function buildLessonContext(lesson: { title: string; description: string | null; content: string | null; type: string }) {
  const parts = [`Lesson title: ${lesson.title}`];
  if (lesson.description) parts.push(`Lesson description: ${lesson.description}`);
  if (lesson.content && lesson.type === 'TEXT') parts.push(`Lesson content:\n${lesson.content}`);
  return parts.join('\n\n');
}

async function checkDailyLimit(userId: string): Promise<boolean> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const count = await prisma.lessonAiMessage.count({
    where: { userId, role: 'user', createdAt: { gte: since } },
  });
  return count < DAILY_AI_LIMIT;
}

export const aiTutorService = {
  async getHistory(lessonId: string, userId: string): Promise<Result<Awaited<ReturnType<typeof prisma.lessonAiMessage.findMany>>>> {
    const result = await loadLessonForStudent(lessonId, userId);
    if (!result.ok) return result;

    const messages = await prisma.lessonAiMessage.findMany({
      where: { lessonId, userId },
      orderBy: { createdAt: 'asc' },
    });
    return { ok: true, data: messages };
  },

  async chat(lessonId: string, userId: string, message: string): Promise<Result<Awaited<ReturnType<typeof prisma.lessonAiMessage.create>>>> {
    const result = await loadLessonForStudent(lessonId, userId);
    if (!result.ok) return result;
    const lesson = result.data;

    const withinLimit = await checkDailyLimit(userId);
    if (!withinLimit) return { ok: false, error: 'rate_limited' };

    const priorMessages = await prisma.lessonAiMessage.findMany({
      where: { lessonId, userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_WINDOW,
    });
    const history: GeminiMessage[] = priorMessages
      .reverse()
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }));

    const systemInstruction = [
      'You are a friendly, encouraging study assistant helping a student understand ONE specific lesson.',
      'Only use the lesson content below as your source of truth. Do not answer questions unrelated to this lesson —',
      'politely redirect the student back to the lesson topic instead.',
      'Reply in the same language the student writes in (Arabic or English). Keep answers concise and clear.',
      '',
      buildLessonContext(lesson),
    ].join('\n');

    await prisma.lessonAiMessage.create({ data: { lessonId, userId, role: 'user', content: message } });

    let reply: string;
    try {
      reply = await geminiChat(systemInstruction, [...history, { role: 'user', text: message }]);
    } catch (err) {
      reply = 'عذرًا، حصل خطأ مؤقت في المساعد الذكي. جرّب تاني بعد شوية.';
    }

    const saved = await prisma.lessonAiMessage.create({ data: { lessonId, userId, role: 'assistant', content: reply } });
    return { ok: true, data: saved };
  },

  async generateQuiz(lessonId: string, userId: string, count: number): Promise<Result<QuizQuestionOut[]>> {
    const result = await loadLessonForStudent(lessonId, userId);
    if (!result.ok) return result;
    const lesson = result.data;

    const withinLimit = await checkDailyLimit(userId);
    if (!withinLimit) return { ok: false, error: 'rate_limited' };

    const n = Math.min(Math.max(count || 5, 1), 10);
    const systemInstruction = [
      'You generate short multiple-choice practice quizzes strictly from the given lesson content, to help a student test their understanding.',
      'Every question must have exactly 4 options with exactly one correct answer.',
      'Reply in the same language as the lesson content (Arabic or English).',
      '',
      buildLessonContext(lesson),
    ].join('\n');

    const schema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    };

    await prisma.lessonAiMessage.create({ data: { lessonId, userId, role: 'user', content: `[quiz:${n}]` } });

    try {
      const questions = await geminiJson<QuizQuestionOut[]>(
        systemInstruction,
        `Generate ${n} multiple-choice questions from this lesson.`,
        schema
      );
      return { ok: true, data: questions };
    } catch (err) {
      return { ok: false, error: 'generation_failed' };
    }
  },
};
