import { z } from 'zod';

const enrollmentStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED']);

export const enrollSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  source: z.enum(['purchase', 'teacher_assigned', 'admin', 'free']).optional(),
  assignedBy: z.string().uuid().optional(),
});

export const assignSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  courseId: z.string().uuid('Invalid course ID'),
});

export const listEnrollmentsAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  status: enrollmentStatusEnum.optional(),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
export type AssignInput = z.infer<typeof assignSchema>;
export type ListEnrollmentsAdminQuery = z.infer<typeof listEnrollmentsAdminQuerySchema>;
