import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { notificationsController } from './notifications.controller';
import { z } from 'zod';

const router = Router();

const updateSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get('/', authenticate, notificationsController.list);
router.get('/unread-count', authenticate, notificationsController.getUnreadCount);
router.put('/read-all', authenticate, notificationsController.markAllAsRead);
router.put('/:id/read', authenticate, notificationsController.markAsRead);
router.get('/settings', authenticate, notificationsController.getSettings);
router.put(
  '/settings',
  authenticate,
  validate(updateSettingsSchema),
  notificationsController.updateSettings
);

export default router;
