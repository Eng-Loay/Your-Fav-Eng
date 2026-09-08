import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await notificationsService.list(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list notifications', 500);
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const count = await notificationsService.getUnreadCount(req.user.id);
      return ApiResponse.success(res, { count });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get unread count', 500);
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const notification = await notificationsService.markAsRead(id, req.user.id);
      if (!notification) return ApiResponse.notFound(res, 'Notification not found');
      return ApiResponse.success(res, notification, 'Marked as read');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to mark as read', 500);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      await notificationsService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to mark all as read', 500);
    }
  },

  async getSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const settings = await notificationsService.getSettings(req.user.id);
      return ApiResponse.success(res, settings);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get notification settings', 500);
    }
  },

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const settings = await notificationsService.updateSettings(req.user.id, req.body);
      return ApiResponse.success(res, settings, 'Settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update notification settings', 500);
    }
  },
};
