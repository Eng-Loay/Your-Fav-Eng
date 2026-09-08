import prisma from '../../config/database';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

export const videoService = {
  async upload(userId: string, file: Express.Multer.File) {
    const filename = file.filename || path.basename((file as any).path || '');
    const relativePath = `uploads/${filename}`;
    const sizeMb = file.size ? file.size / (1024 * 1024) : 0;

    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname || filename || 'video',
        type: 'VIDEO',
        size: sizeMb,
        url: relativePath,
        uploadedBy: userId,
      },
    });

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      url: relativePath,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
    };
  },

  async getStreamUrl(id: string, userId?: string) {
    const file = await prisma.file.findUnique({
      where: { id, type: 'VIDEO' },
      select: { id: true, name: true, url: true, uploadedBy: true },
    });

    if (!file) return null;

    const uploadDir = path.resolve(env.uploadDir);
    const baseDir = path.dirname(uploadDir);
    const fullPath = path.join(baseDir, file.url);

    if (!fs.existsSync(fullPath)) return null;

    return {
      id: file.id,
      streamUrl: `/api/video/${file.id}/stream`,
      url: file.url,
    };
  },

  async deleteVideo(id: string, userId: string, userRole: string) {
    const file = await prisma.file.findUnique({
      where: { id, type: 'VIDEO' },
      select: { id: true, url: true, uploadedBy: true },
    });

    if (!file) return null;

    const canDelete = file.uploadedBy === userId || userRole === 'ADMIN';
    if (!canDelete) return null;

    const uploadDir = path.resolve(env.uploadDir);
    const baseDir = path.dirname(uploadDir);
    const fullPath = path.join(baseDir, file.url);

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // Ignore file delete errors
      }
    }

    await prisma.file.delete({ where: { id } });
    return true;
  },
};
