import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { chaptersService } from './chapters.service';

export const chaptersController = {
  async listByCourse(req: AuthRequest, res: Response) {
    try {
      const courseId = (req.params.id ?? req.params.courseId) as string | undefined;
      if (!courseId) return ApiResponse.badRequest(res, 'Course ID required');
      const id = Array.isArray(courseId) ? courseId[0] : courseId;
      const chapters = await chaptersService.listByCourse(id);
      return ApiResponse.success(res, chapters);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list chapters', 500);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const courseId = (req.params.id ?? req.params.courseId) as string | undefined;
      if (!courseId) return ApiResponse.badRequest(res, 'Course ID required');
      const id = Array.isArray(courseId) ? courseId[0] : courseId;
      const chapter = await chaptersService.create(
        id,
        req.user.id,
        req.body
      );
      if (!chapter) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.created(res, chapter, 'Chapter created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create chapter', 500);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const chapter = await chaptersService.update(
        id,
        req.user.id,
        req.body
      );
      if (!chapter) return ApiResponse.notFound(res, 'Chapter not found');
      return ApiResponse.success(res, chapter, 'Chapter updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update chapter', 500);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await chaptersService.delete(id, req.user.id);
      if (!result) return ApiResponse.notFound(res, 'Chapter not found');
      return ApiResponse.success(res, null, 'Chapter deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete chapter', 500);
    }
  },

  async reorder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const chapter = await chaptersService.reorder(
        id,
        req.user.id,
        req.body.order
      );
      if (!chapter) return ApiResponse.notFound(res, 'Chapter not found');
      return ApiResponse.success(res, chapter, 'Chapter reordered');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reorder chapter', 500);
    }
  },
};
