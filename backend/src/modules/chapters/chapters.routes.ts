import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { chaptersController } from './chapters.controller';
import {
  createChapterSchema,
  updateChapterSchema,
  reorderChapterSchema,
} from './chapters.validation';
import { lessonsController } from '../lessons/lessons.controller';
import {
  createLessonSchema,
  updateLessonSchema,
  saveNotesSchema,
  submitQuizSchema,
} from '../lessons/lessons.validation';
import { uploadVideo } from '../../middleware/upload';

const router = Router();

router.put(
  '/:id',
  authenticate,
  validate(updateChapterSchema),
  chaptersController.update
);
router.delete('/:id', authenticate, chaptersController.delete);
router.put(
  '/:id/reorder',
  authenticate,
  validate(reorderChapterSchema),
  chaptersController.reorder
);

router.get('/:id/lessons', lessonsController.listByChapter);
router.post(
  '/:id/lessons',
  authenticate,
  uploadVideo,
  validate(createLessonSchema),
  lessonsController.create
);

export default router;
