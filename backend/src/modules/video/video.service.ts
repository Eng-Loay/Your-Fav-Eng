import prisma from '../../config/database';
import { deleteStoredMedia, publicMediaUrl } from '../../lib/blob';

export const videoService = {
  async upload(userId: string, file: Express.Multer.File) {
    const url = file.blobUrl;
    if (!url) throw new Error('Upload was not persisted to Blob storage');
    const sizeMb = file.size ? file.size / (1024 * 1024) : 0;

    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname || file.filename || 'video',
        type: 'VIDEO',
        size: sizeMb,
        url,
        uploadedBy: userId,
      },
    });

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      url,
      streamUrl: url,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
    };
  },

  async getStreamUrl(id: string, _userId?: string) {
    const file = await prisma.file.findUnique({
      where: { id, type: 'VIDEO' },
      select: { id: true, name: true, url: true, uploadedBy: true },
    });

    if (!file) return null;

    const url = publicMediaUrl(file.url);
    return {
      id: file.id,
      streamUrl: url,
      url,
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

    await deleteStoredMedia(file.url);
    await prisma.file.delete({ where: { id } });
    return true;
  },
};
