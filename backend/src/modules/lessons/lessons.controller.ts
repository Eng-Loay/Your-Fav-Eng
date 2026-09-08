import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { lessonsService } from './lessons.service';

export const lessonsController = {
  async listByChapter(req: AuthRequest, res: Response) {
    try {
      const chapterId = (req.params.id ?? req.params.chapterId) as string | undefined;
      if (!chapterId) return ApiResponse.badRequest(res, 'Chapter ID required');
      const id = Array.isArray(chapterId) ? chapterId[0] : chapterId;
      const lessons = await lessonsService.listByChapter(id);
      return ApiResponse.success(res, lessons);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list lessons', 500);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const chapterId = (req.params.id ?? req.params.chapterId) as string | undefined;
      if (!chapterId) return ApiResponse.badRequest(res, 'Chapter ID required');
      const id = Array.isArray(chapterId) ? chapterId[0] : chapterId;

      const body = { ...req.body };
      if (req.file?.filename) {
        body.videoUrl = `uploads/${req.file.filename}`;
        body.videoSize = req.file.size ? req.file.size / (1024 * 1024) : undefined;
      }

      const lesson = await lessonsService.create(
        id,
        req.user.id,
        body,
        req.file
      );
      if (!lesson) return ApiResponse.notFound(res, 'Chapter not found');
      return ApiResponse.created(res, lesson, 'Lesson created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create lesson', 500);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const lesson = await lessonsService.update(
        id,
        req.user.id,
        req.body
      );
      if (!lesson) return ApiResponse.notFound(res, 'Lesson not found');
      return ApiResponse.success(res, lesson, 'Lesson updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update lesson', 500);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await lessonsService.delete(id, req.user.id);
      if (!result) return ApiResponse.notFound(res, 'Lesson not found');
      return ApiResponse.success(res, null, 'Lesson deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete lesson', 500);
    }
  },

  async complete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const progress = await lessonsService.complete(
        id,
        req.user.id
      );
      if (!progress) return ApiResponse.notFound(res, 'Lesson not found');
      return ApiResponse.success(res, progress, 'Lesson marked complete');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to mark lesson complete', 500);
    }
  },

  async getNotes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const note = await lessonsService.getNotes(
        id,
        req.user.id
      );
      return ApiResponse.success(res, note ?? { content: '' });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get notes', 500);
    }
  },

  async saveNotes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const note = await lessonsService.saveNotes(
        id,
        req.user.id,
        req.body.content
      );
      if (!note) return ApiResponse.notFound(res, 'Lesson not found');
      return ApiResponse.success(res, note, 'Notes saved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to save notes', 500);
    }
  },

  async getQuiz(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const quizzes = await lessonsService.getQuiz(id);
      return ApiResponse.success(res, quizzes);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get quiz', 500);
    }
  },

  async submitQuiz(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await lessonsService.submitQuiz(
        id,
        req.user.id,
        req.body.quizId,
        req.body.answer
      );
      if (!result) return ApiResponse.notFound(res, 'Quiz not found');
      return ApiResponse.success(res, result, 'Quiz submitted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to submit quiz', 500);
    }
  },
};
