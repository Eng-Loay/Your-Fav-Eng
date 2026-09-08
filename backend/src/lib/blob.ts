import { del, put } from '@vercel/blob';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_FOLDER = 'uploads';

export function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url) && url.includes('blob.vercel-storage.com');
}

export function publicMediaUrl(stored: string | null | undefined): string {
  if (!stored) return '';
  if (/^https?:\/\//i.test(stored) || stored.startsWith('data:')) return stored;
  if (stored.startsWith('/uploads/') || stored.startsWith('uploads/')) {
    // Legacy VPS paths are not readable on Vercel. Callers should re-upload.
    return stored.startsWith('/') ? stored : `/${stored}`;
  }
  return stored;
}

export async function persistUpload(
  file: Express.Multer.File,
  folder: string = DEFAULT_FOLDER
): Promise<{ url: string; pathname: string }> {
  if (file.blobUrl && file.blobPathname) {
    return { url: file.blobUrl, pathname: file.blobPathname };
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  if (!file.buffer?.length) {
    throw new Error('Upload has no in-memory buffer (disk storage is not supported)');
  }

  const ext = path.extname(file.originalname || '') || mimeToExt(file.mimetype);
  const pathname = `${folder.replace(/\/$/, '')}/${uuidv4()}${ext}`;
  const blob = await put(pathname, file.buffer, {
    access: 'public',
    token,
    contentType: file.mimetype || 'application/octet-stream',
    addRandomSuffix: false,
  });

  file.blobUrl = blob.url;
  file.blobPathname = pathname;
  file.filename = path.basename(pathname);
  return { url: blob.url, pathname };
}

export async function persistBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string = DEFAULT_FOLDER
): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const pathname = `${folder.replace(/\/$/, '')}/${uuidv4()}-${safe}`;
  const blob = await put(pathname, buffer, {
    access: 'public',
    token,
    contentType,
    addRandomSuffix: false,
  });
  return { url: blob.url, pathname };
}

export async function deleteStoredMedia(urlOrPath: string | null | undefined): Promise<void> {
  if (!urlOrPath) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  if (isBlobUrl(urlOrPath)) {
    try {
      await del(urlOrPath, { token });
    } catch {
      // Ignore missing blobs
    }
  }
}

export function uploadedUrl(file: Express.Multer.File | undefined): string {
  if (!file) return '';
  return file.blobUrl || '';
}

function mimeToExt(mime: string | undefined): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'video/mp4':
      return '.mp4';
    case 'video/webm':
      return '.webm';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
