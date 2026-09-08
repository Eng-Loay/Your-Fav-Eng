import { PDFPage, PDFFont, rgb } from "pdf-lib"
import type { MembershipPdfInput } from "@/lib/membership-pdf-shared"
import { BRAND_RED_RGB, MEMBERSHIP_TEMPLATE_LAYOUT } from "@/lib/membership-template-layout"

function parseRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  }
}

function scaleY(imgHeight: number, topPx: number) {
  return (topPx / MEMBERSHIP_TEMPLATE_LAYOUT.height) * imgHeight
}

function scaleX(imgWidth: number, xPx: number) {
  return (xPx / MEMBERSHIP_TEMPLATE_LAYOUT.width) * imgWidth
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
  const top = scaleY(imgHeight, topPx)
  const bottom = scaleY(imgHeight, bottomPx)
  const width = scaleX(imgWidth, maxWidthPx)
  const height = bottom - top
  page.drawRectangle({
    x: scaleX(imgWidth, cx) - width / 2,
    y: imgHeight - bottom,
    width,
    height,
    color: rgb(fill[0], fill[1], fill[2]),
  })
}

function fitFontSize(font: PDFFont, text: string, startSize: number, maxWidthPx: number, imgWidth: number) {
  let size = startSize
  const maxW = scaleX(imgWidth, maxWidthPx) - 16
  while (size > 6 && font.widthOfTextAtSize(text, size) > maxW) {
    size -= 0.5
  }
  return size
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
  const size = fitFontSize(font, text, fontSize, maxWidthPx, imgWidth)
  const color = parseRgb(colorHex)
  const textWidth = font.widthOfTextAtSize(text, size)
  const midY = (topPx + bottomPx) / 2
  const baseline = imgHeight - scaleY(imgHeight, midY) - size * 0.35

  page.drawText(text, {
    x: scaleX(imgWidth, cx) - textWidth / 2,
    y: baseline,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  })
}

/** Field 1 — membership / certification code (red box only) */
function drawCertCodeField(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  font: PDFFont
) {
  const band = MEMBERSHIP_TEMPLATE_LAYOUT.certCode
  const text = data.membershipNo.toUpperCase()
  drawBand(page, imgWidth, imgHeight, band.cx, band.top, band.bottom, band.maxWidth, [
    BRAND_RED_RGB.r,
    BRAND_RED_RGB.g,
    BRAND_RED_RGB.b,
  ])
  drawCenteredInBand(
    page,
    text,
    imgWidth,
    imgHeight,
    band.cx,
    band.top,
    band.bottom,
    band.fontSize,
    font,
    band.color,
    band.maxWidth
  )
}

/** Field 2 — member name (white band over (NAME) only) */
function drawMemberNameField(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  font: PDFFont
) {
  const band = MEMBERSHIP_TEMPLATE_LAYOUT.memberName
  const text = data.memberName.toUpperCase()
  drawBand(page, imgWidth, imgHeight, band.cx, band.top, band.bottom, band.maxWidth, [1, 1, 1])
  drawCenteredInBand(
    page,
    text,
    imgWidth,
    imgHeight,
    band.cx,
    band.top,
    band.bottom,
    band.fontSize,
    font,
    band.color,
    band.maxWidth
  )
}

/** Field 3 — package title between red bars */
function drawPackageField(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  font: PDFFont
) {
  const band = MEMBERSHIP_TEMPLATE_LAYOUT.packageLine
  const text = data.packageTitle.toUpperCase()
  drawBand(page, imgWidth, imgHeight, band.cx, band.top, band.bottom, band.maxWidth, [1, 1, 1])
  drawCenteredInBand(
    page,
    text,
    imgWidth,
    imgHeight,
    band.cx,
    band.top,
    band.bottom,
    band.fontSize,
    font,
    band.color,
    band.maxWidth
  )
}

/** Field 4 — training hours line */
function drawTrainingField(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  font: PDFFont
) {
  const band = MEMBERSHIP_TEMPLATE_LAYOUT.trainingLine
  const text = `CONSISTING OF ${data.courseCount * 8} HOURS OF TRAINING`
  drawBand(page, imgWidth, imgHeight, band.cx, band.top, band.bottom, band.maxWidth, [1, 1, 1])
  drawCenteredInBand(
    page,
    text,
    imgWidth,
    imgHeight,
    band.cx,
    band.top,
    band.bottom,
    band.fontSize,
    font,
    band.color,
    band.maxWidth
  )
}

/** Field 5 — grant date (left aligned) */
function drawIssuedDateField(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  font: PDFFont
) {
  const field = MEMBERSHIP_TEMPLATE_LAYOUT.issuedDate
  const color = parseRgb(field.color)
  const size = field.fontSize
  page.drawText(data.issuedAt.toUpperCase(), {
    x: scaleX(imgWidth, field.x),
    y: imgHeight - scaleY(imgHeight, field.top) - size * 0.2,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  })
}

export function drawCalibratedMembershipFields(
  page: PDFPage,
  data: MembershipPdfInput,
  imgWidth: number,
  imgHeight: number,
  fonts: { regular: PDFFont; bold: PDFFont }
) {
  drawCertCodeField(page, data, imgWidth, imgHeight, fonts.bold)
  drawMemberNameField(page, data, imgWidth, imgHeight, fonts.bold)
  drawPackageField(page, data, imgWidth, imgHeight, fonts.bold)
  drawTrainingField(page, data, imgWidth, imgHeight, fonts.regular)
  drawIssuedDateField(page, data, imgWidth, imgHeight, fonts.regular)
}
