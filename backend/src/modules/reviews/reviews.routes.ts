import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { reviewsController } from './reviews.controller';
import { z } from 'zod';

const router = Router();

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

router.get('/featured', reviewsController.getFeatured);
router.get('/course/:courseId', optionalAuth, reviewsController.listByCourse);
router.post(
  '/course/:courseId',
  authenticate,
  validate(createReviewSchema),
  reviewsController.create
);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewsController.update);
router.delete('/:id', authenticate, reviewsController.delete);
router.post('/:id/helpful', optionalAuth, reviewsController.incrementHelpful);
router.post('/:id/report', authenticate, reviewsController.report);

export default router;
