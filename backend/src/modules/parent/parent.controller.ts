import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { parentService } from './parent.service';

export const parentController = {
  async listChildren(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const withStats = req.query.withStats === 'true';
      const children = withStats
        ? await parentService.listChildrenWithStats(req.user.id)
        : await parentService.listChildren(req.user.id);
      return ApiResponse.success(res, children);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list children', 500);
    }
  },

  async getChildrenInstructors(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const instructors = await parentService.getChildrenInstructors(req.user.id);
      return ApiResponse.success(res, instructors);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list instructors', 500);
    }
  },

  async createConversationWithInstructor(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { instructorId, childId } = req.body;
      const conv = await parentService.createConversationWithInstructor(req.user.id, instructorId, childId);
      if (!conv) return ApiResponse.forbidden(res, 'Instructor not found or not teaching your child');
      return ApiResponse.created(res, conv, 'Conversation created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create conversation', 500);
    }
  },

  async linkChild(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { email, code } = req.body;
      const result = await parentService.linkChild(req.user.id, email, code);
      if (!result) return ApiResponse.notFound(res, 'Student not found');
      return ApiResponse.created(res, result, 'Child linked');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to link child', 500);
    }
  },

  async getChildProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const progress = await parentService.getChildProgress(req.user.id, childId);
      if (!progress) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, progress);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get progress', 500);
    }
  },

  async getChildGrades(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const grades = await parentService.getChildGrades(req.user.id, childId);
      if (!grades) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, grades);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get grades', 500);
    }
  },

  async getChildAttendance(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const result = await parentService.getChildAttendance(req.user.id, childId, req.query);
      if (!result) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, {
        data: result.data,
        pagination: { total: result.total, page: result.page, limit: result.limit },
        class: result.class,
      });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get attendance', 500);
    }
  },

  async getChildAchievements(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const achievements = await parentService.getChildAchievements(req.user.id, childId);
      if (!achievements) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, achievements);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get achievements', 500);
    }
  },

  async getChildRecentCompletedLessons(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const limit = parseInt(String(req.query.limit || 10), 10);
      const lessons = await parentService.getChildRecentCompletedLessons(req.user.id, childId, limit);
      if (!lessons) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, lessons);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get completed lessons', 500);
    }
  },

  async getChildWeeklyStudyTime(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
      const data = await parentService.getChildWeeklyStudyTime(req.user.id, childId);
      if (!data) return ApiResponse.forbidden(res, 'Child not linked');
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get study time', 500);
    }
  },

  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const stats = await parentService.getDashboardStats(req.user.id);
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get dashboard stats', 500);
    }
  },

  async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const activity = await parentService.getRecentActivity(req.user.id, req.query);
      return ApiResponse.success(res, activity);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get recent activity', 500);
    }
  },

  async getUpcomingEvents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const events = await parentService.getUpcomingEvents(req.user.id);
      return ApiResponse.success(res, events);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get upcoming events', 500);
    }
  },

  async listConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await parentService.listConversations(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list conversations', 500);
    }
  },

  async getConversationMessages(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await parentService.getConversationMessages(id, req.user.id, req.query);
      if (!result) return ApiResponse.forbidden(res, 'Not a member of this conversation');
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get messages', 500);
    }
  },

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { content, attachmentUrl } = req.body;
      const message = await parentService.sendMessage(id, req.user.id, content, attachmentUrl);
      if (!message) return ApiResponse.forbidden(res, 'Not a member of this conversation');
      return ApiResponse.created(res, message, 'Message sent');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to send message', 500);
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await parentService.getProfile(req.user.id);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get profile', 500);
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await parentService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, profile, 'Profile updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update profile', 500);
    }
  },

  async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const settings = await parentService.updateNotificationSettings(req.user.id, req.body);
      return ApiResponse.success(res, settings, 'Notification settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update notification settings', 500);
    }
  },
};
