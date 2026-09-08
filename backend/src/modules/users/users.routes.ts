import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { usersController } from './users.controller';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const toggleWishlistSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

router.get('/dashboard/stats', authenticate, usersController.getDashboardStats);
router.get('/me/groups', authenticate, usersController.getMyGroups);
router.get('/courses', authenticate, usersController.getEnrolledCourses);
router.get('/courses/:id/progress', authenticate, usersController.getCourseProgress);
router.get('/billing/summary', authenticate, usersController.getBillingSummary);
router.get('/billing/transactions', authenticate, usersController.getTransactions);
router.get('/wishlist', authenticate, usersController.getWishlist);
router.post(
  '/wishlist/toggle',
  authenticate,
  validate(toggleWishlistSchema),
  usersController.toggleWishlist
);
router.get('/profile', authenticate, usersController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.put(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  usersController.changePassword
);

router.get('/comprehensive-exams', authenticate, usersController.getComprehensiveExams);
router.get('/comprehensive-exams/results', authenticate, usersController.getMyComprehensiveExamResults);
router.get('/comprehensive-exams/:id', authenticate, usersController.getComprehensiveExam);
router.post('/comprehensive-exams/:id/complete', authenticate, usersController.completeComprehensiveExam);

export default router;
