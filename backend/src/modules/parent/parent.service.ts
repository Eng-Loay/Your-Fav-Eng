import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';

export const parentService = {
  async listChildren(parentId: string) {
    const links = await prisma.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            studentProfile: true,
          },
        },
      },
    });
    return links.map((l) => l.child);
  },

  async listChildrenWithStats(parentId: string) {
    const links = await prisma.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            studentProfile: true,
          },
        },
      },
    });
    const children = links.map((l) => l.child);
    const childIds = children.map((c) => c.id);

    const [gradeAggByChild, attendanceByChild, enrollmentsByChild, lastActivityByChild] = await Promise.all([
      prisma.assignmentSubmission.groupBy({
        by: ['studentId'],
        where: { studentId: { in: childIds }, grade: { not: null } },
        _avg: { grade: true },
      }),
      (async () => {
        const classStudents = await prisma.classStudent.findMany({
          where: { studentId: { in: childIds } },
          select: { id: true, studentId: true },
        });
        const csIds = classStudents.map((cs) => cs.id);
        const byStudent: Record<string, { present: number; total: number }> = {};
        for (const cs of classStudents) {
          byStudent[cs.studentId] = { present: 0, total: 0 };
        }
        const records = await prisma.attendanceRecord.groupBy({
          by: ['classStudentId', 'status'],
          where: { classStudentId: { in: csIds } },
          _count: true,
        });
        const csToStudent = Object.fromEntries(classStudents.map((cs) => [cs.id, cs.studentId]));
        for (const r of records) {
          const sid = csToStudent[r.classStudentId];
          if (sid && byStudent[sid]) {
            byStudent[sid].total += r._count;
            if (r.status === 'present') byStudent[sid].present += r._count;
          }
        }
        return byStudent;
      })(),
      prisma.enrollment.groupBy({
        by: ['userId'],
        where: { userId: { in: childIds }, status: 'ACTIVE' },
        _count: true,
      }),
      (async () => {
        const lessonProgress = await prisma.lessonProgress.findMany({
          where: { userId: { in: childIds }, completed: true },
          orderBy: { completedAt: 'desc' },
          take: childIds.length * 3,
          include: {
            lesson: { select: { title: true } },
            user: { select: { id: true } },
          },
        });
        const byChild: Record<string, string> = {};
        for (const p of lessonProgress) {
          if (!byChild[p.userId]) {
            byChild[p.userId] = p.lesson?.title || 'Lesson completed';
          }
        }
        const examResults = await prisma.examResult.findMany({
          where: { studentId: { in: childIds } },
          orderBy: { createdAt: 'desc' },
          take: childIds.length * 2,
          include: { exam: { select: { title: true } } },
        });
        for (const e of examResults) {
          if (!byChild[e.studentId]) {
            byChild[e.studentId] = `Scored ${e.score}% on ${e.exam?.title || 'Exam'}`;
          }
        }
        return byChild;
      })(),
    ]);

    const gradeMap = Object.fromEntries(gradeAggByChild.map((g) => [g.studentId, Math.round(g._avg.grade ?? 0)]));
    const enrollMap = Object.fromEntries(enrollmentsByChild.map((e) => [e.userId, e._count]));

    return children.map((c) => {
      const att = attendanceByChild[c.id];
      const rate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
      const avgGrade = gradeMap[c.id] ?? 0;
      const status = avgGrade >= 90 ? 'Excellent' : avgGrade >= 80 ? 'Good' : '—';
      return {
        ...c,
        avgGrade,
        attendance: rate,
        courses: enrollMap[c.id] ?? 0,
        statusEn: status,
        statusAr: status === 'Excellent' ? 'ممتاز' : status === 'Good' ? 'جيد' : '—',
        recentEn: lastActivityByChild[c.id] || 'No recent activity',
        recentAr: lastActivityByChild[c.id] || 'لا يوجد نشاط حديث',
      };
    });
  },

  async getChildrenInstructors(parentId: string) {
    const links = await prisma.parentChild.findMany({
      where: { parentId },
      include: { child: { select: { id: true, name: true } } },
    });
    const childIds = links.map((l) => l.childId);
    const childMap = Object.fromEntries(links.map((l) => [l.childId, l.child]));

    const [courseInstructors, classTeachers] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: { in: childIds }, status: 'ACTIVE' },
        include: {
          course: {
            select: {
              instructorId: true,
              instructor: { select: { id: true, name: true, avatar: true, email: true } },
            },
          },
        },
      }),
      prisma.classStudent.findMany({
        where: { studentId: { in: childIds } },
        include: {
          class: {
            select: {
              teacherId: true,
              teacher: { select: { id: true, name: true, avatar: true, email: true } },
            },
          },
        },
      }),
    ]);

    const seen = new Set<string>();
    const result: { id: string; name: string; avatar: string | null; email: string | null; children: { id: string; name: string }[] }[] = [];

    for (const e of courseInstructors) {
      const inst = e.course?.instructor;
      if (inst && !seen.has(inst.id)) {
        seen.add(inst.id);
        const children = courseInstructors
          .filter((x) => x.course?.instructorId === inst.id && childIds.includes(x.userId))
          .map((x) => childMap[x.userId])
          .filter(Boolean);
        const uniqueChildren = Array.from(new Map(children.map((c) => [c!.id, c])).values());
        result.push({
          id: inst.id,
          name: inst.name,
          avatar: inst.avatar,
          email: inst.email,
          children: uniqueChildren.map((c) => ({ id: c!.id, name: c!.name })),
        });
      }
    }
    for (const cs of classTeachers) {
      const teacher = cs.class?.teacher;
      if (teacher && !seen.has(teacher.id)) {
        seen.add(teacher.id);
        const children = classTeachers
          .filter((x) => x.class?.teacherId === teacher.id)
          .map((x) => childMap[x.studentId])
          .filter(Boolean);
        const uniqueChildren = Array.from(new Map(children.map((c) => [c!.id, c])).values());
        result.push({
          id: teacher.id,
          name: teacher.name,
          avatar: teacher.avatar,
          email: teacher.email,
          children: uniqueChildren.map((c) => ({ id: c!.id, name: c!.name })),
        });
      }
    }
    return result;
  },

  async createConversationWithInstructor(parentId: string, instructorId: string, childId?: string) {
    const instructorIds = (await this.getChildrenInstructors(parentId)).map((i) => i.id);
    if (!instructorIds.includes(instructorId)) return null;

    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: parentId } } },
          { members: { some: { userId: instructorId } } },
        ],
      },
      include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
    if (existing) return existing;

    const title = childId ? `Parent-Instructor (Child: ${childId})` : null;
    return prisma.conversation.create({
      data: {
        title,
        isGroup: false,
        members: {
          create: [{ userId: parentId }, { userId: instructorId }],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  },

  async linkChild(parentId: string, email?: string, code?: string) {
    if (!email && !code) return null;

    let child: { id: string } | null = null;

    if (email) {
      child = await prisma.user.findUnique({
        where: { email, role: 'STUDENT' },
        select: { id: true },
      });
    }

    if (!child && code) {
      const student = await prisma.user.findFirst({
        where: { id: code, role: 'STUDENT' },
        select: { id: true },
      });
      if (student) child = student;
    }

    if (!child) return null;

    const existing = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId: child.id } },
    });
    if (existing) return existing;

    return prisma.parentChild.create({
      data: { parentId, childId: child.id },
      include: {
        child: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async getChildProgress(parentId: string, childId: string) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: childId, status: 'ACTIVE' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true },
        },
      },
    });

    const progressList = await Promise.all(
      enrollments.map(async (e) => {
        const totalLessons = await prisma.lesson.count({
          where: { chapter: { courseId: e.courseId } },
        });
        const completed = await prisma.lessonProgress.count({
          where: {
            userId: childId,
            completed: true,
            lesson: { chapter: { courseId: e.courseId } },
          },
        });
        return {
          ...e,
          totalLessons,
          completedLessons: completed,
          progressPercent: totalLessons > 0 ? (completed / totalLessons) * 100 : 0,
        };
      })
    );

    return progressList;
  },

  async getChildGrades(parentId: string, childId: string) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const [examResults, assignmentSubmissions] = await Promise.all([
      prisma.examResult.findMany({
        where: { studentId: childId },
        include: {
          exam: { select: { id: true, title: true } },
        },
      }),
      prisma.assignmentSubmission.findMany({
        where: { studentId: childId },
        include: {
          assignment: { select: { id: true, title: true } },
        },
      }),
    ]);

    return { examResults, assignmentSubmissions };
  },

  async getChildAttendance(parentId: string, childId: string, query: Record<string, unknown>) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const classStudent = await prisma.classStudent.findFirst({
      where: { studentId: childId },
      include: { class: true },
    });
    if (!classStudent) return { records: [], class: null };

    const { page, limit, skip } = parsePagination(query);

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { classStudentId: classStudent.id },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.attendanceRecord.count({ where: { classStudentId: classStudent.id } }),
    ]);

    return { data: records, total, page, limit, class: classStudent.class };
  },

  async getChildAchievements(parentId: string, childId: string) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const [certificates, completedEnrollments] = await Promise.all([
      prisma.certificate.findMany({
        where: { userId: childId },
        include: {
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.enrollment.findMany({
        where: { userId: childId, status: 'COMPLETED' },
        include: {
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    return { certificates, completedCourses: completedEnrollments };
  },

  async getChildRecentCompletedLessons(parentId: string, childId: string, limit = 10) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const progress = await prisma.lessonProgress.findMany({
      where: { userId: childId, completed: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: {
        lesson: {
          include: {
            chapter: { include: { course: { select: { title: true } } } },
          },
        },
      },
    });

    return progress.map((p) => ({
      lesson: p.lesson,
      course: p.lesson?.chapter?.course,
      completedAt: p.completedAt,
      score: null,
    }));
  },

  async getChildWeeklyStudyTime(parentId: string, childId: string) {
    const link = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) return null;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: childId, completed: true, completedAt: { gte: weekAgo } },
      include: { lesson: { select: { duration: true } } },
    });

    const byDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const p of progress) {
      const day = new Date(p.completedAt!).getDay();
      const mins = (p.lesson?.duration ?? 30) / 60;
      byDay[day] = (byDay[day] ?? 0) + mins;
    }
    return [
      { day: 0, hours: Math.round(byDay[0] * 10) / 10 },
      { day: 1, hours: Math.round(byDay[1] * 10) / 10 },
      { day: 2, hours: Math.round(byDay[2] * 10) / 10 },
      { day: 3, hours: Math.round(byDay[3] * 10) / 10 },
      { day: 4, hours: Math.round(byDay[4] * 10) / 10 },
      { day: 5, hours: Math.round(byDay[5] * 10) / 10 },
      { day: 6, hours: Math.round(byDay[6] * 10) / 10 },
    ];
  },

  async getDashboardStats(parentId: string) {
    const children = await prisma.parentChild.findMany({
      where: { parentId },
      include: { child: { select: { id: true } } },
    });
    const childIds = children.map((c) => c.child.id);

    const [enrollments, certificates, attendance] = await Promise.all([
      prisma.enrollment.count({
        where: { userId: { in: childIds }, status: 'ACTIVE' },
      }),
      prisma.certificate.count({
        where: { userId: { in: childIds } },
      }),
      (async () => {
        const classStudents = await prisma.classStudent.findMany({
          where: { studentId: { in: childIds } },
          select: { id: true },
        });
        const csIds = classStudents.map((cs) => cs.id);
        const total = await prisma.attendanceRecord.count({
          where: { classStudentId: { in: csIds } },
        });
        const present = await prisma.attendanceRecord.count({
          where: { classStudentId: { in: csIds }, status: 'present' },
        });
        return total > 0 ? (present / total) * 100 : 0;
      })(),
    ]);

    const gradeAgg = await prisma.assignmentSubmission.aggregate({
      where: { studentId: { in: childIds }, grade: { not: null } },
      _avg: { grade: true },
    });

    return {
      childrenCount: children.length,
      enrolledCourses: enrollments,
      certificates,
      avgAttendance: attendance,
      avgGrade: gradeAgg._avg.grade ?? 0,
    };
  },

  async getRecentActivity(parentId: string, query: Record<string, unknown>) {
    const children = await prisma.parentChild.findMany({
      where: { parentId },
      select: { childId: true },
    });
    const childIds = children.map((c) => c.childId);

    const { limit = 20 } = parsePagination(query);

    const [lessonProgress, examResults] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId: { in: childIds }, completed: true },
        take: limit,
        orderBy: { completedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          lesson: {
            include: { chapter: { include: { course: { select: { title: true } } } } },
          },
        },
      }),
      prisma.examResult.findMany({
        where: { studentId: { in: childIds } },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: { select: { title: true } },
        },
      }),
    ]);

    const activities = [
      ...lessonProgress.map((p) => ({
        type: 'lesson_complete',
        user: p.user,
        lesson: p.lesson,
        course: p.lesson?.chapter?.course,
        date: p.completedAt,
      })),
      ...examResults.map((e) => ({
        type: 'exam_result',
        exam: e.exam,
        score: e.score,
        passed: e.passed,
        date: e.createdAt,
      })),
    ]
      .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0))
      .slice(0, limit);

    return activities;
  },

  async getUpcomingEvents(parentId: string) {
    const children = await prisma.parentChild.findMany({
      where: { parentId },
      select: { childId: true },
    });
    const childIds = children.map((c) => c.childId);

    const classStudents = await prisma.classStudent.findMany({
      where: { studentId: { in: childIds } },
      include: { class: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classStudents.map((cs) => cs.classId) },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    const exams = await prisma.exam.findMany({
      where: {
        startDate: { gte: new Date() },
        classId: { in: classStudents.map((cs) => cs.classId) },
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    });

    return { assignments, exams };
  },

  async listConversations(parentId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { members: { some: { userId: parentId } } },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true },
          },
        },
      }),
      prisma.conversation.count({
        where: { members: { some: { userId: parentId } } },
      }),
    ]);

    return { data: conversations, total, page, limit };
  },

  async getConversationMessages(conversationId: string, parentId: string, query: Record<string, unknown>) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: parentId } },
    });
    if (!member) return null;

    const { page, limit, skip } = parsePagination(query);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: parentId } },
      data: { unreadCount: 0 },
    });

    return { data: messages.reverse(), total, page, limit };
  },

  async sendMessage(conversationId: string, parentId: string, content: string, attachmentUrl?: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: parentId } },
      include: { conversation: { include: { members: true } } },
    });
    if (!member) return null;

    const otherMember = member.conversation.members.find((m) => m.userId !== parentId);
    const receiverId = otherMember?.userId ?? null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: parentId,
        receiverId,
        content,
        attachmentUrl: attachmentUrl ?? null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (otherMember) {
      await prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId: otherMember.userId } },
        data: { unreadCount: { increment: 1 } },
      });
    }

    return message;
  },

  async getProfile(parentId: string) {
    return prisma.user.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        parentProfile: true,
      },
    });
  },

  async updateProfile(
    parentId: string,
    data: { name?: string; phone?: string; city?: string; country?: string; relationship?: string; address?: string }
  ) {
    const { relationship, address, ...userData } = data;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: parentId },
        data: userData,
      }),
      prisma.parentProfile.upsert({
        where: { userId: parentId },
        create: {
          userId: parentId,
          relationship: relationship ?? null,
          address: address ?? null,
        },
        update: {
          ...(relationship !== undefined && { relationship }),
          ...(address !== undefined && { address }),
        },
      }),
    ]);

    return parentService.getProfile(parentId);
  },

  async updateNotificationSettings(
    parentId: string,
    data: { email?: boolean; push?: boolean; inApp?: boolean; settings?: Record<string, unknown> }
  ) {
    return prisma.notificationSetting.upsert({
      where: { userId: parentId },
      create: {
        userId: parentId,
        email: data.email ?? true,
        push: data.push ?? true,
        inApp: data.inApp ?? true,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
      },
      update: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.push !== undefined && { push: data.push }),
        ...(data.inApp !== undefined && { inApp: data.inApp }),
        ...(data.settings !== undefined && { settings: JSON.stringify(data.settings) }),
      },
    });
  },
};
