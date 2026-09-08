import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import { getTotalPointsForStudents } from './points.service';

export interface CreateClassInput {
  name: string;
  nameAr?: string;
  subject?: string;
  courseId?: string;
  maxStudents?: number;
  schedule?: Record<string, unknown>;
  status?: string;
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  classId: string;
  dueDate?: string;
  totalPoints?: number;
  status?: string;
}

export interface UpdateAssignmentInput extends Partial<Omit<CreateAssignmentInput, 'classId'>> {}

export interface CreateExamInput {
  title: string;
  titleAr?: string;
  classId?: string;
  instructions?: string;
  duration?: number;
  maxAttempts?: number;
  passingScore?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateExamInput extends Partial<CreateExamInput> {}

export interface CreateScheduleInput {
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
  room?: string;
  classId?: string;
}

export interface RecordAttendanceInput {
  classStudentId: string;
  date: string;
  status: string;
}

export interface UpdateTeacherProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialty?: string;
  subject?: string;
  experience?: string;
  maxStudents?: number;
  website?: string;
  twitter?: string;
}

export interface UpdateNotificationSettingsInput {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  settings?: Record<string, unknown>;
}

async function getStudentUserMap(studentIds: string[]) {
  if (studentIds.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true, avatar: true },
  });
  return new Map(users.map((u) => [u.id, u]));
}

async function recordTeacherStudentSnapshot(teacherId: string, studentCount: number) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: teacherId },
  });
  if (!profile) return;

  await prisma.teacherStudentSnapshot.create({
    data: {
      teacherProfileId: profile.id,
      studentCount,
    },
  });

  if (studentCount > profile.peakStudents) {
    await prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { peakStudents: studentCount },
    });
  }
}

export const teacherService = {
  async getDashboardStats(teacherId: string) {
    const [classesCount, studentsCount, assignmentsDue, submissions] = await Promise.all([
      prisma.class.count({ where: { teacherId } }),
      prisma.classStudent.count({
        where: { class: { teacherId } },
      }),
      prisma.assignment.count({
        where: {
          creatorId: teacherId,
          dueDate: { gte: new Date(), not: null },
          status: 'active',
        },
      }),
      prisma.assignmentSubmission.findMany({
        where: { assignment: { creatorId: teacherId } },
        select: { grade: true },
        take: 1000,
      }),
    ]);

    const grades = submissions.filter((s) => s.grade != null).map((s) => s.grade!);
    const averageScore =
      grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    return {
      classesCount,
      studentsCount,
      assignmentsDue,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  },

  async getTodaySchedule(teacherId: string) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];

    return prisma.schedule.findMany({
      where: { teacherId, day: today },
      orderBy: { startTime: 'asc' },
    });
  },

  async getRecentSubmissions(teacherId: string, limit = 10) {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignment: { creatorId: teacherId } },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      include: {
        assignment: {
          select: { id: true, title: true, classId: true },
        },
      },
    });

    const studentIds = [...new Set(submissions.map((s) => s.studentId))];
    const userMap = await getStudentUserMap(studentIds);

    return submissions.map((s) => ({
      ...s,
      student: userMap.get(s.studentId) ?? null,
    }));
  },

  async listClasses(teacherId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: { teacherId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, titleAr: true } },
          _count: {
            select: { students: true, assignments: true },
          },
        },
      }),
      prisma.class.count({ where: { teacherId } }),
    ]);

    return { data: classes, total, page, limit };
  },

  async createClass(teacherId: string, input: CreateClassInput) {
    let courseId: string | undefined;
    if (input.courseId) {
      const course = await prisma.course.findFirst({ where: { id: input.courseId, instructorId: teacherId } });
      if (!course) return { error: 'invalid_course' as const };
      courseId = course.id;
    }

    return prisma.class.create({
      data: {
        name: input.name,
        nameAr: input.nameAr,
        subject: input.subject,
        teacherId,
        courseId,
        maxStudents: input.maxStudents ?? 30,
        status: input.status ?? 'active',
        schedule: input.schedule !== undefined ? JSON.stringify(input.schedule) : undefined,
      },
    });
  },

  async getClassById(id: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId },
      include: {
        course: { select: { id: true, title: true, titleAr: true } },
        students: true,
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { students: true, assignments: true } },
      },
    });
    if (!cls) return null;

    const studentIds = cls.students.map((s) => s.studentId);
    const [userMap, pointsMap, schedule] = await Promise.all([
      getStudentUserMap(studentIds),
      getTotalPointsForStudents(studentIds),
      prisma.schedule.findMany({ where: { teacherId, classId: id } }),
    ]);

    const studentsWithUser = cls.students
      .map((s) => ({
        ...s,
        student: userMap.get(s.studentId) ?? null,
        totalPoints: pointsMap.get(s.studentId) ?? 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      ...cls,
      students: studentsWithUser,
      schedule,
    };
  },

  async updateClass(id: string, teacherId: string, input: UpdateClassInput) {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId },
    });
    if (!cls) return null;

    const { schedule, ...rest } = input;
    return prisma.class.update({
      where: { id },
      data: {
        ...rest,
        ...(schedule !== undefined && { schedule: JSON.stringify(schedule) }),
      },
    });
  },

  async deleteClass(id: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId },
    });
    if (!cls) return null;

    await prisma.class.delete({ where: { id } });
    return true;
  },

  async addStudentToClass(classId: string, studentId: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });
    if (!cls) return null;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true, status: true, assignedTeacherId: true },
    });
    if (!student || student.role !== 'STUDENT') return { error: 'not_found' as const };
    if (student.assignedTeacherId !== teacherId) return { error: 'not_assigned' as const };

    const existing = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    if (existing) return existing;

    const classStudent = await prisma.classStudent.create({
      data: { classId, studentId },
    });

    if (cls.courseId) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: studentId, courseId: cls.courseId } },
        create: { userId: studentId, courseId: cls.courseId, status: 'ACTIVE', source: 'group', assignedBy: teacherId },
        update: { status: 'ACTIVE' },
      });
    }

    const studentCount = await prisma.classStudent.count({
      where: { class: { teacherId } },
    });
    await recordTeacherStudentSnapshot(teacherId, studentCount);

    return classStudent;
  },

  async removeStudentFromClass(classId: string, studentId: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });
    if (!cls) return null;

    await prisma.classStudent.deleteMany({
      where: { classId, studentId },
    });

    const studentCount = await prisma.classStudent.count({
      where: { class: { teacherId } },
    });
    await recordTeacherStudentSnapshot(teacherId, studentCount);

    return true;
  },

  async listAssignedStudents(teacherId: string) {
    return prisma.user.findMany({
      where: { assignedTeacherId: teacherId, role: 'STUDENT' },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: 'asc' },
    });
  },

  async listStudents(teacherId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const classStudents = await prisma.classStudent.findMany({
      where: { class: { teacherId } },
      include: { class: { select: { id: true, name: true } } },
    });

    const uniqueStudentIds = [...new Set(classStudents.map((cs) => cs.studentId))];
    const userMap = await getStudentUserMap(uniqueStudentIds);

    const studentMap = new Map<
      string,
      { user: (typeof userMap extends Map<string, infer V> ? V : never); classes: { id: string; name: string | null }[] }
    >();

    for (const cs of classStudents) {
      const user = userMap.get(cs.studentId);
      if (!user) continue;
      if (!studentMap.has(cs.studentId)) {
        studentMap.set(cs.studentId, { user, classes: [] });
      }
      const entry = studentMap.get(cs.studentId)!;
      if (cs.class && !entry.classes.some((c) => c.id === cs.class.id)) {
        entry.classes.push({ id: cs.class.id, name: cs.class.name });
      }
    }

    const students = Array.from(studentMap.values());
    const total = students.length;
    const paginated = students.slice(skip, skip + limit);

    return { data: paginated, total, page, limit };
  },

  async listAssignments(teacherId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: { creatorId: teacherId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          class: { select: { id: true, name: true, nameAr: true, maxStudents: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.assignment.count({ where: { creatorId: teacherId } }),
    ]);

    return { data: assignments, total, page, limit };
  },

  async createAssignment(teacherId: string, input: CreateAssignmentInput) {
    const cls = await prisma.class.findFirst({
      where: { id: input.classId, teacherId },
    });
    if (!cls) return null;

    return prisma.assignment.create({
      data: {
        title: input.title,
        description: input.description,
        classId: input.classId,
        creatorId: teacherId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        totalPoints: input.totalPoints ?? 100,
        status: input.status ?? 'active',
      },
    });
  },

  async getAssignmentById(id: string, teacherId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, creatorId: teacherId },
      include: {
        class: { select: { id: true, name: true } },
        submissions: {
          include: {},
        },
      },
    });
    if (!assignment) return null;

    const studentIds = assignment.submissions.map((s) => s.studentId);
    const userMap = await getStudentUserMap(studentIds);

    const submissionsWithStudent = assignment.submissions.map((s) => ({
      ...s,
      student: userMap.get(s.studentId) ?? null,
    }));

    return {
      ...assignment,
      submissions: submissionsWithStudent,
    };
  },

  async gradeAssignmentSubmission(
    assignmentId: string,
    studentId: string,
    teacherId: string,
    input: { grade?: number; feedback?: string }
  ) {
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, creatorId: teacherId },
    });
    if (!assignment) return null;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (!submission) return { error: 'not_submitted' as const };

    return prisma.assignmentSubmission.update({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      data: {
        grade: input.grade ?? undefined,
        feedback: input.feedback ?? undefined,
        gradedAt: new Date(),
      },
    });
  },

  async updateAssignment(id: string, teacherId: string, input: UpdateAssignmentInput) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, creatorId: teacherId },
    });
    if (!assignment) return null;

    return prisma.assignment.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
      },
    });
  },

  async deleteAssignment(id: string, teacherId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, creatorId: teacherId },
    });
    if (!assignment) return null;

    await prisma.assignment.delete({ where: { id } });
    return true;
  },

  async listExams(teacherId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where: { creatorId: teacherId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          class: { select: { id: true, name: true } },
          _count: { select: { results: true } },
        },
      }),
      prisma.exam.count({ where: { creatorId: teacherId } }),
    ]);

    return { data: exams, total, page, limit };
  },

  async createExam(teacherId: string, input: CreateExamInput) {
    if (input.classId) {
      const cls = await prisma.class.findFirst({
        where: { id: input.classId, teacherId },
      });
      if (!cls) return null;
    }

    return prisma.exam.create({
      data: {
        title: input.title,
        titleAr: input.titleAr,
        classId: input.classId ?? null,
        creatorId: teacherId,
        instructions: input.instructions,
        duration: input.duration ?? 60,
        maxAttempts: input.maxAttempts ?? 1,
        passingScore: input.passingScore ?? 60,
        status: input.status ?? 'draft',
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });
  },

  async getExamById(id: string, teacherId: string) {
    const exam = await prisma.exam.findFirst({
      where: { id, creatorId: teacherId },
      include: {
        class: { select: { id: true, name: true } },
        results: true,
        questions: true,
      },
    });
    return exam;
  },

  async getWeeklySchedule(teacherId: string) {
    return prisma.schedule.findMany({
      where: { teacherId },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
  },

  async createScheduleSlot(teacherId: string, input: CreateScheduleInput) {
    return prisma.schedule.create({
      data: {
        teacherId,
        day: input.day,
        startTime: input.startTime,
        endTime: input.endTime,
        subject: input.subject,
        room: input.room,
        classId: input.classId ?? null,
      },
    });
  },

  async getAttendanceForStudent(classStudentId: string, teacherId: string) {
    const classStudent = await prisma.classStudent.findFirst({
      where: {
        id: classStudentId,
        class: { teacherId },
      },
      include: {
        attendance: { orderBy: { date: 'desc' } },
      },
    });
    return classStudent;
  },

  async recordAttendance(teacherId: string, input: RecordAttendanceInput) {
    const classStudent = await prisma.classStudent.findFirst({
      where: {
        id: input.classStudentId,
        class: { teacherId },
      },
    });
    if (!classStudent) return null;

    const date = new Date(input.date);
    date.setHours(0, 0, 0, 0);

    return prisma.attendanceRecord.upsert({
      where: {
        classStudentId_date: {
          classStudentId: input.classStudentId,
          date,
        },
      },
      create: {
        classStudentId: input.classStudentId,
        date,
        status: input.status ?? 'present',
      },
      update: { status: input.status ?? 'present' },
    });
  },

  async getProfile(teacherId: string) {
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    return user;
  },

  async updateProfile(teacherId: string, input: UpdateTeacherProfileInput) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId },
    });
    if (!profile) return null;

    const { name, email, phone, bio, ...profileData } = input;
    const userUpdates: Record<string, string> = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (bio !== undefined) userUpdates.bio = bio;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({ where: { id: teacherId }, data: userUpdates });
    }

    return prisma.teacherProfile.update({
      where: { userId: teacherId },
      data: profileData,
    });
  },

  async updateNotificationSettings(teacherId: string, input: UpdateNotificationSettingsInput) {
    const existing = await prisma.notificationSetting.findUnique({
      where: { userId: teacherId },
    });

    const data = {
      email: input.email ?? existing?.email ?? true,
      push: input.push ?? existing?.push ?? true,
      inApp: input.inApp ?? existing?.inApp ?? true,
      settings: input.settings !== undefined ? JSON.stringify(input.settings) : existing?.settings,
    };

    if (existing) {
      return prisma.notificationSetting.update({
        where: { userId: teacherId },
        data,
      });
    }

    return prisma.notificationSetting.create({
      data: { userId: teacherId, ...data },
    });
  },
};
