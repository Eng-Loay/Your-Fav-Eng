import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiTutorController } from './ai-tutor.controller';

const router = Router();
const studentAuth = [authenticate, authorize('STUDENT')];

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

const quizSchema = z.object({
  count: z.number().int().min(1).max(10).optional(),
});

router.get('/lessons/:lessonId/chat', ...studentAuth, aiTutorController.getHistory);
router.post('/lessons/:lessonId/chat', ...studentAuth, validate(chatSchema), aiTutorController.chat);
router.post('/lessons/:lessonId/quiz', ...studentAuth, validate(quizSchema), aiTutorController.generateQuiz);

export default router;
