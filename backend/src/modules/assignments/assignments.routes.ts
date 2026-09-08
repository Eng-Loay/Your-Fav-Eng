import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { assignmentsController } from './assignments.controller';

const router = Router();
const studentAuth = [authenticate, authorize('STUDENT')];

const submitSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  answers: z.record(z.union([z.string(), z.array(z.string())])).optional(),
});

router.get('/student', ...studentAuth, assignmentsController.listStudentAssignments);
router.post('/course/:id/submit', ...studentAuth, validate(submitSchema), assignmentsController.submitCourseAssignment);
router.post('/teacher/:id/submit', ...studentAuth, validate(submitSchema), assignmentsController.submitTeacherAssignment);

export default router;
