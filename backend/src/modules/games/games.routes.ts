import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { gamesController } from './games.controller';

const router = Router();

router.get('/lesson/:lessonId', authenticate, gamesController.getGameForLesson);
router.get('/lesson/:lessonId/active-session', authenticate, gamesController.getActiveSession);
router.post('/lesson/:lessonId/sessions', authenticate, gamesController.createSession);
router.get('/sessions/:sessionId', authenticate, gamesController.getSession);
router.get('/sessions/:sessionId/leaderboard', authenticate, gamesController.getLeaderboard);
router.post('/sessions/:sessionId/end', authenticate, gamesController.endSession);
router.get('/sections/:chapterId/leaderboard', authenticate, gamesController.getSectionLeaderboard);

export default router;
