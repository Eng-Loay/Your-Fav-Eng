import { z } from 'zod';

export const createChapterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
});

export const updateChapterSchema = createChapterSchema.partial();

export const reorderChapterSchema = z.object({
  order: z.number().int().min(0),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type ReorderChapterInput = z.infer<typeof reorderChapterSchema>;
