import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { assignmentsService } from './assignments.service';

export const assignmentsController = {
  async listStudentAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await assignmentsService.listStudentAssignments(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list assignments', 500);
    }
  },

  async submitCourseAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const submission = await assignmentsService.submitCourseAssignment(
        req.user.id,
        assignmentId,
        req.body
      );
      if (!submission) return ApiResponse.forbidden(res, 'Not enrolled or assignment not found');
      return ApiResponse.created(res, submission, 'Submission saved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to submit', 500);
    }
  },

  async submitTeacherAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const submission = await assignmentsService.submitTeacherAssignment(
        req.user.id,
        assignmentId,
        req.body
      );
      if (!submission) return ApiResponse.forbidden(res, 'Not in class or assignment not found');
      return ApiResponse.created(res, submission, 'Submission saved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to submit', 500);
    }
  },
};
