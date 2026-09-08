import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { messagesService } from './messages.service';

export const messagesController = {
  async submitContact(req: Request, res: Response) {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) {
        return ApiResponse.badRequest(res, 'Name, email, and message are required');
      }
      const contact = await messagesService.submitContact(name, email, message, subject);
      return ApiResponse.created(res, contact, 'Contact message submitted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to submit contact form', 500);
    }
  },

  async listConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await messagesService.listConversations(
        req.user.id,
        req.query,
        req.user.role
      );
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list conversations', 500);
    }
  },

  async getEnrolledInstructors(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await messagesService.listEnrolledInstructors(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      console.error('[getEnrolledInstructors]', err);
      return ApiResponse.error(res, 'Failed to list instructors', 500);
    }
  },

  async getEnrolledStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      if (req.user.role !== 'TEACHER') return ApiResponse.forbidden(res, 'Teachers only');
      const data = await messagesService.listEnrolledStudents(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list students', 500);
    }
  },

  async getEnrolledStudentsParents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      if (req.user.role !== 'TEACHER') return ApiResponse.forbidden(res, 'Teachers only');
      const data = await messagesService.listEnrolledStudentsParents(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list parents', 500);
    }
  },

  async createConversation(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { userId, title } = req.body;
      const conversation = await messagesService.createConversation(
        req.user.id,
        userId,
        title,
        req.user.role
      );
      if (!conversation) return ApiResponse.notFound(res, 'User not found or not enrolled');
      return ApiResponse.created(res, conversation, 'Conversation created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create conversation', 500);
    }
  },

  async getMessages(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await messagesService.getMessages(id, req.user.id, req.query);
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
      const { content, attachmentUrl, attachmentType } = req.body;
      const message = await messagesService.sendMessage(
        id,
        req.user.id,
        content || '',
        attachmentUrl,
        attachmentType
      );
      if (!message) return ApiResponse.forbidden(res, 'Not a member of this conversation');
      return ApiResponse.created(res, message, 'Message sent');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to send message', 500);
    }
  },

  async createCommunity(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { title, memberIds } = req.body;
      if (!title || !Array.isArray(memberIds)) return ApiResponse.badRequest(res, 'title and memberIds required');
      const community = await messagesService.createCommunity(
        req.user.id,
        title,
        memberIds,
        req.user.role
      );
      if (!community) return ApiResponse.forbidden(res, 'Only admin/instructor can create communities');
      return ApiResponse.created(res, community, 'Community created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create community', 500);
    }
  },

  async listCommunities(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await messagesService.listCommunities(req.user.id, req.user.role);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list communities', 500);
    }
  },

  async addCommunityMembers(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { memberIds } = req.body;
      if (!Array.isArray(memberIds)) return ApiResponse.badRequest(res, 'memberIds array required');
      const result = await messagesService.addCommunityMembers(id, req.user.id, req.user.role, memberIds);
      if (!result) return ApiResponse.forbidden(res, 'Not allowed');
      return ApiResponse.success(res, result, 'Members added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to add members', 500);
    }
  },

  async removeCommunityMember(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const result = await messagesService.removeCommunityMember(id, req.user.id, req.user.role, targetUserId);
      if (!result) return ApiResponse.forbidden(res, 'Not allowed');
      return ApiResponse.success(res, null, 'Member removed');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to remove member', 500);
    }
  },

  async getChatEnabled(_req: Request, res: Response) {
    try {
      const enabled = await messagesService.getChatEnabled();
      return ApiResponse.success(res, { enabled });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get chat status', 500);
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await messagesService.markAsRead(id, req.user.id);
      if (!result) return ApiResponse.forbidden(res, 'Not a member of this conversation');
      return ApiResponse.success(res, null, 'Marked as read');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to mark as read', 500);
    }
  },

  async uploadAttachment(req: AuthRequest, res: Response) {
    try {
      if (!req.file?.blobUrl) return ApiResponse.badRequest(res, 'No file provided');
      const url = req.file.blobUrl;
      const isImage = (req.file.mimetype || '').startsWith('image/');
      const isAudio = (req.file.mimetype || '').startsWith('audio/');
      const attachmentType = isImage ? 'image' : isAudio ? 'audio' : undefined;
      return ApiResponse.success(res, { url, attachmentType });
    } catch (err) {
      return ApiResponse.error(res, 'Upload failed', 500);
    }
  },
};
