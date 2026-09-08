import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { coursesController } from './courses.controller';
import { chaptersController } from '../chapters/chapters.controller';
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseStatusSchema,
  listCoursesQuerySchema,
} from './courses.validation';
import { createChapterSchema } from '../chapters/chapters.validation';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validateQuery(listCoursesQuerySchema),
  coursesController.list
);
router.get('/featured', coursesController.getFeatured);
router.get('/instructors', coursesController.listInstructors);
router.get('/instructors/featured', coursesController.getFeaturedInstructors);
router.get('/instructors/:id', coursesController.getInstructorProfile);
router.get('/:id', optionalAuth, coursesController.getById);
router.get('/:id/curriculum', optionalAuth, coursesController.getCurriculum);

router.post(
  '/',
  authenticate,
  authorize('TEACHER'),
  validate(createCourseSchema),
  coursesController.create
);
router.put(
  '/:id',
  authenticate,
  validate(updateCourseSchema),
  coursesController.update
);
router.delete('/:id', authenticate, coursesController.delete);
router.put(
  '/:id/status',
  authenticate,
  validate(updateCourseStatusSchema),
  coursesController.updateStatus
);

router.get(
  '/:id/chapters',
  chaptersController.listByCourse
);
router.post(
  '/:id/chapters',
  authenticate,
  authorize('TEACHER'),
  validate(createChapterSchema),
  chaptersController.create
);

export default router;
