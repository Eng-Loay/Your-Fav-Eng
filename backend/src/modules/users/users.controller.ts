import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { usersService } from './users.service';

export const usersController = {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const stats = await usersService.getDashboardStats(req.user.id);
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get dashboard stats', 500);
    }
  },

  async getMyGroups(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const groups = await usersService.getMyGroups(req.user.id);
      return ApiResponse.success(res, groups);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get groups', 500);
    }
  },

  async getEnrolledCourses(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const courses = await usersService.getEnrolledCourses(req.user.id);
      return ApiResponse.success(res, courses);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get courses', 500);
    }
  },

  async getCourseProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const progress = await usersService.getCourseProgress(req.user.id, id);
      if (!progress) return ApiResponse.notFound(res, 'Enrollment not found');
      return ApiResponse.success(res, progress);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get progress', 500);
    }
  },

  async getBillingSummary(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const summary = await usersService.getBillingSummary(req.user.id);
      return ApiResponse.success(res, summary);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get billing summary', 500);
    }
  },

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await usersService.getTransactions(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get transactions', 500);
    }
  },

  async getWishlist(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const wishlist = await usersService.getWishlist(req.user.id);
      return ApiResponse.success(res, wishlist);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get wishlist', 500);
    }
  },

  async toggleWishlist(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { courseId } = req.body;
      const result = await usersService.toggleWishlist(req.user.id, courseId);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, result, result.added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to toggle wishlist', 500);
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await usersService.getProfile(req.user.id);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get profile', 500);
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await usersService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, profile, 'Profile updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update profile', 500);
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { currentPassword, newPassword } = req.body;
      const result = await usersService.changePassword(req.user.id, currentPassword, newPassword);
      if (result === null) return ApiResponse.notFound(res, 'User not found');
      if (result === false) return ApiResponse.badRequest(res, 'Current password is incorrect');
      return ApiResponse.success(res, null, 'Password changed');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to change password', 500);
    }
  },

  async getComprehensiveExams(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exams = await usersService.getComprehensiveExamsForStudent(req.user.id);
      return ApiResponse.success(res, exams);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exams', 500);
    }
  },

  async getComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const exam = await usersService.getComprehensiveExamForStudent(req.user.id, id);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exam', 500);
    }
  },

  async completeComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { answers } = req.body;
      const result = await usersService.completeComprehensiveExam(req.user.id, id, answers ?? []);
      if (!result) return ApiResponse.notFound(res, 'Exam not found');
      if ('error' in result) return ApiResponse.badRequest(res, result.error);
      return ApiResponse.success(res, result, 'Exam completed');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to complete exam', 500);
    }
  },

  async getMyComprehensiveExamResults(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const results = await usersService.getMyComprehensiveExamResults(req.user.id);
      return ApiResponse.success(res, results);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get results', 500);
    }
  },
};
