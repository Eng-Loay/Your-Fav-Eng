import prisma from '../../config/database';
import { coursesService } from '../courses/courses.service';

export interface CreateLessonInput {
  title: string;
  titleAr?: string;
  description?: string;
  type?: string;
  order?: number;
  duration?: number;
  content?: string;
  pdfUrl?: string;
  isFree?: boolean;
  isPreview?: boolean;
  videoUrl?: string;
  videoSize?: number;
}

export interface UpdateLessonInput extends Partial<CreateLessonInput> {}

export const lessonsService = {
  async listByChapter(chapterId: string) {
    return prisma.lesson.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
    });
  },

  async create(
    chapterId: string,
    userId: string,
    input: CreateLessonInput,
    file?: Express.Multer.File
  ) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { course: true },
    });
    if (!chapter || chapter.course.instructorId !== userId) return null;

    let videoUrl: string | undefined;
    let videoSize: number | undefined;

    if (file?.filename) {
      videoUrl = `uploads/${file.filename}`;
      videoSize = file.size ? file.size / (1024 * 1024) : undefined;
    } else if (input.videoUrl) {
      videoUrl = input.videoUrl;
      videoSize = input.videoSize;
    }

    const maxOrder = await prisma.lesson.aggregate({
      where: { chapterId },
      _max: { order: true },
    });
    const order = input.order ?? (maxOrder._max.order ?? -1) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        type: input.type || 'VIDEO',
        order,
        duration: input.duration ?? 0,
        content: input.content,
        pdfUrl: input.pdfUrl,
        isFree: input.isFree ?? false,
        isPreview: input.isPreview ?? false,
        chapterId,
        videoUrl,
        videoSize,
      },
    });

    if (videoSize) {
      await coursesService.recalculateTotalVideoSize(chapter.courseId);
    }

    return lesson;
  },

  async update(id: string, userId: string, input: UpdateLessonInput) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson || lesson.chapter.course.instructorId !== userId) return null;

    return prisma.lesson.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson || lesson.chapter.course.instructorId !== userId) return null;

    await prisma.lesson.delete({ where: { id } });
    if (lesson.videoSize) {
      await coursesService.recalculateTotalVideoSize(lesson.chapter.courseId);
    }
    return true;
  },

  async complete(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) return null;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.chapter.courseId,
        },
        status: 'ACTIVE',
      },
    });
    if (!enrollment) return null;

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: {
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });

    const totalLessons = await prisma.lesson.count({
      where: { chapter: { courseId: lesson.chapter.courseId } },
    });
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { chapter: { courseId: lesson.chapter.courseId } },
      },
    });
    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const now = new Date();
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercent,
        ...(progressPercent >= 100 ? { completedAt: now, status: 'COMPLETED' as const } : {}),
      },
    });

    if (progressPercent >= 100) {
      const course = lesson.chapter.course as { certificateTemplateId?: string | null };
      if (course?.certificateTemplateId) {
        const { certificatesService } = await import('../certificates/certificates.service');
        await certificatesService.issue(userId, lesson.chapter.courseId, undefined, course.certificateTemplateId);
      }
    }

    return progress;
  },

  async getNotes(lessonId: string, userId: string) {
    const note = await prisma.lessonNote.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });
    return note;
  },

  async saveNotes(lessonId: string, userId: string, content: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) return null;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.chapter.courseId,
        },
        status: 'ACTIVE',
      },
    });
    if (!enrollment) return null;

    return prisma.lessonNote.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: { userId, lessonId, content },
      update: { content },
    });
  },

  async getQuiz(lessonId: string) {
    let quizzes = await prisma.quiz.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });
    if (quizzes.length === 0) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { content: true, type: true },
      });
      if (lesson?.type === 'QUIZ' && lesson.content) {
        try {
          const parsed = JSON.parse(lesson.content) as {
            questions?: Array<{
              id?: string;
              type?: string;
              question?: string;
              questionAr?: string;
              options?: Array<{ id?: string; isCorrect?: boolean }>;
            }>;
          };
          const questions = parsed?.questions ?? [];
          quizzes = questions.map((q, i) => {
            const opts = Array.isArray(q.options) ? q.options : [];
            const correctOpt = opts.find((o: { isCorrect?: boolean }) => o.isCorrect);
            const correctAnswer = correctOpt ? String((correctOpt as { id?: string }).id ?? '') : '';
            return {
              id: (q.id as string) || `q-${i}`,
              lessonId,
              examId: null,
              question: q.question ?? q.questionAr ?? '',
              questionAr: q.questionAr ?? null,
              type: (q.type ?? 'multiple_choice').replace('mcq', 'multiple_choice'),
              options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options ?? []),
              correctAnswer,
              points: 1,
              order: i,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });
        } catch {
          // ignore parse errors
        }
      }
    }
    return quizzes;
  },

  async submitQuiz(
    lessonId: string,
    userId: string,
    quizId: string,
    answer: string
  ) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, lessonId },
    });
    if (!quiz) return null;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) return null;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.chapter.courseId,
        },
        status: 'ACTIVE',
      },
    });
    if (!enrollment) return null;

    const options = quiz.options ? (JSON.parse(quiz.options) as Array<{ text?: string; isCorrect?: boolean }>) : null;
    let isCorrect = false;
    if (quiz.correctAnswer) {
      isCorrect = answer.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();
    } else if (options) {
      const correctOption = options.find((o) => o.isCorrect);
      isCorrect = correctOption?.text === answer;
    }

    const score = isCorrect ? quiz.points : 0;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answer,
        isCorrect,
        score,
      },
    });

    return { attempt, isCorrect, score };
  },
};
