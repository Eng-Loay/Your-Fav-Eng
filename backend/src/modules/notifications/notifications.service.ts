import prisma from '../../config/database';
import { parsePagination } from '../../utils/helpers';

export const notificationsService = {
  async list(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { data: notifications, total, page, limit };
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return true;
  },

  async getSettings(userId: string) {
    let settings = await prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: {
          userId,
          email: true,
          push: true,
          inApp: true,
        },
      });
    }

    return settings;
  },

  async updateSettings(
    userId: string,
    data: { email?: boolean; push?: boolean; inApp?: boolean; settings?: Record<string, unknown> }
  ) {
    return prisma.notificationSetting.upsert({
      where: { userId },
      create: {
        userId,
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
