import { z } from 'zod';

const courseStatusEnum = z
  .string()
  .optional()
  .transform((s) => {
    const u = (s || 'draft').toUpperCase();
    return ['DRAFT', 'REVIEW', 'PUBLISHED', 'HIDDEN'].includes(u) ? u : 'DRAFT';
  });
const sortEnum = z.enum(['popular', 'newest', 'priceAsc', 'priceDesc', 'rating']);

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: courseStatusEnum.optional(),
  sort: sortEnum.optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  thumbnail: z.string().optional(),
  previewVideo: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  discountPrice: z.number().min(0).optional(),
  category: z.string().max(100).optional(),
  level: z.string().max(50).optional(),
  language: z.string().max(20).optional(),
  status: courseStatusEnum.optional(),
  featured: z.boolean().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const updateCourseStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN', 'DRAFT']),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusSchema>;
