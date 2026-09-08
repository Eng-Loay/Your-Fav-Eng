import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { enrollmentsController } from './enrollments.controller';
import { enrollSchema, assignSchema, listEnrollmentsAdminQuerySchema } from './enrollments.validation';

const router = Router();

router.get('/', authenticate, enrollmentsController.list);

router.get('/live-sessions', authenticate, enrollmentsController.getLiveSessions);

router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validateQuery(listEnrollmentsAdminQuerySchema),
  enrollmentsController.listAdmin
);

router.post('/', authenticate, validate(enrollSchema), enrollmentsController.enroll);

router.post(
  '/assign',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  validate(assignSchema),
  enrollmentsController.assign
);

router.put('/:id/cancel', authenticate, enrollmentsController.cancel);

router.get('/:id/progress', authenticate, enrollmentsController.getProgress);

export default router;
