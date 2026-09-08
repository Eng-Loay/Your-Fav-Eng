import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { messagesController } from './messages.controller';
import { uploadFile } from '../../middleware/upload';
import { z } from 'zod';

const router = Router();

const createConversationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(['image', 'audio']).optional(),
}).refine((d) => (d.content ?? '').trim() || d.attachmentUrl, { message: 'Content or attachment required' });

const createCommunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  memberIds: z.array(z.string().uuid()).min(0),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

router.post('/contact', validate(contactSchema), messagesController.submitContact);
router.get('/chat-enabled', messagesController.getChatEnabled);

router.get('/enrolled-instructors', authenticate, messagesController.getEnrolledInstructors);
router.get('/enrolled-students', authenticate, messagesController.getEnrolledStudents);
router.get('/enrolled-students-parents', authenticate, messagesController.getEnrolledStudentsParents);

router.get('/conversations', authenticate, messagesController.listConversations);
router.post(
  '/conversations',
  authenticate,
  validate(createConversationSchema),
  messagesController.createConversation
);
router.get('/conversations/:id/messages', authenticate, messagesController.getMessages);
router.post(
  '/conversations/:id/messages',
  authenticate,
  validate(sendMessageSchema),
  messagesController.sendMessage
);
router.put('/conversations/:id/read', authenticate, messagesController.markAsRead);

router.post('/communities', authenticate, validate(createCommunitySchema), messagesController.createCommunity);
router.get('/communities', authenticate, messagesController.listCommunities);
router.post('/communities/:id/members', authenticate, validate(addMembersSchema), messagesController.addCommunityMembers);
router.delete('/communities/:id/members/:userId', authenticate, messagesController.removeCommunityMember);

router.post('/upload-attachment', authenticate, uploadFile, messagesController.uploadAttachment);

export default router;
