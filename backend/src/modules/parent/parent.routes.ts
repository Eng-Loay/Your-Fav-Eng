import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { parentController } from './parent.controller';
import { z } from 'zod';

const router = Router();
const parentAuth = [authenticate, authorize('PARENT')];

const linkChildSchema = z.object({
  email: z.string().email().optional(),
  code: z.string().optional(),
}).refine((data) => data.email || data.code, { message: 'Either email or code is required' });

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  relationship: z.string().optional(),
  address: z.string().optional(),
});

const updateNotificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  attachmentUrl: z.string().url().optional(),
});

const createConversationSchema = z.object({
  instructorId: z.string().uuid('Invalid instructor ID'),
  childId: z.string().uuid().optional(),
});

router.get('/children', ...parentAuth, parentController.listChildren);
router.get('/children/instructors', ...parentAuth, parentController.getChildrenInstructors);
router.post('/conversations/create', ...parentAuth, validate(createConversationSchema), parentController.createConversationWithInstructor);
router.post('/children/link', ...parentAuth, validate(linkChildSchema), parentController.linkChild);
router.get('/children/:childId/progress', ...parentAuth, parentController.getChildProgress);
router.get('/children/:childId/grades', ...parentAuth, parentController.getChildGrades);
router.get('/children/:childId/attendance', ...parentAuth, parentController.getChildAttendance);
router.get('/children/:childId/achievements', ...parentAuth, parentController.getChildAchievements);
router.get('/children/:childId/completed-lessons', ...parentAuth, parentController.getChildRecentCompletedLessons);
router.get('/children/:childId/weekly-study-time', ...parentAuth, parentController.getChildWeeklyStudyTime);
router.get('/dashboard/stats', ...parentAuth, parentController.getDashboardStats);
router.get('/activity/recent', ...parentAuth, parentController.getRecentActivity);
router.get('/events/upcoming', ...parentAuth, parentController.getUpcomingEvents);
router.get('/conversations', ...parentAuth, parentController.listConversations);
router.get('/conversations/:id/messages', ...parentAuth, parentController.getConversationMessages);
router.post(
  '/conversations/:id/messages',
  ...parentAuth,
  validate(sendMessageSchema),
  parentController.sendMessage
);
router.get('/profile', ...parentAuth, parentController.getProfile);
router.put('/profile', ...parentAuth, validate(updateProfileSchema), parentController.updateProfile);
router.put(
  '/notification-settings',
  ...parentAuth,
  validate(updateNotificationSettingsSchema),
  parentController.updateNotificationSettings
);

export default router;
