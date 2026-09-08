import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { instructorController } from './instructor.controller';

const router = Router();

const instructorAuth = [authenticate, authorize('TEACHER')];
const instructorOrTeacherAuth = instructorAuth;

const updateProfileSchema = z.object({
  specialty: z.string().optional(),
  experience: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
  payoutMethod: z.string().optional(),
  payoutEmail: z.string().email().optional().or(z.literal('')),
  bankDetails: z.record(z.unknown()).optional(),
  revenueShare: z.number().min(0).max(100).optional(),
});

const updatePaymentSchema = z.object({
  payoutMethod: z.string().optional(),
  payoutEmail: z.string().optional(),
  bankDetails: z.record(z.unknown()).optional(),
});

const updateNotificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

const createConversationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(['image', 'audio']).optional(),
}).refine((d) => (d.content ?? '').trim() || d.attachmentUrl, { message: 'Content or attachment required' });

const replyToReviewSchema = z.object({
  reply: z.string().min(1),
});

const createCourseAssignmentSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  courseId: z.string().uuid(),
  dueDate: z.string().optional(),
  totalPoints: z.number().min(0).optional(),
});

const updateCourseAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  totalPoints: z.number().min(0).optional(),
  status: z.string().optional(),
});

const gradeSubmissionSchema = z.object({
  grade: z.number().min(0).optional(),
  feedback: z.string().optional(),
});

// Dashboard
router.get('/dashboard/stats', ...instructorAuth, instructorController.getDashboardStats);
router.get(
  '/dashboard/revenue-monthly',
  ...instructorAuth,
  instructorController.getMonthlyRevenue
);
router.get(
  '/dashboard/enrollments-recent',
  ...instructorAuth,
  instructorController.getRecentEnrollments
);
router.get(
  '/dashboard/top-courses',
  ...instructorAuth,
  instructorController.getTopCourses
);

// Courses
router.get('/courses', ...instructorOrTeacherAuth, instructorController.listCourses);
router.get('/courses/:id/chapters', ...instructorOrTeacherAuth, instructorController.getCourseChapters);
router.post('/courses/:id/content', ...instructorOrTeacherAuth, instructorController.syncCourseContent);

// Students
router.get('/students', ...instructorAuth, instructorController.listStudents);
router.get('/students/export', ...instructorAuth, instructorController.exportStudents);

// Assignments
router.get('/assignments', ...instructorAuth, instructorController.listCourseAssignments);
router.post('/assignments', ...instructorAuth, validate(createCourseAssignmentSchema), instructorController.createCourseAssignment);
router.get('/assignments/by-lesson/:lessonId', ...instructorAuth, instructorController.getCourseAssignmentByLessonId);
router.get('/assignments/:id', ...instructorAuth, instructorController.getCourseAssignmentById);
router.put('/assignments/:id', ...instructorAuth, validate(updateCourseAssignmentSchema), instructorController.updateCourseAssignment);
router.delete('/assignments/:id', ...instructorAuth, instructorController.deleteCourseAssignment);
router.post('/assignments/:id/submissions/:studentId/grade', ...instructorAuth, validate(gradeSubmissionSchema), instructorController.gradeCourseAssignmentSubmission);

// Revenue
router.get('/revenue/summary', ...instructorAuth, instructorController.getRevenueSummary);
router.get(
  '/revenue/by-course',
  ...instructorAuth,
  instructorController.getRevenueByCourse
);

// Wallet & Payouts
router.get('/wallet/summary', ...instructorAuth, instructorController.getWalletSummary);
router.get('/payouts', ...instructorAuth, instructorController.listPayouts);
router.post('/payouts/request', ...instructorAuth, instructorController.requestPayout);

// Analytics
router.get(
  '/analytics/metrics',
  ...instructorAuth,
  instructorController.getAnalyticsMetrics
);
router.get(
  '/analytics/enrollments',
  ...instructorAuth,
  instructorController.getEnrollmentTrends
);
router.get(
  '/analytics/courses',
  ...instructorAuth,
  instructorController.getCoursePerformance
);
router.get(
  '/analytics/lessons-popular',
  ...instructorAuth,
  instructorController.getPopularLessons
);

// Reviews - specific routes before :id
router.get('/reviews/summary', ...instructorAuth, instructorController.getReviewSummary);
router.get('/reviews', ...instructorAuth, instructorController.listReviews);
router.post(
  '/reviews/:id/reply',
  ...instructorAuth,
  validate(replyToReviewSchema),
  instructorController.replyToReview
);
router.post('/reviews/:id/report', ...instructorAuth, instructorController.reportReview);

// Conversations & messaging
router.get('/enrolled-students', ...instructorAuth, instructorController.getEnrolledStudents);
router.get('/enrolled-students-parents', ...instructorAuth, instructorController.getEnrolledStudentsParents);
router.get(
  '/conversations',
  ...instructorAuth,
  instructorController.listConversations
);
router.get(
  '/conversations/:id/messages',
  ...instructorAuth,
  instructorController.getConversationMessages
);
router.post(
  '/conversations',
  ...instructorAuth,
  validate(createConversationSchema),
  instructorController.createConversation
);
router.post(
  '/conversations/:id/messages',
  ...instructorAuth,
  validate(sendMessageSchema),
  instructorController.sendMessage
);

// Profile
router.get('/profile', ...instructorAuth, instructorController.getProfile);
router.put(
  '/profile',
  ...instructorAuth,
  validate(updateProfileSchema),
  instructorController.updateProfile
);
router.put(
  '/payment',
  ...instructorAuth,
  validate(updatePaymentSchema),
  instructorController.updatePaymentSettings
);
router.put(
  '/notification-settings',
  ...instructorAuth,
  validate(updateNotificationSettingsSchema),
  instructorController.updateNotificationSettings
);

// Content Bank
router.get('/content-bank', ...instructorAuth, instructorController.listContentBank);
router.post('/content-bank', ...instructorAuth, instructorController.createContentBankItem);
router.delete('/content-bank/:id', ...instructorAuth, instructorController.deleteContentBankItem);

// Question Bank
router.get('/question-bank', ...instructorAuth, instructorController.listQuestionBank);
router.post('/question-bank', ...instructorAuth, instructorController.createQuestionBankItem);
router.delete('/question-bank/:id', ...instructorAuth, instructorController.deleteQuestionBankItem);

// Exams (filtered to instructor's courses)
router.get('/exams', ...instructorAuth, instructorController.listExams);
router.get('/exams/:id', ...instructorAuth, instructorController.getExamById);
router.post('/exams', ...instructorAuth, instructorController.createExam);
router.put('/exams/:id', ...instructorAuth, instructorController.updateExam);
router.delete('/exams/:id', ...instructorAuth, instructorController.deleteExam);
router.get('/exams/:id/questions', ...instructorAuth, instructorController.getExamQuestions);
router.post('/exams/:id/questions', ...instructorAuth, instructorController.addExamQuestion);
router.put('/exams/:id/questions/:questionId', ...instructorAuth, instructorController.updateExamQuestion);
router.delete('/exams/:id/questions/:questionId', ...instructorAuth, instructorController.deleteExamQuestion);
router.get('/exams-results', ...instructorAuth, instructorController.getExamResults);

// Comprehensive Exams (filtered to instructor's courses)
router.get('/comprehensive-exams', ...instructorAuth, instructorController.listComprehensiveExams);
router.get('/comprehensive-exams/:id', ...instructorAuth, instructorController.getComprehensiveExamById);
router.post('/comprehensive-exams', ...instructorAuth, instructorController.createComprehensiveExam);
router.put('/comprehensive-exams/:id', ...instructorAuth, instructorController.updateComprehensiveExam);
router.delete('/comprehensive-exams/:id', ...instructorAuth, instructorController.deleteComprehensiveExam);
router.post('/comprehensive-exams/:id/questions', ...instructorAuth, instructorController.addComprehensiveExamQuestion);
router.delete('/comprehensive-exams/:id/questions/:questionId', ...instructorAuth, instructorController.deleteComprehensiveExamQuestion);
router.get('/comprehensive-exams-results', ...instructorAuth, instructorController.getComprehensiveExamResults);

export default router;
