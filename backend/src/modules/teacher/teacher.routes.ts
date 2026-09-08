import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { teacherController } from './teacher.controller';

const router = Router();

const teacherAuth = [authenticate, authorize('TEACHER')];

const createClassSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  subject: z.string().optional(),
  courseId: z.string().uuid().optional(),
  maxStudents: z.number().int().min(0).optional(),
  schedule: z.record(z.unknown()).optional(),
  status: z.string().optional(),
});

const updateClassSchema = createClassSchema.partial();

const addStudentSchema = z.object({
  studentId: z.string().uuid(),
});

const createAssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  classId: z.string().uuid(),
  dueDate: z.string().optional(),
  totalPoints: z.number().min(0).optional(),
  status: z.string().optional(),
});

const gradeSubmissionSchema = z.object({
  grade: z.number().min(0).optional(),
  feedback: z.string().optional(),
});

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  totalPoints: z.number().min(0).optional(),
  status: z.string().optional(),
});

const createExamSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  classId: z.string().uuid().optional(),
  instructions: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createScheduleSchema = z.object({
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subject: z.string().optional(),
  room: z.string().optional(),
  classId: z.string().uuid().optional(),
});

const recordAttendanceSchema = z.object({
  classStudentId: z.string().uuid(),
  date: z.string(),
  status: z.string().default('present'),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialty: z.string().optional(),
  subject: z.string().optional(),
  experience: z.string().optional(),
  maxStudents: z.number().int().min(0).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
});

const updateNotificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

// Dashboard
router.get('/dashboard/stats', ...teacherAuth, teacherController.getDashboardStats);
router.get('/dashboard/schedule', ...teacherAuth, teacherController.getTodaySchedule);
router.get(
  '/dashboard/recent-submissions',
  ...teacherAuth,
  teacherController.getRecentSubmissions
);

// Classes
router.get('/classes', ...teacherAuth, teacherController.listClasses);
router.post(
  '/classes',
  ...teacherAuth,
  validate(createClassSchema),
  teacherController.createClass
);
router.get('/classes/:id', ...teacherAuth, teacherController.getClassById);
router.put(
  '/classes/:id',
  ...teacherAuth,
  validate(updateClassSchema),
  teacherController.updateClass
);
router.delete('/classes/:id', ...teacherAuth, teacherController.deleteClass);
router.post(
  '/classes/:id/students',
  ...teacherAuth,
  validate(addStudentSchema),
  teacherController.addStudentToClass
);
router.delete(
  '/classes/:id/students/:studentId',
  ...teacherAuth,
  teacherController.removeStudentFromClass
);

// Students
router.get('/students/assigned', ...teacherAuth, teacherController.listAssignedStudents);
router.get('/students', ...teacherAuth, teacherController.listStudents);

// Assignments
router.get('/assignments', ...teacherAuth, teacherController.listAssignments);
router.post(
  '/assignments',
  ...teacherAuth,
  validate(createAssignmentSchema),
  teacherController.createAssignment
);
router.get('/assignments/:id', ...teacherAuth, teacherController.getAssignmentById);
router.put(
  '/assignments/:id',
  ...teacherAuth,
  validate(updateAssignmentSchema),
  teacherController.updateAssignment
);
router.delete('/assignments/:id', ...teacherAuth, teacherController.deleteAssignment);
router.post(
  '/assignments/:id/submissions/:studentId/grade',
  ...teacherAuth,
  validate(gradeSubmissionSchema),
  teacherController.gradeAssignmentSubmission
);

// Exams
router.get('/exams', ...teacherAuth, teacherController.listExams);
router.post(
  '/exams',
  ...teacherAuth,
  validate(createExamSchema),
  teacherController.createExam
);
router.get('/exams/:id', ...teacherAuth, teacherController.getExamById);

// Schedule
router.get('/schedule', ...teacherAuth, teacherController.getWeeklySchedule);
router.post(
  '/schedule',
  ...teacherAuth,
  validate(createScheduleSchema),
  teacherController.createScheduleSlot
);

// Attendance
router.get(
  '/attendance/:classStudentId',
  ...teacherAuth,
  teacherController.getAttendanceForStudent
);
router.post(
  '/attendance',
  ...teacherAuth,
  validate(recordAttendanceSchema),
  teacherController.recordAttendance
);

// Profile
router.get('/profile', ...teacherAuth, teacherController.getProfile);
router.put(
  '/profile',
  ...teacherAuth,
  validate(updateProfileSchema),
  teacherController.updateProfile
);
router.put(
  '/notification-settings',
  ...teacherAuth,
  validate(updateNotificationSettingsSchema),
  teacherController.updateNotificationSettings
);

export default router;
