import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { aiTutorService, type AiTutorError } from './ai-tutor.service';

function mapError(res: Response, error: AiTutorError) {
  if (error === 'not_found') return ApiResponse.notFound(res, 'Lesson not found');
  if (error === 'not_enrolled') return ApiResponse.forbidden(res, 'You are not enrolled in this course');
  if (error === 'rate_limited') return ApiResponse.error(res, 'Daily AI usage limit reached, try again tomorrow', 429);
  return ApiResponse.error(res, 'Failed to generate quiz', 500);
}

export const aiTutorController = {
  async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
      const result = await aiTutorService.getHistory(lessonId, req.user.id);
      if (!result.ok) return mapError(res, result.error);
      return ApiResponse.success(res, result.data);
    } catch {
      return ApiResponse.error(res, 'Failed to load chat history', 500);
    }
  },

  async chat(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
      const message = String(req.body?.message || '').trim();
      if (!message) return ApiResponse.badRequest(res, 'message is required');
      const result = await aiTutorService.chat(lessonId, req.user.id, message);
      if (!result.ok) return mapError(res, result.error);
      return ApiResponse.success(res, result.data);
    } catch {
      return ApiResponse.error(res, 'Failed to send message', 500);
    }
  },

  async generateQuiz(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
      const count = Number(req.body?.count) || 5;
      const result = await aiTutorService.generateQuiz(lessonId, req.user.id, count);
      if (!result.ok) return mapError(res, result.error);
      return ApiResponse.success(res, result.data);
    } catch {
      return ApiResponse.error(res, 'Failed to generate quiz', 500);
    }
  },
};
