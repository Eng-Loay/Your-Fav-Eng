import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { coursesService } from './courses.service';

export const coursesController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const { page, limit, total, data } = await coursesService.list(
        {
          search: req.query.search as string | undefined,
          category: req.query.category as string | undefined,
          status: req.query.status as 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'HIDDEN' | undefined,
          sort: req.query.sort as 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating' | undefined,
        },
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list courses', 500);
    }
  },

  async listInstructors(req: AuthRequest, res: Response) {
    try {
      const role = req.query.role as string | undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const data = await coursesService.listInstructors({ role, limit });
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list instructors', 500);
    }
  },

  async getFeaturedInstructors(_req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((_req.query.limit as string) || '6', 10);
      const data = await coursesService.getFeaturedInstructors(limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get featured instructors', 500);
    }
  },

  async getInstructorProfile(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await coursesService.getInstructorProfile(id);
      if (!data) return ApiResponse.notFound(res, 'Instructor not found');
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get instructor profile', 500);
    }
  },

  async getFeatured(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await coursesService.getFeatured(limit);
      return ApiResponse.success(res, courses);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get featured courses', 500);
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const course = await coursesService.getById(id, req.user?.id, req.user?.role);
      if (!course) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, course);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get course', 500);
    }
  },

  async getCurriculum(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const curriculum = await coursesService.getCurriculum(id, req.user?.id, req.user?.role);
      if (!curriculum) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, curriculum);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get curriculum', 500);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const course = await coursesService.create(req.user.id, req.body);
      return ApiResponse.created(res, course, 'Course created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create course', 500);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const course = await coursesService.update(id, req.user.id, req.body, req.user.role);
      if (!course) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, course, 'Course updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update course', 500);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await coursesService.delete(id, req.user.id, req.user.role);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, null, 'Course deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete course', 500);
    }
  },

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const course = await coursesService.updateStatus(
        id,
        req.user.id,
        req.user.role,
        req.body.status
      );
      if (!course) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, course, 'Status updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update status', 500);
    }
  },
};
