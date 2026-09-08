import { z } from 'zod';

export const createPackageSchema = z.object({
  title: z.string().min(1).max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  courseCount: z.number().int().min(1).optional(),
  courseIds: z.array(z.string().uuid()).optional(),
  level: z.string().max(100).optional(),
  duration: z.string().max(50).optional(),
  image: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  position: z.number().int().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const issueMembershipSchema = z.object({
  userId: z.string().uuid(),
  packageId: z.string().uuid(),
  expiresAt: z.coerce.date().optional(),
});

export const membershipTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  nameAr: z.string().max(200).optional(),
  imageUrl: z.string().optional(),
  overlayFields: z.union([z.string(), z.record(z.any())]).optional(),
  isDefault: z.boolean().optional(),
});

export const updateMembershipTemplateSchema = membershipTemplateSchema.partial();
