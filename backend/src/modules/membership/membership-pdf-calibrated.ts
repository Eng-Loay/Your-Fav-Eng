import { PDFPage, PDFFont, rgb } from 'pdf-lib';
import { BRAND_RED_RGB, MEMBERSHIP_TEMPLATE_LAYOUT } from './membership-template-layout';

export interface MembershipPdfDrawData {
  memberName: string;
  membershipNo: string;
  packageTitle: string;
  level?: string;
  courseCount: number;
  duration: string;
  issuedAt: string;
  expiresAt?: string;
}

function parseRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  };
}

function scaleY(imgHeight: number, topPx: number) {
  return (topPx / MEMBERSHIP_TEMPLATE_LAYOUT.height) * imgHeight;
}

function scaleX(imgWidth: number, xPx: number) {
  return (xPx / MEMBERSHIP_TEMPLATE_LAYOUT.width) * imgWidth;
}

function drawBand(
  page: PDFPage,
  imgWidth: number,
  imgHeight: number,
  cx: number,
  topPx: number,
  bottomPx: number,
  maxWidthPx: number,
  fill: [number, number, number]
) {
  const top = scaleY(imgHeight, topPx);
  const bottom = scaleY(imgHeight, bottomPx);
  const width = scaleX(imgWidth, maxWidthPx);
  const height = bottom - top;
  page.drawRectangle({
    x: scaleX(imgWidth, cx) - width / 2,
    y: imgHeight - bottom,
    width,
    height,
    color: rgb(fill[0], fill[1], fill[2]),
  });
}

function fitFontSize(font: PDFFont, text: string, startSize: number, maxWidthPx: number, imgWidth: number) {
  let size = startSize;
  const maxW = scaleX(imgWidth, maxWidthPx) - 16;
  while (size > 6 && font.widthOfTextAtSize(text, size) > maxW) {
    size -= 0.5;
  }
  return size;
}

function drawCenteredInBand(
  page: PDFPage,
  text: string,
  imgWidth: number,
  imgHeight: number,
  cx: number,
  topPx: number,
  bottomPx: number,
  fontSize: number,
  font: PDFFont,
  colorHex: string,
  maxWidthPx: number
) {
  const size = fitFontSize(font, text, fontSize, maxWidthPx, imgWidth);
  const color = parseRgb(colorHex);
  const textWidth = font.widthOfTextAtSize(text, size);
  const midY = (topPx + bottomPx) / 2;
  const baseline = imgHeight - scaleY(imgHeight, midY) - size * 0.35;

  page.drawText(text, {
    x: scaleX(imgWidth, cx) - textWidth / 2,
    y: baseline,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

export function isDefaultMembershipTemplateImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return true;
  return imageUrl.includes('membership-template.png');
}

export function drawCalibratedMembershipFields(
  page: PDFPage,
  data: MembershipPdfDrawData,
  imgWidth: number,
  imgHeight: number,
  fonts: { regular: PDFFont; bold: PDFFont }
) {
  const cert = MEMBERSHIP_TEMPLATE_LAYOUT.certCode;
  const name = MEMBERSHIP_TEMPLATE_LAYOUT.memberName;
  const pkg = MEMBERSHIP_TEMPLATE_LAYOUT.packageLine;
  const training = MEMBERSHIP_TEMPLATE_LAYOUT.trainingLine;
  const issued = MEMBERSHIP_TEMPLATE_LAYOUT.issuedDate;

  const membershipNoText = data.membershipNo.toUpperCase();
  const memberName = data.memberName.toUpperCase();
  const packageLine = data.packageTitle.toUpperCase();
  const hoursLine = `CONSISTING OF ${data.courseCount * 8} HOURS OF TRAINING`;

  drawBand(page, imgWidth, imgHeight, cert.cx, cert.top, cert.bottom, cert.maxWidth, [
    BRAND_RED_RGB.r,
    BRAND_RED_RGB.g,
    BRAND_RED_RGB.b,
  ]);
  drawCenteredInBand(
    page,
    membershipNoText,
    imgWidth,
    imgHeight,
    cert.cx,
    cert.top,
    cert.bottom,
    cert.fontSize,
    fonts.bold,
    cert.color,
    cert.maxWidth
  );

  drawBand(page, imgWidth, imgHeight, name.cx, name.top, name.bottom, name.maxWidth, [1, 1, 1]);
  drawCenteredInBand(
    page,
    memberName,
    imgWidth,
    imgHeight,
    name.cx,
    name.top,
    name.bottom,
    name.fontSize,
    fonts.bold,
    name.color,
    name.maxWidth
  );

  drawBand(page, imgWidth, imgHeight, pkg.cx, pkg.top, pkg.bottom, pkg.maxWidth, [1, 1, 1]);
  drawCenteredInBand(
    page,
    packageLine,
    imgWidth,
    imgHeight,
    pkg.cx,
    pkg.top,
    pkg.bottom,
    pkg.fontSize,
    fonts.bold,
    pkg.color,
    pkg.maxWidth
  );

  drawBand(page, imgWidth, imgHeight, training.cx, training.top, training.bottom, training.maxWidth, [1, 1, 1]);
  drawCenteredInBand(
    page,
    hoursLine,
    imgWidth,
    imgHeight,
    training.cx,
    training.top,
    training.bottom,
    training.fontSize,
    fonts.regular,
    training.color,
    training.maxWidth
  );

  const dateColor = parseRgb(issued.color);
  page.drawText(data.issuedAt.toUpperCase(), {
    x: scaleX(imgWidth, issued.x),
    y: imgHeight - scaleY(imgHeight, issued.top) - issued.fontSize * 0.2,
    size: issued.fontSize,
    font: fonts.regular,
    color: rgb(dateColor.r, dateColor.g, dateColor.b),
  });
}
