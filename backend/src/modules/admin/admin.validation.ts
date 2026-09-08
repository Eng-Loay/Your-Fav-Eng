import { z } from 'zod';

const userRoleEnum = z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']);
const userRoleSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.toUpperCase() : v),
  userRoleEnum
);
const userStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);
const userStatusSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.toUpperCase() : v),
  userStatusEnum
);
const courseStatusEnum = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'HIDDEN']);
const contentTypeEnum = z.enum(['BANNER', 'PAGE', 'BLOG', 'FAQ']);
const serviceBundleKindEnum = z.enum(['SERVICE', 'BUNDLE']);
const notificationTargetEnum = z.enum(['all', 'students', 'teachers', 'parents', 'admins', 'specific']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema,
  country: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: userRoleSchema.optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  bio: z.string().max(2000).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserStatusSchema = z.object({
  status: userStatusSchema,
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  role: z.string().optional().transform((v) => (v ? v.toUpperCase() : undefined)),
  status: z.string().optional().transform((v) => (v ? v.toUpperCase() : undefined)),
});

export const revenueShareSchema = z.object({
  revenueShare: z.number().min(0).max(100),
});

const tierSchema = z.object({
  from: z.number().min(1),
  to: z.number().nullable(),
  amount: z.number().min(0),
});

export const commissionConfigSchema = z.object({
  type: z.enum(['percentage', 'per_student', 'tiered']),
  percentage: z.number().min(0).max(100).optional(),
  amountPerStudent: z.number().min(0).optional(),
  tiers: z.array(tierSchema).optional(),
});

export const updateCourseStatusSchema = z.object({
  status: courseStatusEnum,
});

export const manualEnrollSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseId: z.string().uuid('Invalid course ID'),
});

export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
});

export const settingsGroupSchema = z.union([
  z.object({ settings: z.record(z.union([z.string(), z.number(), z.boolean()])) }),
  z.record(z.union([z.string(), z.number(), z.boolean()])),
]).transform((data) => ({
  settings: (data as { settings?: Record<string, unknown> }).settings ?? (data as Record<string, unknown>),
}));

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).optional(),
  permissions: z.array(z.string().min(1)).optional(),
});

export const createContentSchema = z.object({
  type: contentTypeEnum,
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  content: z.string().optional(),
  contentAr: z.string().optional(),
  slug: z.string().max(200).optional(),
  image: z.string().optional(),
  status: z.string().optional(),
  position: z.number().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const createServiceBundleSchema = z.object({
  kind: serviceBundleKindEnum,
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  image: z.string().optional(),
  price: z.number().min(0).optional(),
  ctaUrl: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  position: z.number().int().optional(),
});

export const updateServiceBundleSchema = createServiceBundleSchema.partial();

export const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  courseId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  instructions: z.string().optional(),
  duration: z.number().min(1).optional(),
  maxAttempts: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  showCorrectAnswer: z.boolean().optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
});

export const updateExamSchema = createExamSchema.partial();

export const sendNotificationSchema = z.object({
  target: notificationTargetEnum,
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required'),
  type: z.string().optional(),
  userIds: z.array(z.string().uuid()).optional(),
  targetEmail: z.string().email().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type RevenueShareInput = z.infer<typeof revenueShareSchema>;
export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusSchema>;
export type ManualEnrollInput = z.infer<typeof manualEnrollSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
