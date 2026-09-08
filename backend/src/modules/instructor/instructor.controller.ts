import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { adminService } from '../admin/admin.service';
import { instructorService } from './instructor.service';

export const instructorController = {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const stats = await instructorService.getDashboardStats(req.user.id);
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get dashboard stats', 500);
    }
  },

  async getMonthlyRevenue(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const months = parseInt((req.query.months as string) || '12');
      const data = await instructorService.getMonthlyRevenue(req.user.id, months);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get monthly revenue', 500);
    }
  },

  async getRecentEnrollments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const limit = parseInt((req.query.limit as string) || '10');
      const enrollments = await instructorService.getRecentEnrollments(
        req.user.id,
        limit
      );
      return ApiResponse.success(res, enrollments);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get recent enrollments', 500);
    }
  },

  async getTopCourses(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const limit = parseInt((req.query.limit as string) || '5');
      const courses = await instructorService.getTopCourses(req.user.id, limit);
      return ApiResponse.success(res, courses);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get top courses', 500);
    }
  },

  async listCourses(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await instructorService.listCourses(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list courses', 500);
    }
  },

  async listStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await instructorService.listStudents(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list students', 500);
    }
  },

  async listCourseAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await instructorService.listCourseAssignments(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list assignments', 500);
    }
  },

  async createCourseAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const assignment = await instructorService.createCourseAssignment(req.user.id, req.body);
      if (!assignment) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.created(res, assignment, 'Assignment created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create assignment', 500);
    }
  },

  async getCourseAssignmentById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const assignment = await instructorService.getCourseAssignmentById(id, req.user.id);
      if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, assignment);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get assignment', 500);
    }
  },

  async getCourseAssignmentByLessonId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
      const assignment = await instructorService.getCourseAssignmentByLessonId(lessonId, req.user.id);
      if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, assignment);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get assignment', 500);
    }
  },

  async updateCourseAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const assignment = await instructorService.updateCourseAssignment(id, req.user.id, req.body);
      if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, assignment, 'Assignment updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update assignment', 500);
    }
  },

  async deleteCourseAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await instructorService.deleteCourseAssignment(id, req.user.id);
      if (!result) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, null, 'Assignment deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete assignment', 500);
    }
  },

  async gradeCourseAssignmentSubmission(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const submission = await instructorService.gradeCourseAssignmentSubmission(
        assignmentId,
        studentId,
        req.user.id,
        req.body
      );
      if (!submission) return ApiResponse.notFound(res, 'Assignment or submission not found');
      return ApiResponse.success(res, submission, 'Submission graded');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to grade submission', 500);
    }
  },

  async exportStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await instructorService.exportStudents(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to export students', 500);
    }
  },

  async getRevenueSummary(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const summary = await instructorService.getRevenueSummary(req.user.id);
      return ApiResponse.success(res, summary);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get revenue summary', 500);
    }
  },

  async getRevenueByCourse(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await instructorService.getRevenueByCourse(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get revenue by course', 500);
    }
  },

  async getWalletSummary(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const summary = await instructorService.getWalletSummary(req.user.id);
      return ApiResponse.success(res, summary);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get wallet summary', 500);
    }
  },

  async listPayouts(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await instructorService.listPayouts(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list payouts', 500);
    }
  },

  async requestPayout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { amount } = req.body ?? {};
      const payout = await instructorService.requestPayout(req.user.id, amount ? Number(amount) : undefined);
      if (!payout) return ApiResponse.badRequest(res, 'Cannot request payout');
      return ApiResponse.created(res, payout, 'Payout requested');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to request payout', 500);
    }
  },

  async getAnalyticsMetrics(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const metrics = await instructorService.getAnalyticsMetrics(req.user.id);
      return ApiResponse.success(res, metrics);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get analytics metrics', 500);
    }
  },

  async getEnrollmentTrends(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const months = parseInt((req.query.months as string) || '6');
      const data = await instructorService.getEnrollmentTrends(req.user.id, months);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get enrollment trends', 500);
    }
  },

  async getCoursePerformance(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const data = await instructorService.getCoursePerformance(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get course performance', 500);
    }
  },

  async getPopularLessons(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const limit = parseInt((req.query.limit as string) || '10');
      const data = await instructorService.getPopularLessons(req.user.id, limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get popular lessons', 500);
    }
  },

  async listReviews(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await instructorService.listReviews(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list reviews', 500);
    }
  },

  async getReviewSummary(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const summary = await instructorService.getReviewSummary(req.user.id);
      return ApiResponse.success(res, summary);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get review summary', 500);
    }
  },

  async replyToReview(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reply } = req.body;
      if (!reply) return ApiResponse.badRequest(res, 'reply required');
      const review = await instructorService.replyToReview(id, req.user.id, reply);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, review, 'Reply added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reply to review', 500);
    }
  },

  async reportReview(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const review = await instructorService.reportReview(id, req.user.id);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, review, 'Review reported');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to report review', 500);
    }
  },

  async getEnrolledStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { messagesService } = await import('../messages/messages.service');
      const data = await messagesService.listEnrolledStudents(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list students', 500);
    }
  },

  async getEnrolledStudentsParents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { messagesService } = await import('../messages/messages.service');
      const data = await messagesService.listEnrolledStudentsParents(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list parents', 500);
    }
  },

  async listConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } =
        await instructorService.listConversations(
          req.user.id,
          req.query as Record<string, unknown>
        );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list conversations', 500);
    }
  },

  async getConversationMessages(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const messages = await instructorService.getConversationMessages(
        id,
        req.user.id
      );
      if (!messages) return ApiResponse.notFound(res, 'Conversation not found');
      return ApiResponse.success(res, messages);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get messages', 500);
    }
  },

  async createConversation(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const conversation = await instructorService.createConversation(
        req.user.id,
        req.body
      );
      return ApiResponse.created(res, conversation, 'Conversation created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create conversation', 500);
    }
  },

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const message = await instructorService.sendMessage(id, req.user.id, req.body);
      if (!message) return ApiResponse.notFound(res, 'Conversation not found');
      return ApiResponse.created(res, message, 'Message sent');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to send message', 500);
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await instructorService.getProfile(req.user.id);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get profile', 500);
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await instructorService.updateProfile(req.user.id, req.body);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile, 'Profile updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update profile', 500);
    }
  },

  async updatePaymentSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await instructorService.updatePaymentSettings(
        req.user.id,
        req.body
      );
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile, 'Payment settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update payment settings', 500);
    }
  },

  async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const settings = await instructorService.updateNotificationSettings(
        req.user.id,
        req.body
      );
      return ApiResponse.success(res, settings, 'Notification settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update notification settings', 500);
    }
  },

  async getCourseChapters(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const course = await prisma.course.findUnique({
        where: { id },
        select: { instructorId: true },
      });
      if (!course || course.instructorId !== req.user.id) {
        return ApiResponse.notFound(res, 'Course not found');
      }
      const chapters = await adminService.getCourseContentWithLessons(id);
      if (!chapters) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, chapters);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get course chapters', 500);
    }
  },

  async syncCourseContent(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const course = await prisma.course.findUnique({
        where: { id },
        select: { instructorId: true },
      });
      if (!course || course.instructorId !== req.user.id) {
        return ApiResponse.notFound(res, 'Course not found');
      }
      const { chapters } = req.body;
      const result = await adminService.syncCourseContent(id, chapters ?? []);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, result, 'Content synced');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to sync course content', 500);
    }
  },

  // ==================== CONTENT BANK ====================
  async listContentBank(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.listContentBank(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to list content bank', 500); }
  },
  async createContentBankItem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const item = await instructorService.createContentBankItem(req.user.id, req.body);
      return ApiResponse.success(res, item, 'Item created');
    } catch { return ApiResponse.error(res, 'Failed to create item', 500); }
  },
  async deleteContentBankItem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.deleteContentBankItem(req.user.id, req.params.id as string);
      if (!result) return ApiResponse.notFound(res, 'Item not found or access denied');
      return ApiResponse.success(res, null, 'Item deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete item', 500); }
  },

  // ==================== QUESTION BANK ====================
  async listQuestionBank(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.listQuestionBank(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to list question bank', 500); }
  },
  async createQuestionBankItem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const item = await instructorService.createQuestionBankItem(req.user.id, req.body);
      return ApiResponse.success(res, item, 'Item created');
    } catch { return ApiResponse.error(res, 'Failed to create item', 500); }
  },
  async deleteQuestionBankItem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.deleteQuestionBankItem(req.user.id, req.params.id as string);
      if (!result) return ApiResponse.notFound(res, 'Item not found or access denied');
      return ApiResponse.success(res, null, 'Item deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete item', 500); }
  },

  // ==================== EXAMS ====================
  async listExams(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.listExams(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to list exams', 500); }
  },
  async getExamById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.getExamById(req.user.id, req.params.id as string);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch { return ApiResponse.error(res, 'Failed to get exam', 500); }
  },
  async createExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.createExam(req.user.id, req.body);
      if (!exam) return ApiResponse.forbidden(res, 'Cannot create exam for this course');
      return ApiResponse.success(res, exam, 'Exam created');
    } catch { return ApiResponse.error(res, 'Failed to create exam', 500); }
  },
  async updateExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.updateExam(req.user.id, req.params.id as string, req.body);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found or not authorized');
      return ApiResponse.success(res, exam, 'Exam updated');
    } catch { return ApiResponse.error(res, 'Failed to update exam', 500); }
  },
  async deleteExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.deleteExam(req.user.id, req.params.id as string);
      if (!result) return ApiResponse.notFound(res, 'Exam not found or not authorized');
      return ApiResponse.success(res, null, 'Exam deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete exam', 500); }
  },
  async getExamQuestions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const questions = await instructorService.getExamQuestions(req.user.id, req.params.id as string);
      if (!questions) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, questions);
    } catch { return ApiResponse.error(res, 'Failed to get questions', 500); }
  },
  async addExamQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const q = await instructorService.addExamQuestion(req.user.id, req.params.id as string, req.body);
      if (!q) return ApiResponse.forbidden(res, 'Not authorized');
      return ApiResponse.success(res, q, 'Question added');
    } catch { return ApiResponse.error(res, 'Failed to add question', 500); }
  },
  async updateExamQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const q = await instructorService.updateExamQuestion(req.user.id, req.params.id as string, req.params.questionId as string, req.body);
      if (!q) return ApiResponse.forbidden(res, 'Not authorized');
      return ApiResponse.success(res, q, 'Question updated');
    } catch { return ApiResponse.error(res, 'Failed to update question', 500); }
  },
  async deleteExamQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const q = await instructorService.deleteExamQuestion(req.user.id, req.params.id as string, req.params.questionId as string);
      if (!q) return ApiResponse.forbidden(res, 'Not authorized');
      return ApiResponse.success(res, null, 'Question deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete question', 500); }
  },
  async getExamResults(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.getExamResults(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to get results', 500); }
  },

  // ==================== COMPREHENSIVE EXAMS ====================
  async listComprehensiveExams(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.listComprehensiveExams(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to list exams', 500); }
  },
  async getComprehensiveExamById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.getComprehensiveExamById(req.user.id, req.params.id as string);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch { return ApiResponse.error(res, 'Failed to get exam', 500); }
  },
  async createComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.createComprehensiveExam(req.user.id, req.body);
      if (!exam) return ApiResponse.forbidden(res, 'Cannot create exam for this course');
      return ApiResponse.success(res, exam, 'Exam created');
    } catch { return ApiResponse.error(res, 'Failed to create exam', 500); }
  },
  async updateComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await instructorService.updateComprehensiveExam(req.user.id, req.params.id as string, req.body);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam, 'Exam updated');
    } catch { return ApiResponse.error(res, 'Failed to update exam', 500); }
  },
  async deleteComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.deleteComprehensiveExam(req.user.id, req.params.id as string);
      if (!result) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, null, 'Exam deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete exam', 500); }
  },
  async addComprehensiveExamQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const q = await instructorService.addComprehensiveExamQuestion(req.user.id, req.params.id as string, req.body);
      if (!q) return ApiResponse.forbidden(res, 'Not authorized');
      return ApiResponse.success(res, q, 'Question added');
    } catch { return ApiResponse.error(res, 'Failed to add question', 500); }
  },
  async deleteComprehensiveExamQuestion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const q = await instructorService.deleteComprehensiveExamQuestion(req.user.id, req.params.id as string, req.params.questionId as string);
      if (!q) return ApiResponse.forbidden(res, 'Not authorized');
      return ApiResponse.success(res, null, 'Question deleted');
    } catch { return ApiResponse.error(res, 'Failed to delete question', 500); }
  },
  async getComprehensiveExamResults(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await instructorService.getComprehensiveExamResults(req.user.id, req.query as any);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch { return ApiResponse.error(res, 'Failed to get results', 500); }
  },
};
