import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { teacherService } from './teacher.service';

export const teacherController = {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const stats = await teacherService.getDashboardStats(req.user.id);
      return ApiResponse.success(res, stats);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get dashboard stats', 500);
    }
  },

  async getTodaySchedule(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const schedule = await teacherService.getTodaySchedule(req.user.id);
      return ApiResponse.success(res, schedule);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get schedule', 500);
    }
  },

  async getRecentSubmissions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const limit = parseInt((req.query.limit as string) || '10');
      const submissions = await teacherService.getRecentSubmissions(req.user.id, limit);
      return ApiResponse.success(res, submissions);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get recent submissions', 500);
    }
  },

  async listClasses(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await teacherService.listClasses(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list classes', 500);
    }
  },

  async createClass(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const cls = await teacherService.createClass(req.user.id, req.body);
      if ('error' in cls) {
        return ApiResponse.badRequest(res, 'Invalid course');
      }
      return ApiResponse.created(res, cls, 'Class created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create class', 500);
    }
  },

  async getClassById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cls = await teacherService.getClassById(id, req.user.id);
      if (!cls) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.success(res, cls);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get class', 500);
    }
  },

  async updateClass(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cls = await teacherService.updateClass(id, req.user.id, req.body);
      if (!cls) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.success(res, cls, 'Class updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update class', 500);
    }
  },

  async deleteClass(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teacherService.deleteClass(id, req.user.id);
      if (!result) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.success(res, null, 'Class deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete class', 500);
    }
  },

  async addStudentToClass(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { studentId } = req.body;
      if (!studentId) return ApiResponse.badRequest(res, 'studentId required');
      const classStudent = await teacherService.addStudentToClass(
        id,
        studentId,
        req.user.id
      );
      if (!classStudent) return ApiResponse.notFound(res, 'Class not found');
      if ('error' in classStudent) {
        if (classStudent.error === 'not_assigned') {
          return ApiResponse.forbidden(res, 'This student is not assigned to you');
        }
        return ApiResponse.notFound(res, 'Student not found');
      }
      return ApiResponse.created(res, classStudent, 'Student added to class');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to add student', 500);
    }
  },

  async removeStudentFromClass(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const studentId = Array.isArray(req.params.studentId)
        ? req.params.studentId[0]
        : req.params.studentId;
      const result = await teacherService.removeStudentFromClass(
        id,
        studentId,
        req.user.id
      );
      if (!result) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.success(res, null, 'Student removed from class');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to remove student', 500);
    }
  },

  async listAssignedStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const students = await teacherService.listAssignedStudents(req.user.id);
      return ApiResponse.success(res, students);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list assigned students', 500);
    }
  },

  async listStudents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await teacherService.listStudents(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list students', 500);
    }
  },

  async listAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await teacherService.listAssignments(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list assignments', 500);
    }
  },

  async createAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const assignment = await teacherService.createAssignment(req.user.id, req.body);
      if (!assignment) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.created(res, assignment, 'Assignment created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create assignment', 500);
    }
  },

  async getAssignmentById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const assignment = await teacherService.getAssignmentById(id, req.user.id);
      if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, assignment);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get assignment', 500);
    }
  },

  async gradeAssignmentSubmission(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const result = await teacherService.gradeAssignmentSubmission(id, studentId, req.user.id, req.body);
      if (!result) return ApiResponse.notFound(res, 'Assignment not found');
      if ('error' in result) return ApiResponse.badRequest(res, 'Student has not submitted this assignment yet');
      return ApiResponse.success(res, result, 'Submission graded');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to grade submission', 500);
    }
  },

  async updateAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const assignment = await teacherService.updateAssignment(id, req.user.id, req.body);
      if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, assignment, 'Assignment updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update assignment', 500);
    }
  },

  async deleteAssignment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teacherService.deleteAssignment(id, req.user.id);
      if (!result) return ApiResponse.notFound(res, 'Assignment not found');
      return ApiResponse.success(res, null, 'Assignment deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete assignment', 500);
    }
  },

  async listExams(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { data, total, page, limit } = await teacherService.listExams(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list exams', 500);
    }
  },

  async createExam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const exam = await teacherService.createExam(req.user.id, req.body);
      if (!exam) return ApiResponse.notFound(res, 'Class not found');
      return ApiResponse.created(res, exam, 'Exam created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create exam', 500);
    }
  },

  async getExamById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const exam = await teacherService.getExamById(id, req.user.id);
      if (!exam) return ApiResponse.notFound(res, 'Exam not found');
      return ApiResponse.success(res, exam);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get exam', 500);
    }
  },

  async getWeeklySchedule(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const schedule = await teacherService.getWeeklySchedule(req.user.id);
      return ApiResponse.success(res, schedule);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get schedule', 500);
    }
  },

  async createScheduleSlot(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const slot = await teacherService.createScheduleSlot(req.user.id, req.body);
      return ApiResponse.created(res, slot, 'Schedule slot created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create schedule slot', 500);
    }
  },

  async getAttendanceForStudent(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const classStudentId =
        Array.isArray(req.params.classStudentId) ? req.params.classStudentId[0] : req.params.classStudentId;
      const attendance = await teacherService.getAttendanceForStudent(
        classStudentId,
        req.user.id
      );
      if (!attendance) return ApiResponse.notFound(res, 'Student not found in class');
      return ApiResponse.success(res, attendance);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get attendance', 500);
    }
  },

  async recordAttendance(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const record = await teacherService.recordAttendance(req.user.id, req.body);
      if (!record) return ApiResponse.notFound(res, 'Class student not found');
      return ApiResponse.created(res, record, 'Attendance recorded');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to record attendance', 500);
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await teacherService.getProfile(req.user.id);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get profile', 500);
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const profile = await teacherService.updateProfile(req.user.id, req.body);
      if (!profile) return ApiResponse.notFound(res, 'Profile not found');
      return ApiResponse.success(res, profile, 'Profile updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update profile', 500);
    }
  },

  async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const settings = await teacherService.updateNotificationSettings(
        req.user.id,
        req.body
      );
      return ApiResponse.success(res, settings, 'Notification settings updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update notification settings', 500);
    }
  },
};
