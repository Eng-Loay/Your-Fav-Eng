import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { reportsService } from './reports.service';

export const reportsController = {
  async getTeacherStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await reportsService.getTeacherStudents(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get student reports', 500);
    }
  },

  async getTeacherFinancial(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await reportsService.getTeacherFinancial(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get financial reports', 500);
    }
  },

};
