import { z } from 'zod';

export const generateBillingSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
});

export const createPricingTierSchema = z.object({
  minStudents: z.number().int().min(0),
  maxStudents: z.number().int().min(0),
  pricePerStudent: z.number().min(0),
  currency: z.string().max(10).optional(),
});

export const updatePricingTierSchema = createPricingTierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listBillingAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  userId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export type GenerateBillingInput = z.infer<typeof generateBillingSchema>;
export type CreatePricingTierInput = z.infer<typeof createPricingTierSchema>;
export type UpdatePricingTierInput = z.infer<typeof updatePricingTierSchema>;
