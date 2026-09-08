import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';

async function getChatEnabled(): Promise<boolean> {
  const s = await prisma.platformSetting.findUnique({ where: { key: 'chat_enabled' } });
  return s ? s.value === 'true' : true; // default enabled
}

export const messagesService = {
  getChatEnabled,

  async listEnrolledInstructors(studentId: string) {
    const [enrollments, approvedRequests, completedOrders] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: studentId, status: 'ACTIVE' },
        include: {
          course: {
            select: {
              instructorId: true,
              instructor: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      }),
      prisma.paymentRequest.findMany({
        where: { userId: studentId, status: 'APPROVED', courseId: { not: null } },
        include: {
          course: {
            select: {
              instructorId: true,
              instructor: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      }),
      prisma.order.findMany({
        where: { userId: studentId, status: 'COMPLETED' },
        include: {
          items: {
            where: { courseId: { not: null } },
            include: {
              course: {
                select: {
                  instructorId: true,
                  instructor: { select: { id: true, name: true, avatar: true } },
                },
              },
            },
          },
        },
      }),
    ]);
    const seen = new Set<string>();
    const instructors: { id: string; name: string; avatar: string | null }[] = [];
    for (const e of enrollments) {
      const inst = e.course?.instructor;
      if (inst && !seen.has(inst.id)) {
        seen.add(inst.id);
        instructors.push({ id: inst.id, name: inst.name, avatar: inst.avatar });
      }
    }
    for (const pr of approvedRequests) {
      const inst = (pr as any).course?.instructor;
      if (inst && !seen.has(inst.id)) {
        seen.add(inst.id);
        instructors.push({ id: inst.id, name: inst.name, avatar: inst.avatar });
      }
    }
    for (const order of completedOrders) {
      for (const item of order.items) {
        const inst = (item as any).course?.instructor;
        if (inst && !seen.has(inst.id)) {
          seen.add(inst.id);
          instructors.push({ id: inst.id, name: inst.name, avatar: inst.avatar });
        }
      }
    }
    return instructors;
  },

  async listEnrolledStudentsParents(instructorId: string) {
    const [enrollments, classStudentIds] = await Promise.all([
      prisma.enrollment.findMany({
        where: { course: { instructorId }, status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true },
            include: {
              childParents: {
                include: {
                  parent: { select: { id: true, name: true, avatar: true, email: true } },
                },
              },
            },
          },
        },
      }),
      prisma.classStudent.findMany({
        where: { class: { teacherId: instructorId } },
        select: { studentId: true },
      }),
    ]);
    const classStudentUserIds = [...new Set(classStudentIds.map((cs) => cs.studentId))];
    const classStudentsWithParents =
      classStudentUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: classStudentUserIds } },
            include: {
              childParents: {
                include: {
                  parent: { select: { id: true, name: true, avatar: true, email: true } },
                },
              },
            },
          })
        : [];
    const seen = new Set<string>();
    const parents: { id: string; name: string; avatar: string | null; email: string | null; children: string[] }[] = [];
    for (const e of enrollments) {
      const student = e.user;
      for (const pc of student?.childParents || []) {
        const p = pc.parent;
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          parents.push({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            email: p.email,
            children: [student?.name].filter(Boolean),
          });
        }
      }
    }
    for (const student of classStudentsWithParents) {
      for (const pc of student?.childParents || []) {
        const p = pc.parent;
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          const existing = parents.find((x) => x.id === p.id);
          if (existing) {
            existing.children.push(student?.name || '');
          } else {
            parents.push({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              email: p.email,
              children: [student?.name].filter(Boolean),
            });
          }
        }
      }
    }
    return parents;
  },

  async listEnrolledStudents(instructorId: string) {
    const [enrollments, approvedRequests, completedOrders] = await Promise.all([
      prisma.enrollment.findMany({
        where: { course: { instructorId }, status: 'ACTIVE' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED', courseId: { not: null }, course: { instructorId } },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          items: { some: { course: { instructorId } } },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
    ]);
    const seen = new Set<string>();
    const students: { id: string; name: string; avatar: string | null }[] = [];
    for (const e of enrollments) {
      if (e.user && !seen.has(e.user.id)) {
        seen.add(e.user.id);
        students.push({ id: e.user.id, name: e.user.name, avatar: e.user.avatar });
      }
    }
    for (const pr of approvedRequests) {
      if (pr.user && !seen.has(pr.user.id)) {
        seen.add(pr.user.id);
        students.push({ id: pr.user.id, name: pr.user.name, avatar: pr.user.avatar });
      }
    }
    for (const order of completedOrders) {
      if (order.user && !seen.has(order.user.id)) {
        seen.add(order.user.id);
        students.push({ id: order.user.id, name: order.user.name, avatar: order.user.avatar });
      }
    }
    return students;
  },

  async submitContact(name: string, email: string, message: string, subject?: string) {
    return prisma.contactMessage.create({
      data: { name, email, subject: subject ?? null, message },
    });
  },

  async listConversations(userId: string, query: Record<string, unknown>, userRole?: string) {
    const { page, limit, skip } = parsePagination(query);

    const [allConvs, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where: { members: { some: { userId } } },
        orderBy: { updatedAt: 'desc' },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true, email: true, role: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true, senderId: true, attachmentUrl: true, attachmentType: true },
          },
        },
      }),
      prisma.conversation.count({ where: { members: { some: { userId } } } }),
    ]);

    const filtered = allConvs;

    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit);
    return { data, total, page, limit };
  },

  /** Admin: list ALL conversations in the system with participant info (role, children for parents) */
  async listAllConversationsForAdmin(adminId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const allConvs = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, senderId: true, attachmentUrl: true, attachmentType: true },
        },
      },
    });

    const parentIds = [...new Set(allConvs.flatMap((c) => c.members.filter((m) => m.user?.role === 'PARENT').map((m) => m.user!.id).filter(Boolean)))];
    const parentChildren =
      parentIds.length > 0
        ? await prisma.parentChild.findMany({
            where: { parentId: { in: parentIds } },
            include: { child: { select: { id: true, name: true } } },
          })
        : [];
    const childrenByParent = new Map<string, string[]>();
    for (const pc of parentChildren) {
      const arr = childrenByParent.get(pc.parentId) ?? [];
      arr.push(pc.child.name);
      childrenByParent.set(pc.parentId, arr);
    }

    const data = allConvs.slice(skip, skip + limit).map((c) => {
      const otherMembers = c.members.filter((m) => m.userId !== adminId);
      const participants = otherMembers.length > 0 ? otherMembers : c.members;
      const primaryOther = participants[0];
      const user = primaryOther?.user;
      const role = user?.role ?? 'STUDENT';
      const children = role === 'PARENT' && user?.id ? childrenByParent.get(user.id) ?? [] : [];
      return {
        ...c,
        primaryParticipant: user
          ? {
              ...user,
              participantType: role,
              children,
            }
          : null,
        members: c.members,
      };
    });

    return { data, total: allConvs.length, page, limit };
  },

  /** Admin: get messages for any conversation (bypass member check) */
  async getMessagesForAdmin(conversationId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: messages.reverse(), total, page, limit };
  },

  async createConversation(userId: string, targetUserId: string, title?: string, userRole?: string) {
    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, role: true } }),
    ]);
    if (!targetUser) return null;

    // Admin can message any user. Students can only message enrolled instructors. Instructors can only message enrolled students or parents of enrolled students.
    if (currentUser?.role === 'ADMIN') {
      // Admin bypass - allow
    } else if (currentUser?.role === 'STUDENT') {
      const enrolledIds = new Set((await this.listEnrolledInstructors(userId)).map((i) => i.id));
      if (!enrolledIds.has(targetUserId)) return null;
    } else if (currentUser?.role === 'TEACHER') {
      const enrolledStudentIds = new Set((await this.listEnrolledStudents(userId)).map((s) => s.id));
      if (enrolledStudentIds.has(targetUserId)) {
        // Target is enrolled student - allow
      } else if (targetUser.role === 'PARENT') {
        const parentIds = new Set((await this.listEnrolledStudentsParents(userId)).map((p) => p.id));
        if (!parentIds.has(targetUserId)) return null;
      } else {
        return null;
      }
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: { members: true },
    });

    if (existing && existing.members.length === 2) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        title: title ?? null,
        isGroup: false,
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        },
      },
    });
  },

  async getMessages(conversationId: string, userId: string, query: Record<string, unknown>) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
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
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    return { data: messages.reverse(), total, page, limit };
  },

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'audio'
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: { conversation: { include: { members: true } } },
    });
    if (!member) return null;

    const otherMembers = member.conversation.members.filter((m) => m.userId !== userId);
    const receiverId = member.conversation.isGroup ? null : otherMembers[0]?.userId ?? null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content: content || '',
        attachmentUrl: attachmentUrl ?? null,
        attachmentType: attachmentType ?? null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    for (const om of otherMembers) {
      await prisma.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: om.userId },
        },
        data: { unreadCount: { increment: 1 } },
      });
      if (om.userId) {
        import('../../services/notification.service').then(({ notifyNewMessage }) =>
          notifyNewMessage(om.userId!, userId, content || '', 'ar').catch(() => {})
        ).catch(() => {});
      }
    }

    // Fire-and-forget WebSocket broadcast to all members of the conversation
    try {
      const memberUserIds = member.conversation.members.map((m) => m.userId);
      import('../../realtime/websocket')
        .then(({ broadcastNewMessage }) =>
          broadcastNewMessage(conversationId, message, memberUserIds)
        )
        .catch(() => {});
    } catch {
      // ignore websocket errors
    }

    return message;
  },

  async createCommunity(userId: string, title: string, memberIds: string[], userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'TEACHER') return null;
    const allMemberIds = [userId, ...memberIds.filter((id) => id !== userId)];
    const unique = [...new Set(allMemberIds)];
    return prisma.conversation.create({
      data: {
        title,
        isGroup: true,
        createdById: userId,
        members: {
          create: unique.map((uid) => ({ userId: uid })),
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

  async listCommunities(userId: string, userRole: string) {
    const where: any =
      userRole === 'ADMIN'
        ? { isGroup: true }
        : userRole === 'TEACHER'
          ? { isGroup: true, OR: [{ createdById: userId }, { members: { some: { userId } } }] }
          : { isGroup: true, members: { some: { userId } } };

    return prisma.conversation.findMany({
      where,
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
          select: { content: true, createdAt: true, senderId: true },
        },
      },
    });
  },

  async addCommunityMembers(
    conversationId: string,
    userId: string,
    userRole: string,
    memberIds: string[]
  ) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, isGroup: true },
      include: { members: true },
    });
    if (!conv) return null;
    const canEdit: boolean = userRole === 'ADMIN' || (conv.createdById !== null && conv.createdById === userId);
    if (!canEdit) return null;

    const existingIds = new Set(conv.members.map((m) => m.userId));
    const toAdd = memberIds.filter((id) => !existingIds.has(id));
    if (toAdd.length === 0) return conv;

    await prisma.conversationMember.createMany({
      data: toAdd.map((uid) => ({ conversationId, userId: uid })),
    });

    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  },

  async removeCommunityMember(conversationId: string, userId: string, userRole: string, targetUserId: string): Promise<boolean | null> {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, isGroup: true },
    });
    if (!conv) return null;
    const canEdit = userRole === 'ADMIN' || conv.createdById === userId;
    if (!canEdit) return null;

    await prisma.conversationMember.deleteMany({
      where: { conversationId, userId: targetUserId },
    });
    return true;
  },

  async markAsRead(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!member) return null;

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });

    return true;
  },
};
