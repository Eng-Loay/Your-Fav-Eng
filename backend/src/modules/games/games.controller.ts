import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { gamesService } from './games.service';

export const gamesController = {
  async getGameForLesson(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = req.params.lessonId as string;
      const game = await gamesService.getGameForLesson(lessonId, req.user.id, req.user.role);
      if (!game) return ApiResponse.notFound(res, 'Game not found');
      return ApiResponse.success(res, game);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to load game', 500);
    }
  },

  async getActiveSession(req: AuthRequest, res: Response) {
    try {
      const lessonId = req.params.lessonId as string;
      const session = await gamesService.getActiveSession(lessonId);
      return ApiResponse.success(res, session);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to load active session', 500);
    }
  },

  async createSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = req.params.lessonId as string;
      const result = await gamesService.createSession(lessonId, req.user.id, req.user.role);
      if ('error' in result) {
        if (result.error === 'forbidden') return ApiResponse.forbidden(res);
        if (result.error === 'no_questions') return ApiResponse.badRequest(res, 'Game has no questions yet');
        return ApiResponse.notFound(res, 'Lesson game not found');
      }
      return ApiResponse.created(res, result.session, 'Session created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create session', 500);
    }
  },

  async getSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const sessionId = req.params.sessionId as string;
      const role = await gamesService.resolveSessionRole(sessionId, req.user.id, req.user.role);
      if (!role) return ApiResponse.forbidden(res);
      const session = await gamesService.getSessionDetail(sessionId);
      return ApiResponse.success(res, session);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to load session', 500);
    }
  },

  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const sessionId = req.params.sessionId as string;
      const role = await gamesService.resolveSessionRole(sessionId, req.user.id, req.user.role);
      if (!role) return ApiResponse.forbidden(res);
      const leaderboard = await gamesService.getSessionLeaderboard(sessionId);
      return ApiResponse.success(res, leaderboard);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to load leaderboard', 500);
    }
  },

  async endSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const sessionId = req.params.sessionId as string;
      const result = await gamesService.endSession(sessionId, req.user.id);
      if ('error' in result) {
        if (result.error === 'forbidden') return ApiResponse.forbidden(res);
        return ApiResponse.notFound(res, 'Session not found');
      }
      return ApiResponse.success(res, result.session, 'Session ended');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to end session', 500);
    }
  },

  async getSectionLeaderboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const chapterId = req.params.chapterId as string;
      const leaderboard = await gamesService.getSectionLeaderboard(chapterId);
      return ApiResponse.success(res, leaderboard);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to load section leaderboard', 500);
    }
  },
};
