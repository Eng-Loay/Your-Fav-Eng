import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { reportsController } from './reports.controller';

const router = Router();

const teacherAuth = [authenticate, authorize('TEACHER')];

router.get('/teacher/students', ...teacherAuth, reportsController.getTeacherStudents);
router.get('/teacher/financial', ...teacherAuth, reportsController.getTeacherFinancial);

export default router;
