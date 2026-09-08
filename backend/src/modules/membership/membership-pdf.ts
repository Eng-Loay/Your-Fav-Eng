import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import type { OverlayField } from '../certificates/certificate-generator';
import {
  drawCalibratedMembershipFields,
  isDefaultMembershipTemplateImage,
} from './membership-pdf-calibrated';

export interface MembershipPdfData {
  memberName: string;
  membershipNo: string;
  packageTitle: string;
  level?: string;
  courseCount: number;
  duration: string;
  issuedAt: string;
  expiresAt?: string;
}

export interface MembershipTemplateInput {
  imageUrl?: string | null;
  overlayFields?: string | null;
}

const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'assets/brand/certificates/membership-template.png'
);

const FONT_PATH = path.resolve(
  process.cwd(),
  'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff'
);

function getStaticTemplatePath(): string {
  if (fs.existsSync(TEMPLATE_PATH)) return TEMPLATE_PATH;
  const fallback = path.resolve(process.cwd(), '../public/brand/certificates/membership-template.png');
  if (fs.existsSync(fallback)) return fallback;
  throw new Error('Membership certificate template not found');
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

export function getMembershipShortcodeValue(shortcode: string, data: MembershipPdfData): string {
  switch (shortcode) {
    case 'member_name':
      return data.memberName;
    case 'membership_no':
      return data.membershipNo;
    case 'package_title':
      return data.packageTitle;
    case 'level':
      return data.level ?? '';
    case 'course_count':
      return String(data.courseCount);
    case 'duration':
      return data.duration;
    case 'issued_date':
      return data.issuedAt;
    case 'expires_date':
      return data.expiresAt ?? '';
    default:
      return '';
  }
}

async function loadTemplateImage(imageUrl: string): Promise<{ buffer: Buffer; isPng: boolean }> {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:image\/([a-z]+);base64,(.+)$/i);
    if (!match) throw new Error('Invalid data URL');
    const buffer = Buffer.from(match[2], 'base64');
    const mime = match[1].toLowerCase();
    return { buffer, isPng: mime === 'png' };
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    return { buffer, isPng: contentType.includes('png') };
  }
  if (imageUrl.startsWith('/')) {
    const publicPath = path.resolve(process.cwd(), '../public', imageUrl.replace(/^\//, ''));
    if (fs.existsSync(publicPath)) {
      const buffer = fs.readFileSync(publicPath);
      const ext = path.extname(publicPath).toLowerCase().slice(1) || 'png';
      return { buffer, isPng: ext === 'png' };
    }
  }
  throw new Error('Invalid template image URL');
}

async function renderCalibratedPdf(data: MembershipPdfData, buffer: Buffer, isPng: boolean): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const image = isPng
    ? await pdfDoc.embedPng(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer)
    : await pdfDoc.embedJpg(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);

  const imgWidth = image.width;
  const imgHeight = image.height;
  const page = pdfDoc.addPage([imgWidth, imgHeight]);
  page.drawImage(image, { x: 0, y: 0, width: imgWidth, height: imgHeight });
  drawCalibratedMembershipFields(page, data, imgWidth, imgHeight, {
    regular: helvetica,
    bold: helveticaBold,
  });
  return Buffer.from(await pdfDoc.save());
}

async function generateMembershipPdfStatic(data: MembershipPdfData): Promise<Buffer> {
  const templatePath = getStaticTemplatePath();
  const imageBytes = fs.readFileSync(templatePath);
  return renderCalibratedPdf(data, imageBytes, true);
}

async function generateMembershipPdfWithTemplate(
  data: MembershipPdfData,
  template: MembershipTemplateInput
): Promise<Buffer> {
  if (!template.imageUrl) return generateMembershipPdfStatic(data);

  const { buffer, isPng } = await loadTemplateImage(template.imageUrl);
  if (isDefaultMembershipTemplateImage(template.imageUrl)) {
    return renderCalibratedPdf(data, buffer, isPng);
  }

  let overlayFields: OverlayField[] = [];
  if (template.overlayFields) {
    try {
      overlayFields = JSON.parse(template.overlayFields) as OverlayField[];
    } catch {
      overlayFields = [];
    }
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = fs.existsSync(FONT_PATH)
    ? await pdfDoc.embedFont(fs.readFileSync(FONT_PATH))
    : helvetica;

  const image = isPng
    ? await pdfDoc.embedPng(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer)
    : await pdfDoc.embedJpg(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);

  const imgWidth = image.width;
  const imgHeight = image.height;
  const page = pdfDoc.addPage([imgWidth, imgHeight]);
  page.drawImage(image, { x: 0, y: 0, width: imgWidth, height: imgHeight });

  for (const field of overlayFields) {
    let text = getMembershipShortcodeValue(field.shortcode, data) || '-';
    if (field.shortcode === 'member_name' || field.shortcode === 'package_title' || field.shortcode === 'membership_no') {
      text = text.toUpperCase();
    }

    const color = parseRgb(field.color);
    const pdfX = (field.x / 100) * imgWidth;
    const topFromTop = (field.y / 100) * imgHeight;
    const pdfY = imgHeight - topFromTop - field.fontSize * 0.72;
    const fieldFont =
      field.shortcode === 'member_name' || field.shortcode === 'package_title'
        ? helveticaBold
        : font;
    const textWidth = fieldFont.widthOfTextAtSize(text, field.fontSize);
    const centeredX =
      field.shortcode === 'member_name' || field.shortcode === 'package_title'
        ? pdfX - textWidth / 2
        : pdfX;

    page.drawText(text, {
      x: centeredX,
      y: pdfY,
      size: field.fontSize,
      font: fieldFont,
      color: rgb(color.r, color.g, color.b),
    });
  }

  return Buffer.from(await pdfDoc.save());
}

export async function generateMembershipPdf(
  data: MembershipPdfData,
  template?: MembershipTemplateInput | null
): Promise<Buffer> {
  if (template?.imageUrl) {
    return generateMembershipPdfWithTemplate(data, template);
  }
  return generateMembershipPdfStatic(data);
}

export async function saveMembershipPdf(
  data: MembershipPdfData,
  membershipNo: string,
  template?: MembershipTemplateInput | null
): Promise<string> {
  const buffer = await generateMembershipPdf(data, template);
  const { persistBuffer } = await import('../../lib/blob');
  const filename = `membership-${membershipNo.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
  const stored = await persistBuffer(buffer, filename, 'application/pdf', 'uploads/memberships');
  return stored.url;
}
