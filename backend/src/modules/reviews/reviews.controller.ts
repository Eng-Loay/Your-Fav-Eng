import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { reviewsService } from './reviews.service';

export const reviewsController = {
  async getFeatured(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '6', 10);
      const homePageOnly = req.query.homePageOnly === 'true';
      const data = await reviewsService.getFeatured(limit, homePageOnly);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get featured reviews', 500);
    }
  },

  async listByCourse(req: AuthRequest, res: Response) {
    try {
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
      if (!courseId) return ApiResponse.badRequest(res, 'Course ID required');
      const result = await reviewsService.listByCourse(courseId, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list reviews', 500);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
      if (!courseId) return ApiResponse.badRequest(res, 'Course ID required');
      const { rating, comment } = req.body;
      const review = await reviewsService.create(courseId, req.user.id, rating, comment);
      if (!review) return ApiResponse.forbidden(res, 'Must be enrolled to review');
      return ApiResponse.created(res, review, 'Review created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create review', 500);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { rating, comment } = req.body;
      const review = await reviewsService.update(id, req.user.id, rating, comment);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, review, 'Review updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update review', 500);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await reviewsService.delete(id, req.user.id, req.user.role);
      if (!result) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, null, 'Review deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete review', 500);
    }
  },

  async incrementHelpful(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const review = await reviewsService.incrementHelpful(id);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, { helpful: review.helpful }, 'Helpful count updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update helpful count', 500);
    }
  },

  async report(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const review = await reviewsService.report(id, req.user.id);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, null, 'Review reported');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to report review', 500);
    }
  },
};
