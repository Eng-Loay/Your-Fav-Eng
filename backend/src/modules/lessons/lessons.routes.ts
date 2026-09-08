import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uploadVideo } from '../../middleware/upload';
import { lessonsController } from './lessons.controller';
import {
  updateLessonSchema,
  saveNotesSchema,
  submitQuizSchema,
} from './lessons.validation';

const router = Router();

router.put(
  '/:id',
  authenticate,
  validate(updateLessonSchema),
  lessonsController.update
);
router.delete('/:id', authenticate, lessonsController.delete);
router.post('/:id/complete', authenticate, lessonsController.complete);
router.get('/:id/notes', authenticate, lessonsController.getNotes);
router.post(
  '/:id/notes',
  authenticate,
  validate(saveNotesSchema),
  lessonsController.saveNotes
);
router.get('/:id/quiz', lessonsController.getQuiz);
router.post(
  '/:id/quiz/submit',
  authenticate,
  validate(submitQuizSchema),
  lessonsController.submitQuiz
);

export default router;
