import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { persistUpload } from '../lib/blob';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSize },
});

function wrapBlob(middleware: ReturnType<typeof upload.single>) {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, async (err: unknown) => {
      if (err) {
        next(err);
        return;
      }
      try {
        if (req.file) {
          await persistUpload(req.file);
        }
        const files = (req as Request & { files?: Express.Multer.File[] }).files;
        if (Array.isArray(files)) {
          for (const file of files) {
            await persistUpload(file);
          }
        }
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
}

export const uploadImage = wrapBlob(upload.single('image'));
export const uploadVideo = wrapBlob(upload.single('video'));
export const uploadFile = wrapBlob(upload.single('file'));
export const uploadMultiple = wrapBlob(upload.array('files', 10) as ReturnType<typeof upload.single>);
