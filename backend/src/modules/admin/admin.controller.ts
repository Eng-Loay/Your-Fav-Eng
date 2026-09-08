import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { adminService } from './admin.service';
import { messagesService } from '../messages/messages.service';

export const adminController = {
  // ==================== DASHBOARD ====================
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get dashboard stats', 500);
    }
  },

  async getMonthlyRevenue(req: AuthRequest, res: Response) {
    try {
      const months = parseInt((req.query.months as string) || '12');
      const data = await adminService.getMonthlyRevenue(months);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get revenue data', 500);
    }
  },

  async getUserGrowth(req: AuthRequest, res: Response) {
    try {
      const months = parseInt((req.query.months as string) || '12');
      const data = await adminService.getUserGrowth(months);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get user growth data', 500);
    }
  },

  async getTopCourses(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '10');
      const sortBy = (req.query.sortBy as 'students' | 'revenue') || 'students';
      const data = await adminService.getTopCourses(limit, sortBy);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get top courses', 500);
    }
  },

  async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '20');
      const data = await adminService.getRecentActivity(limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get recent activity', 500);
    }
  },

  async getEnrollmentsByCourse(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '6');
      const data = await adminService.getEnrollmentsByCourse(limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get enrollments by course', 500);
    }
  },

  async getEnrollmentsByCategory(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '6');
      const data = await adminService.getEnrollmentsByCategory(limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get enrollments by category', 500);
    }
  },

  async listAssignments(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listAssignments(req.query as Record<string, unknown>);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list assignments', 500);
    }
  },

  // ==================== USERS ====================
  async getUsersStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getUsersStats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get user stats', 500);
    }
  },

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const { search, role, status } = req.query;
      const { data, total, page, limit } = await adminService.listUsers(
        req.query as Record<string, unknown>,
        {
          search: search as string | undefined,
          role: role as string | undefined,
          status: status as string | undefined,
        }
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list users', 500);
    }
  },

  async getUserDetail(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await adminService.getUserDetail(id);
      if (!user) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, user);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get user details', 500);
    }
  },

  async createUser(req: AuthRequest, res: Response) {
    try {
      const user = await adminService.createUser(req.body);
      if (!user) return ApiResponse.badRequest(res, 'Email already exists');
      return ApiResponse.created(res, user, 'User created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create user', 500);
    }
  },

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await adminService.updateUser(id, req.body);
      if (!user) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, user, 'User updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update user', 500);
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteUser(id);
      if (!result) return ApiResponse.notFound(res, 'User not found or cannot delete admin');
      return ApiResponse.success(res, result, 'User deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete user', 500);
    }
  },

  async resetUserPassword(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { newPassword } = req.body;
      const result = await adminService.resetUserPassword(id, newPassword);
      if (!result) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, result, 'Password reset');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reset password', 500);
    }
  },

  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const user = await adminService.updateUserStatus(id, status);
      if (!user) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, user, 'Status updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update status', 500);
    }
  },

  async impersonate(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.generateImpersonationToken(req.user.id, id);
      if (!result) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, result, 'Impersonation token generated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to generate impersonation token', 500);
    }
  },

  // ==================== STUDENTS ====================
  async listStudents(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listStudents(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list students', 500);
    }
  },

  async getStudentDetails(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const student = await adminService.getStudentDetails(id);
      if (!student) return ApiResponse.notFound(res, 'Student not found');
      return ApiResponse.success(res, student);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get student details', 500);
    }
  },

  // ==================== TEACHERS ====================
  async getPendingTeachers(req: AuthRequest, res: Response) {
    try {
      const data = await adminService.getPendingTeachers();
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get pending teachers', 500);
    }
  },

  async approveTeacher(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const teacher = await adminService.approveTeacher(id);
      if (!teacher) return ApiResponse.notFound(res, 'Teacher not found');
      return ApiResponse.success(res, teacher, 'Teacher approved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to approve teacher', 500);
    }
  },

  async rejectTeacher(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.rejectTeacher(id);
      if (!result) return ApiResponse.notFound(res, 'Teacher not found');
      return ApiResponse.success(res, result, 'Teacher rejected');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reject teacher', 500);
    }
  },

  async approveStudent(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { teacherId } = req.body;
      if (!teacherId) return ApiResponse.badRequest(res, 'teacherId is required');
      const result = await adminService.approveStudent(id, teacherId);
      if (!result) return ApiResponse.notFound(res, 'Student not found');
      if ('error' in result) return ApiResponse.badRequest(res, 'Invalid teacher');
      return ApiResponse.success(res, result, 'Student approved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to approve student', 500);
    }
  },

  async rejectStudent(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.rejectStudent(id);
      if (!result) return ApiResponse.notFound(res, 'Student not found');
      return ApiResponse.success(res, result, 'Student rejected');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reject student', 500);
    }
  },

  async setInstructorRevenueShare(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { revenueShare } = req.body;
      const profile = await adminService.setInstructorRevenueShare(id, revenueShare);
      if (!profile) return ApiResponse.notFound(res, 'Teacher not found');
      return ApiResponse.success(res, profile, 'Revenue share updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update revenue share', 500);
    }
  },

  async setUserCommissionConfig(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await adminService.setUserCommissionConfig(id, req.body);
      if (!profile) return ApiResponse.notFound(res, 'User not found');
      return ApiResponse.success(res, profile, 'Commission config updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update commission config', 500);
    }
  },

  // ==================== PARENTS ====================
  async listParents(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listParents(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list parents', 500);
    }
  },

  async linkParentToStudent(req: AuthRequest, res: Response) {
    try {
      const parentId = Array.isArray(req.params.parentId) ? req.params.parentId[0] : req.params.parentId;
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await adminService.linkParentToStudent(parentId, studentId);
      if (!result) return ApiResponse.notFound(res, 'Parent or student not found');
      return ApiResponse.created(res, result, 'Parent linked to student');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to link parent to student', 500);
    }
  },

  // ==================== COURSES ====================
  async listCourses(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listCourses(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list courses', 500);
    }
  },

  async updateCourseStatus(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const course = await adminService.updateCourseStatus(id, status);
      return ApiResponse.success(res, course, 'Course status updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update course status', 500);
    }
  },

  async getCourseAnalytics(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await adminService.getCourseAnalytics(id);
      if (!data) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, data);
    } catch (err) {
      console.error('getCourseAnalytics error:', err);
      return ApiResponse.error(res, 'Failed to get course analytics', 500);
    }
  },

  // ==================== ENROLLMENTS ====================
  async listEnrollments(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listEnrollments(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list enrollments', 500);
    }
  },

  async manualEnroll(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { userId, courseId } = req.body;
      const enrollment = await adminService.manualEnroll(userId, courseId, req.user.id);
      if (!enrollment) return ApiResponse.badRequest(res, 'Invalid user or course');
      return ApiResponse.created(res, enrollment, 'Enrollment created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create enrollment', 500);
    }
  },

  async cancelEnrollment(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.cancelEnrollment(id);
      if (!result) return ApiResponse.notFound(res, 'Enrollment not found');
      return ApiResponse.success(res, result, 'Enrollment cancelled');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to cancel enrollment', 500);
    }
  },

  // ==================== SETTINGS ====================
  async getAllSettings(req: AuthRequest, res: Response) {
    try {
      const settings = await adminService.getAllSettings();
      return ApiResponse.success(res, settings);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get settings', 500);
    }
  },

  async getSettingsByGroup(req: AuthRequest, res: Response) {
    try {
      const group = Array.isArray(req.params.group) ? req.params.group[0] : req.params.group;
      const settings = await adminService.getSettingsByGroup(group);
      if (!settings) return ApiResponse.badRequest(res, 'Invalid settings group');
      return ApiResponse.success(res, settings);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get settings', 500);
    }
  },

  async updateSettingsGroup(req: AuthRequest, res: Response) {
    try {
      const group = Array.isArray(req.params.group) ? req.params.group[0] : req.params.group;
      const settings = await adminService.updateSettingsGroup(group, req.body.settings ?? req.body);
      if (!settings) return ApiResponse.badRequest(res, 'Invalid settings group');
      return ApiResponse.success(res, settings, 'Settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update settings', 500);
    }
  },

  async sendTestEmail(req: AuthRequest, res: Response) {
    try {
      const toEmail = (req.body?.to || req.query?.to || req.user?.email) as string | undefined;
      const result = await adminService.sendTestEmail(toEmail);
      if (!result.sent) {
        return ApiResponse.badRequest(res, result.message || 'Failed to send test email');
      }
      return ApiResponse.success(res, result, 'Test email sent');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to send test email', 500);
    }
  },

  // ==================== ROLES & PERMISSIONS ====================
  async listRoles(req: AuthRequest, res: Response) {
    try {
      const roles = await adminService.listRoles();
      return ApiResponse.success(res, roles);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list roles', 500);
    }
  },

  async createRole(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body;
      const role = await adminService.createRole(name, description);
      return ApiResponse.created(res, role, 'Role created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create role', 500);
    }
  },

  async updateRole(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, description } = req.body;
      const role = await adminService.updateRole(id, name, description);
      return ApiResponse.success(res, role, 'Role updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update role', 500);
    }
  },

  async deleteRole(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteRole(id);
      if (!result) return ApiResponse.badRequest(res, 'Role not found or is system role');
      return ApiResponse.success(res, result, 'Role deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete role', 500);
    }
  },

  async updateRolePermissions(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { permissionIds, permissions } = req.body;
      const role = await adminService.updateRolePermissions(id, permissionIds ?? [], permissions);
      return ApiResponse.success(res, role, 'Permissions updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update permissions', 500);
    }
  },

  async listPermissions(req: AuthRequest, res: Response) {
    try {
      const module = req.query.module as string | undefined;
      const permissions = await adminService.listPermissions(module);
      return ApiResponse.success(res, permissions);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list permissions', 500);
    }
  },

  // ==================== CONTENT ====================
  async listContent(req: AuthRequest, res: Response) {
    try {
      const type = req.query.type as string | undefined;
      const { data, total, page, limit } = await adminService.listContent(
        type,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list content', 500);
    }
  },

  async createContent(req: AuthRequest, res: Response) {
    try {
      const content = await adminService.createContent(req.body);
      return ApiResponse.created(res, content, 'Content created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create content', 500);
    }
  },

  async updateContent(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const content = await adminService.updateContent(id, req.body);
      return ApiResponse.success(res, content, 'Content updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update content', 500);
    }
  },

  async deleteContent(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteContent(id);
      return ApiResponse.success(res, null, 'Content deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete content', 500);
    }
  },

  // ==================== SERVICES & BUNDLES ====================
  async listServiceBundles(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listServiceBundles(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list services and bundles', 500);
    }
  },

  async createServiceBundle(req: AuthRequest, res: Response) {
    try {
      const item = await adminService.createServiceBundle(req.body);
      return ApiResponse.created(res, item, 'Service/Bundle created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create service/bundle', 500);
    }
  },

  async updateServiceBundle(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const item = await adminService.updateServiceBundle(id, req.body);
      if (!item) return ApiResponse.notFound(res, 'Item not found');
      return ApiResponse.success(res, item, 'Service/Bundle updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update service/bundle', 500);
    }
  },

  async deleteServiceBundle(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ok = await adminService.deleteServiceBundle(id);
      if (!ok) return ApiResponse.notFound(res, 'Item not found');
      return ApiResponse.success(res, null, 'Service/Bundle deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete service/bundle', 500);
    }
  },

  // ==================== FILES ====================
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      if (!req.file) return ApiResponse.badRequest(res, 'No file provided');
      const result = await adminService.uploadFile(req.user.id, req.file);
      return ApiResponse.success(res, result, 'File uploaded');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to upload file', 500);
    }
  },

  async listFiles(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listFiles(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list files', 500);
    }
  },

  async getStorageStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getStorageStats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get storage stats', 500);
    }
  },

  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteFile(id);
      if (!result) return ApiResponse.notFound(res, 'File not found');
      return ApiResponse.success(res, result, 'File deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete file', 500);
    }
  },

  // ==================== EXAMS ====================
  async listExams(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listExams(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list exams', 500);
    }
  },

  async getExamResults(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.getExamResults(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exam results', 500);
    }
  },

  async createExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const input = { ...req.body, creatorId: req.user.id };
      const exam = await adminService.createExam(input);
      return ApiResponse.created(res, exam, 'Exam created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create exam', 500);
    }
  },

  async updateExam(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return ApiResponse.badRequest(res, 'Exam ID required');
      const exam = await adminService.updateExam(id, req.body);
      return ApiResponse.success(res, exam, 'Exam updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update exam', 500);
    }
  },

  async deleteExam(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return ApiResponse.badRequest(res, 'Exam ID required');
      await adminService.deleteExam(id);
      return ApiResponse.success(res, null, 'Exam deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete exam', 500);
    }
  },

  async getExamById(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return ApiResponse.badRequest(res, 'Exam ID required');
      const exam = await adminService.getExamById(id);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exam', 500);
    }
  },

  async addExamQuestion(req: AuthRequest, res: Response) {
    try {
      const examId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!examId) return ApiResponse.badRequest(res, 'Exam ID required');
      const quiz = await adminService.addExamQuestion(examId, req.body);
      return ApiResponse.created(res, quiz, 'Question added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to add question', 500);
    }
  },

  async updateExamQuestion(req: AuthRequest, res: Response) {
    try {
      const examId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const questionId = Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId;
      if (!examId || !questionId) return ApiResponse.badRequest(res, 'Exam ID and Question ID required');
      const quiz = await adminService.updateExamQuestion(examId, questionId, req.body);
      return ApiResponse.success(res, quiz, 'Question updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update question', 500);
    }
  },

  async deleteExamQuestion(req: AuthRequest, res: Response) {
    try {
      const examId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const questionId = Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId;
      if (!examId || !questionId) return ApiResponse.badRequest(res, 'Exam ID and Question ID required');
      await adminService.deleteExamQuestion(examId, questionId);
      return ApiResponse.success(res, null, 'Question deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete question', 500);
    }
  },

  async listQuestionBank(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listQuestionBank(req.query as Record<string, unknown>);
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list question bank', 500);
    }
  },

  async createQuestionBankItem(req: AuthRequest, res: Response) {
    try {
      const item = await adminService.createQuestionBankItem(req.body);
      return ApiResponse.created(res, item, 'Question added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create question', 500);
    }
  },

  async updateQuestionBankItem(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const item = await adminService.updateQuestionBankItem(id, req.body);
      return ApiResponse.success(res, item, 'Question updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update question', 500);
    }
  },

  async deleteQuestionBankItem(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteQuestionBankItem(id);
      return ApiResponse.success(res, null, 'Question deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete question', 500);
    }
  },

  async listContentBank(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listContentBank(req.query as Record<string, unknown>);
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list content bank', 500);
    }
  },

  async createContentBankItem(req: AuthRequest, res: Response) {
    try {
      const item = await adminService.createContentBankItem(req.body);
      return ApiResponse.created(res, item, 'Content added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create content', 500);
    }
  },

  async updateContentBankItem(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const item = await adminService.updateContentBankItem(id, req.body);
      return ApiResponse.success(res, item, 'Content updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update content', 500);
    }
  },

  async deleteContentBankItem(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteContentBankItem(id);
      return ApiResponse.success(res, null, 'Content deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete content', 500);
    }
  },

  async listComprehensiveExams(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listComprehensiveExams(req.query as Record<string, unknown>);
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list comprehensive exams', 500);
    }
  },

  async createComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      const exam = await adminService.createComprehensiveExam(req.body);
      return ApiResponse.created(res, exam, 'Comprehensive exam created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create comprehensive exam', 500);
    }
  },

  async getComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const exam = await adminService.getComprehensiveExam(id);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exam', 500);
    }
  },

  async updateComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const exam = await adminService.updateComprehensiveExam(id, req.body);
      return ApiResponse.success(res, exam, 'Exam updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update exam', 500);
    }
  },

  async deleteComprehensiveExam(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteComprehensiveExam(id);
      return ApiResponse.success(res, null, 'Exam deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete exam', 500);
    }
  },

  async addComprehensiveExamQuestion(req: AuthRequest, res: Response) {
    try {
      const examId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const item = await adminService.addComprehensiveExamQuestion(examId, req.body);
      return ApiResponse.created(res, item, 'Question added');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to add question', 500);
    }
  },

  async deleteComprehensiveExamQuestion(req: AuthRequest, res: Response) {
    try {
      const examId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const questionId = Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId;
      await adminService.deleteComprehensiveExamQuestion(examId, questionId);
      return ApiResponse.success(res, null, 'Question deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete question', 500);
    }
  },

  async getComprehensiveExamResults(req: AuthRequest, res: Response) {
    try {
      const examId = req.query.examId as string | undefined;
      const results = await adminService.getComprehensiveExamResults(examId);
      return ApiResponse.success(res, results);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get results', 500);
    }
  },

  // ==================== CERTIFICATES ====================
  async listReviews(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listReviews(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list reviews', 500);
    }
  },

  async approveReview(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const review = await adminService.approveReview(id);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, review, 'Review approved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to approve review', 500);
    }
  },

  async rejectReview(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const review = await adminService.rejectReview(id);
      if (!review) return ApiResponse.notFound(res, 'Review not found');
      return ApiResponse.success(res, review, 'Review rejected');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reject review', 500);
    }
  },

  async setReviewShowOnHomepage(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const showOnHomepage = req.body.showOnHomepage === true;
      const review = await adminService.setReviewShowOnHomepage(id, showOnHomepage);
      if (!review) return ApiResponse.badRequest(res, 'Review must be approved before showing on homepage');
      return ApiResponse.success(res, review, showOnHomepage ? 'Shown on homepage' : 'Removed from homepage');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update review', 500);
    }
  },

  async listCertificates(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listCertificates(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list certificates', 500);
    }
  },

  async verifyCertificate(req: AuthRequest, res: Response) {
    try {
      const certNo = Array.isArray(req.params.certNo) ? req.params.certNo[0] : req.params.certNo;
      const cert = await adminService.verifyCertificate(certNo);
      if (!cert) return ApiResponse.notFound(res, 'Certificate not found');
      return ApiResponse.success(res, cert, 'Certificate verified');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to verify certificate', 500);
    }
  },

  async listCertificateTemplates(req: AuthRequest, res: Response) {
    try {
      const templates = await adminService.listCertificateTemplates();
      return ApiResponse.success(res, templates);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list templates', 500);
    }
  },

  async createCertificateTemplate(req: AuthRequest, res: Response) {
    try {
      const { name, nameAr, imageUrl, overlayFields, isDefault } = req.body;
      const template = await adminService.createCertificateTemplate({
        name: name || 'Template',
        nameAr,
        imageUrl,
        overlayFields: typeof overlayFields === 'string' ? overlayFields : JSON.stringify(overlayFields ?? []),
        isDefault,
      });
      return ApiResponse.created(res, template, 'Template created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create template', 500);
    }
  },

  async updateCertificateTemplate(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, nameAr, imageUrl, overlayFields, isDefault } = req.body;
      const template = await adminService.updateCertificateTemplate(id, {
        name,
        nameAr,
        imageUrl,
        overlayFields: typeof overlayFields === 'string' ? overlayFields : overlayFields != null ? JSON.stringify(overlayFields) : undefined,
        isDefault,
      });
      return ApiResponse.success(res, template, 'Template updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update template', 500);
    }
  },

  async deleteCertificateTemplate(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteCertificateTemplate(id);
      return ApiResponse.success(res, null, 'Template deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete template', 500);
    }
  },

  // ==================== NOTIFICATIONS ====================
  async getNotificationStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getNotificationStats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get notification stats', 500);
    }
  },

  async getNotificationHistory(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.getNotificationHistory(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get notification history', 500);
    }
  },

  async sendNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { targetEmail, ...rest } = req.body;
      const result = await adminService.sendNotification({ ...rest, targetEmail }, req.user.id);
      return ApiResponse.success(res, result, 'Notification sent');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to send notification', 500);
    }
  },

  // ==================== REPORTS ====================
  async getReport(req: AuthRequest, res: Response) {
    try {
      const raw = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
      const type = typeof raw === 'string' ? raw.trim() : '';
      const dateRange = req.query.dateRange as string | undefined;
      if (!type) return ApiResponse.badRequest(res, 'Report type is required');
      const data = await adminService.getReport(type, dateRange);
      if (!data) return ApiResponse.badRequest(res, `Invalid report type: "${type}". Valid types: financial-detail, students-detail, instructors-detail, courses-detail, orders-detail, enrollments-detail, exams-detail, reviews-detail, certificates-detail`);
      return ApiResponse.success(res, data);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get report', 500);
    }
  },

  async exportReport(req: AuthRequest, res: Response) {
    try {
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
      const format = ((req.query.format as string) || 'excel').toLowerCase();
      const dateRange = req.query.dateRange as string | undefined;
      const result = await adminService.exportReport(type, format as 'pdf' | 'excel' | 'csv', dateRange);
      if (!result) return ApiResponse.badRequest(res, 'Invalid report type');

      if (result.buffer && (format === 'excel' || format === 'xlsx' || format === 'csv')) {
        const ext = format === 'csv' ? 'csv' : 'xlsx';
        const mime = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.${ext}"`);
        return res.send(result.buffer);
      }
      return ApiResponse.success(res, result.data, 'Report exported');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to export report', 500);
    }
  },

  // ==================== ADMIN COURSE CRUD ====================
  async createCourse(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await adminService.createCourse(req.user.id, req.body);
      return ApiResponse.success(res, result, 'Course created');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to create course', 500);
    }
  },

  async updateCourse(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.updateCourse(id, req.body);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, result, 'Course updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to update course', 500);
    }
  },

  async deleteCourse(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteCourse(id);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, null, 'Course deleted');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to delete course', 500);
    }
  },

  // ==================== ADMIN PRODUCTS (STORE) ====================
  async listProducts(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listProducts(req.query as Record<string, string>);
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list products', 500);
    }
  },

  async listStoreOrders(req: AuthRequest, res: Response) {
    try {
      const { data, total, page, limit } = await adminService.listStoreOrders(
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list store orders', 500);
    }
  },

  async getStoreOrderStats(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getStoreOrderStats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get store order stats', 500);
    }
  },

  async updateStoreOrderStatus(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      if (!status) return ApiResponse.badRequest(res, 'Status required');
      const result = await adminService.updateStoreOrderStatus(id, status);
      if (!result) return ApiResponse.notFound(res, 'Order not found');
      return ApiResponse.success(res, result, 'Status updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update order', 500);
    }
  },

  async deleteStoreOrder(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteStoreOrder(id);
      if (!result) return ApiResponse.notFound(res, 'Order not found');
      return ApiResponse.success(res, null, 'Order deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete order', 500);
    }
  },

  async createProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await adminService.createProduct(req.user.id, req.body);
      return ApiResponse.success(res, result, 'Product created');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to create product', 500);
    }
  },

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.updateProduct(id, req.body);
      if (!result) return ApiResponse.notFound(res, 'Product not found');
      return ApiResponse.success(res, result, 'Product updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to update product', 500);
    }
  },

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteProduct(id);
      if (!result) return ApiResponse.notFound(res, 'Product not found');
      return ApiResponse.success(res, null, 'Product deleted');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to delete product', 500);
    }
  },

  // ==================== CATEGORIES ====================
  async listCategories(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listCategories(req.query as Record<string, string>);
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list categories', 500);
    }
  },

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.createCategory(req.body);
      return ApiResponse.success(res, result, 'Category created');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to create category', 500);
    }
  },

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.updateCategory(id, req.body);
      if (!result) return ApiResponse.notFound(res, 'Category not found');
      return ApiResponse.success(res, result, 'Category updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to update category', 500);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteCategory(id);
      if (!result) return ApiResponse.notFound(res, 'Category not found');
      return ApiResponse.success(res, null, 'Category deleted');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to delete category', 500);
    }
  },

  // ==================== ADMIN COURSE CONTENT ====================
  async getCourseChapters(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const chapters = await adminService.getCourseContentWithLessons(id);
      if (!chapters) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, chapters);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get course chapters', 500);
    }
  },

  async syncCourseContent(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { chapters } = req.body;
      const result = await adminService.syncCourseContent(id, chapters ?? []);
      if (!result) return ApiResponse.notFound(res, 'Course not found');
      return ApiResponse.success(res, result, 'Content synced');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to sync course content', 500);
    }
  },

  // Payment requests (طلبات الطلاب)
  async listPaymentRequests(req: AuthRequest, res: Response) {
    try {
      const { status, page, limit } = req.query;
      const result = await adminService.listPaymentRequests({
        status: status as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list payment requests', 500);
    }
  },
  async approvePaymentRequest(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ok = await adminService.approvePaymentRequest(id, req.user!.id);
      if (!ok) return ApiResponse.notFound(res, 'Request not found or already processed');
      return ApiResponse.success(res, null, 'Approved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to approve', 500);
    }
  },
  async rejectPaymentRequest(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { notes } = req.body;
      const ok = await adminService.rejectPaymentRequest(id, req.user!.id, notes);
      if (!ok) return ApiResponse.notFound(res, 'Request not found or already processed');
      return ApiResponse.success(res, null, 'Rejected');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reject', 500);
    }
  },

  // Coupons
  async listCoupons(req: AuthRequest, res: Response) {
    try {
      const { used, page, limit } = req.query;
      const result = await adminService.listCoupons({
        used: used === 'true' ? true : used === 'false' ? false : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list coupons', 500);
    }
  },
  async createCoupon(req: AuthRequest, res: Response) {
    try {
      const body = req.body;
      const coupon = await adminService.createCoupon({
        code: body.code,
        discount: body.discount,
        discountType: body.discountType ?? 'percent',
        maxUses: body.maxUses ?? 1,
        minPurchase: body.minPurchase,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        courseIds: body.courseIds,
      });
      return ApiResponse.success(res, coupon, 'Coupon created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create coupon', 500);
    }
  },
  async bulkCreateCoupons(req: AuthRequest, res: Response) {
    try {
      const { count, discount, discountType, maxUses, minPurchase, expiresAt, courseIds } = req.body;
      const coupons = await adminService.bulkCreateCoupons(count ?? 10, {
        discount,
        discountType: discountType ?? 'percent',
        maxUses: maxUses ?? 1,
        minPurchase,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        courseIds,
      });
      return ApiResponse.success(res, { coupons }, 'Coupons created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to bulk create coupons', 500);
    }
  },
  async updateCoupon(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isActive, expiresAt, maxUses } = req.body;
      const coupon = await adminService.updateCoupon(id, { isActive, expiresAt, maxUses });
      return ApiResponse.success(res, coupon, 'Updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update coupon', 500);
    }
  },
  async deleteCoupon(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await adminService.deleteCoupon(id);
      return ApiResponse.success(res, null, 'Deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete coupon', 500);
    }
  },

  // ==================== PAYOUTS (طلبات السحب) ====================
  async listPayouts(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listPayouts(req.query as Record<string, unknown>);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list payouts', 500);
    }
  },

  async getPayoutDetail(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payout = await adminService.getPayoutDetail(id);
      if (!payout) return ApiResponse.notFound(res, 'Payout not found');
      return ApiResponse.success(res, payout);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get payout', 500);
    }
  },

  async approvePayout(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.approvePayout(id);
      if (!result) return ApiResponse.badRequest(res, 'Payout not found or already processed');
      return ApiResponse.success(res, result, 'Payout approved');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to approve payout', 500);
    }
  },

  async rejectPayout(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { notes } = req.body ?? {};
      const result = await adminService.rejectPayout(id, notes);
      if (!result) return ApiResponse.badRequest(res, 'Payout not found or already processed');
      return ApiResponse.success(res, result, 'Payout rejected');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to reject payout', 500);
    }
  },

  async getCommissionConfig(req: AuthRequest, res: Response) {
    try {
      const config = await adminService.getCommissionConfig();
      return ApiResponse.success(res, config);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get commission config', 500);
    }
  },

  async updateCommissionConfig(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.updateCommissionConfig(req.body);
      return ApiResponse.success(res, result, 'Commission config updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      return ApiResponse.badRequest(res, msg);
    }
  },

  async previewCommission(req: AuthRequest, res: Response) {
    try {
      const { config, exampleRevenue = 10000, exampleStudents = 50 } = req.body;
      const result = await adminService.previewCommission(config, exampleRevenue, exampleStudents);
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to preview commission', 500);
    }
  },

  // ==================== MESSAGES (Admin view all conversations) ====================
  async listAllConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await messagesService.listAllConversationsForAdmin(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list conversations', 500);
    }
  },

  async getConversationMessages(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await messagesService.getMessagesForAdmin(id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get messages', 500);
    }
  },
};
