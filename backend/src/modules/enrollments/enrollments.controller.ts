import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { enrollmentsService } from './enrollments.service';

export const enrollmentsController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { page, limit, total, data } = await enrollmentsService.listForUser(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list enrollments', 500);
    }
  },

  async listAdmin(req: AuthRequest, res: Response) {
    try {
      const { page, limit, total, data } = await enrollmentsService.listAdmin(
        req.query as Record<string, unknown>,
        {
          search: req.query.search as string | undefined,
          status: req.query.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | undefined,
        }
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list enrollments', 500);
    }
  },

  async enroll(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const body = req.body as { courseId?: string; source?: string };
      if (!body?.courseId || typeof body.courseId !== 'string' || !body.courseId.trim()) {
        return ApiResponse.badRequest(res, 'Course ID is required');
      }
      const result = await enrollmentsService.enroll(req.user.id, {
        courseId: body.courseId.trim(),
        source: (body.source as 'purchase' | 'teacher_assigned' | 'admin' | 'free') || 'purchase',
      });
      if (result && typeof result === 'object' && 'error' in result) {
        const err = (result as { error?: string }).error;
        const messages: Record<string, string> = {
          COURSE_NOT_FOUND: 'Course not found',
          COURSE_NOT_PUBLISHED: 'Course is not published yet',
          COURSE_NOT_FREE: 'This course is not free. Please add to cart to purchase.',
          ALREADY_ENROLLED: 'You are already enrolled in this course',
        };
        return ApiResponse.badRequest(res, err && messages[err] ? messages[err] : 'Cannot enroll');
      }
      if (result && 'enrollment' in result) {
        return ApiResponse.created(res, result.enrollment, 'Enrolled successfully');
      }
      return ApiResponse.badRequest(res, 'Cannot enroll');
    } catch (err) {
      console.error('Enrollment error:', err);
      return ApiResponse.error(res, 'Failed to enroll', 500);
    }
  },

  async assign(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const enrollment = await enrollmentsService.assign(req.user.id, req.body);
      if (!enrollment) return ApiResponse.badRequest(res, 'Cannot assign: course or student not found, or insufficient permissions');
      return ApiResponse.created(res, enrollment, 'Student assigned successfully');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to assign student', 500);
    }
  },

  async cancel(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const enrollment = await enrollmentsService.cancel(id, req.user.id, req.user.role);
      if (!enrollment) return ApiResponse.notFound(res, 'Enrollment not found or cannot cancel');
      return ApiResponse.success(res, enrollment, 'Enrollment cancelled');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to cancel enrollment', 500);
    }
  },

  async getProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const progress = await enrollmentsService.getProgress(id, req.user.id, req.user.role);
      if (!progress) return ApiResponse.notFound(res, 'Enrollment not found');
      return ApiResponse.success(res, progress);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get progress', 500);
    }
  },

  async getLiveSessions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const sessions = await enrollmentsService.getLiveSessions(req.user.id);
      return ApiResponse.success(res, sessions);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get live sessions', 500);
    }
  },
};
