import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';

interface AutoGradeQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multi_select';
  question: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

/** Compares a student's answers against an AUTO-graded assignment's question set. Equal weight per question, like lesson quizzes. */
function scoreAutoGradedAssignment(questions: AutoGradeQuestion[], answers: Record<string, string | string[]>, totalPoints: number) {
  if (questions.length === 0) return { grade: 0, correctCount: 0, total: 0 };
  let correctCount = 0;
  for (const q of questions) {
    const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
    const given = answers[q.id];
    if (q.type === 'multi_select') {
      const givenIds = (Array.isArray(given) ? given : given ? [given] : []).slice().sort();
      if (givenIds.length === correctIds.length && givenIds.every((id, i) => id === correctIds[i])) {
        correctCount += 1;
      }
    } else {
      const givenId = Array.isArray(given) ? given[0] : given;
      if (givenId && correctIds.length === 1 && givenId === correctIds[0]) {
        correctCount += 1;
      }
    }
  }
  const grade = Math.round((correctCount / questions.length) * totalPoints * 100) / 100;
  return { grade, correctCount, total: questions.length };
}

export const assignmentsService = {
  /** List assignments for a student: from enrolled courses (CourseAssignment) + from classes (Assignment) */
  async listStudentAssignments(studentId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [enrollments, classStudents] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: studentId, status: 'ACTIVE' },
        select: { courseId: true },
      }),
      prisma.classStudent.findMany({
        where: { studentId, status: 'active' },
        include: { class: { select: { id: true } } },
      }),
    ]);

    const courseIds = enrollments.map((e) => e.courseId);
    const classIds = classStudents.map((cs) => cs.classId);

    const [courseAssignments, teacherAssignments] = await Promise.all([
      courseIds.length > 0
        ? prisma.courseAssignment.findMany({
            where: { courseId: { in: courseIds }, status: 'active' },
            include: {
              course: { select: { id: true, title: true, titleAr: true } },
              instructor: { select: { id: true, name: true } },
              submissions: { where: { studentId }, take: 1 },
            },
          })
        : [],
      classIds.length > 0
        ? prisma.assignment.findMany({
            where: { classId: { in: classIds }, status: 'active' },
            include: {
              class: { select: { id: true, name: true, nameAr: true } },
              creator: { select: { id: true, name: true } },
              submissions: { where: { studentId }, take: 1 },
            },
          })
        : [],
    ]);

    const courseItems = courseAssignments.map((a) => {
      let questions: Array<{ id: string; type: string; question: string; options: Array<{ id: string; text: string }> }> = [];
      if (a.gradingType === 'AUTO' && a.content) {
        try {
          const parsed = JSON.parse(a.content) as { questions?: Array<{ id: string; type: string; question: string; options: Array<{ id: string; text: string; isCorrect: boolean }> }> };
          questions = (parsed.questions ?? []).map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options.map((o) => ({ id: o.id, text: o.text })),
          }));
        } catch {
          questions = [];
        }
      }
      return {
        id: a.id,
        type: 'course' as const,
        title: a.title,
        titleAr: a.titleAr,
        description: a.description,
        context: a.course?.title,
        contextAr: a.course?.titleAr,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        gradingType: a.gradingType,
        questions,
        mySubmission: a.submissions[0] ?? null,
        instructor: a.instructor?.name,
      };
    });

    const teacherItems = teacherAssignments.map((a) => ({
      id: a.id,
      type: 'teacher' as const,
      title: a.title,
      titleAr: null,
      context: a.class?.name,
      contextAr: a.class?.nameAr,
      dueDate: a.dueDate,
      totalPoints: a.totalPoints,
      mySubmission: a.submissions[0] ?? null,
      teacher: a.creator?.name,
    }));

    const combined = [...courseItems, ...teacherItems].sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    });

    const total = combined.length;
    const data = combined.slice(skip, skip + limit);
    return { data, total, page, limit };
  },

  /** Submit to a course assignment (student must be enrolled). For AUTO-graded assignments, `input.answers` is scored immediately. */
  async submitCourseAssignment(studentId: string, assignmentId: string, input: { content?: string; fileUrl?: string; answers?: Record<string, string | string[]> }) {
    const assignment = await prisma.courseAssignment.findFirst({
      where: { id: assignmentId },
      include: { course: true },
    });
    if (!assignment) return null;

    const enrolled = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId: assignment.courseId, status: 'ACTIVE' },
    });
    if (!enrolled) return null;

    if (assignment.gradingType === 'AUTO') {
      let questions: AutoGradeQuestion[] = [];
      try {
        questions = assignment.content ? (JSON.parse(assignment.content).questions ?? []) : [];
      } catch {
        questions = [];
      }
      const answers = input.answers ?? {};
      const { grade } = scoreAutoGradedAssignment(questions, answers, assignment.totalPoints);

      return prisma.courseAssignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        create: { assignmentId, studentId, content: JSON.stringify(answers), grade, autoGraded: true, gradedAt: new Date() },
        update: { content: JSON.stringify(answers), grade, autoGraded: true, gradedAt: new Date() },
      });
    }

    return prisma.courseAssignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: { assignmentId, studentId, content: input.content ?? null, fileUrl: input.fileUrl ?? null },
      update: { content: input.content ?? undefined, fileUrl: input.fileUrl ?? undefined },
    });
  },

  /** Submit to a teacher assignment (student must be in class) */
  async submitTeacherAssignment(studentId: string, assignmentId: string, input: { content?: string; fileUrl?: string }) {
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId },
      include: { class: true },
    });
    if (!assignment) return null;

    const inClass = await prisma.classStudent.findFirst({
      where: { studentId, classId: assignment.classId, status: 'active' },
    });
    if (!inClass) return null;

    return prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: { assignmentId, studentId, content: input.content ?? null, fileUrl: input.fileUrl ?? null },
      update: { content: input.content ?? undefined, fileUrl: input.fileUrl ?? undefined },
    });
  },
};
