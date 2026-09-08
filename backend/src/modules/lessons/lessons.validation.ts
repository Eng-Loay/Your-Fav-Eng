import { z } from 'zod';

const lessonTypeEnum = z.enum(['VIDEO', 'PDF', 'TEXT', 'QUIZ', 'LIVE_SESSION']);

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().optional(),
  type: lessonTypeEnum.optional(),
  order: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().min(0).optional(),
  content: z.string().optional(),
  pdfUrl: z.string().optional(),
  isFree: z.boolean().optional(),
  isPreview: z.boolean().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const saveNotesSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  answer: z.string(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type SaveNotesInput = z.infer<typeof saveNotesSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
