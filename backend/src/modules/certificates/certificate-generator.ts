import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

const FONT_PATH = path.resolve(
  process.cwd(),
  'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff'
);

export interface OverlayField {
  id: string;
  shortcode: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface CertificateData {
  userName: string;
  courseTitle: string;
  courseTitleAr?: string;
  instructorName?: string;
  date: string;
  grade?: number;
  certificateNo: string;
}

function parseRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (m) {
    return {
      r: parseInt(m[1], 16) / 255,
      g: parseInt(m[2], 16) / 255,
      b: parseInt(m[3], 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function getShortcodeValue(shortcode: string, data: CertificateData): string {
  switch (shortcode) {
    case 'student_name':
      return data.userName;
    case 'course_name':
      return data.courseTitle;
    case 'date':
      return data.date;
    case 'grade':
      return data.grade != null ? String(Math.round(data.grade)) : '';
    case 'certificate_no':
      return data.certificateNo;
    case 'instructor_name':
      return data.instructorName ?? '';
    default:
      return '';
  }
}

async function toPngIfNeeded(buffer: Buffer, mime: string): Promise<{ buffer: ArrayBuffer; isPng: boolean }> {
  const fmt = mime.toLowerCase();
  if (fmt === 'png' || fmt === 'jpeg' || fmt === 'jpg') {
    const arr = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return { buffer: arr, isPng: fmt === 'png' };
  }
  if (fmt === 'webp' || fmt === 'gif' || fmt === 'avif') {
    const png = await sharp(buffer).png().toBuffer();
    const arr = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    return { buffer: arr, isPng: true };
  }
  throw new Error(`Unsupported image format: ${mime}`);
}

async function getImageBuffer(imageUrl: string): Promise<{ buffer: ArrayBuffer; isPng: boolean }> {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:image\/([a-z]+);base64,(.+)$/i);
    if (match) {
      const mime = match[1].toLowerCase();
      const base64 = match[2];
      const binary = Buffer.from(base64, 'base64');
      return toPngIfNeeded(binary, mime);
    }
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const uploadDir = path.resolve(env.uploadDir);
    const uploadsMatch = imageUrl.match(/\/(uploads\/[^?#]+)/);
    if (uploadsMatch) {
      const relPath = uploadsMatch[1].replace(/^\/?uploads\//, '');
      const fullPath = path.join(uploadDir, relPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase().slice(1) || 'png';
        const mime = ext === 'jpg' ? 'jpeg' : ext;
        return toPngIfNeeded(buffer, mime);
      }
    }
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const arr = await res.arrayBuffer();
    const buffer = Buffer.from(arr);
    const contentType = res.headers.get('content-type') || '';
    const mime = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
        ? 'jpeg'
        : contentType.includes('webp')
          ? 'webp'
          : contentType.includes('gif')
            ? 'gif'
            : 'png';
    return toPngIfNeeded(buffer, mime);
  }
  if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('/uploads/')) {
    const uploadDir = path.resolve(env.uploadDir);
    const relPath = imageUrl.replace(/^\/?uploads\//, '');
    const fullPath = path.join(uploadDir, relPath);
    if (!fs.existsSync(fullPath)) throw new Error(`Template image not found: ${relPath}`);
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase().slice(1) || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return toPngIfNeeded(buffer, mime);
  }
  throw new Error('Invalid image URL format');
}

export async function generateCertificatePdf(
  imageUrl: string,
  overlayFields: OverlayField[],
  data: CertificateData
): Promise<Uint8Array> {
  const { buffer, isPng } = await getImageBuffer(imageUrl);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error('Arabic font not found. Install @fontsource/amiri or add backend/fonts/Amiri-Regular.ttf');
  }
  const fontBytes = fs.readFileSync(FONT_PATH);
  const font = await pdfDoc.embedFont(fontBytes);

  const image = isPng
    ? await pdfDoc.embedPng(buffer)
    : await pdfDoc.embedJpg(buffer);

  const imgWidth = image.width;
  const imgHeight = image.height;

  const page = pdfDoc.addPage([imgWidth, imgHeight]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  for (const field of overlayFields) {
    const text = getShortcodeValue(field.shortcode, data);
    const displayText = text || '-';

    const color = parseRgb(field.color);
    const pdfX = (field.x / 100) * imgWidth;
    const topFromTop = (field.y / 100) * imgHeight;
    const pdfY = imgHeight - topFromTop - field.fontSize * 0.85;

    page.drawText(displayText, {
      x: pdfX,
      y: pdfY,
      size: field.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
