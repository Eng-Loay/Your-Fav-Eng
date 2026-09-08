import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { existsSync, readFileSync } from "fs"
import path from "path"
import {
  getMembershipShortcodeValue,
  isDefaultMembershipTemplateImage,
  type MembershipPdfInput,
  type MembershipTemplateInput,
} from "@/lib/membership-pdf-shared"
import { drawCalibratedMembershipFields } from "@/lib/membership-pdf-calibrated"

export type { MembershipPdfInput, MembershipTemplateInput } from "@/lib/membership-pdf-shared"
export {
  buildMembershipPdfInput,
  DEFAULT_MEMBERSHIP_TEMPLATE,
  getMembershipShortcodeValue,
  isDefaultMembershipTemplateImage,
} from "@/lib/membership-pdf-shared"

type OverlayField = {
  shortcode: string
  x: number
  y: number
  fontSize: number
  color: string
}

function parseRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  }
}

function resolveTemplatePath(): string {
  const candidates = [
    path.join(process.cwd(), "public", "brand", "certificates", "membership-template.png"),
    path.join(process.cwd(), "backend", "assets", "brand", "certificates", "membership-template.png"),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error("Membership certificate template not found")
}

function loadLocalImage(imageUrl: string): { buffer: Buffer; isPng: boolean } {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:image\/([a-z]+);base64,(.+)$/i)
    if (!match) throw new Error("Invalid data URL")
    return {
      buffer: Buffer.from(match[2], "base64"),
      isPng: match[1].toLowerCase() === "png",
    }
  }

  const relative = imageUrl.replace(/^\//, "")
  const candidates = [
    path.join(process.cwd(), "public", relative),
    path.join(process.cwd(), "backend", "uploads", relative.replace(/^uploads\//, "")),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const buffer = readFileSync(candidate)
      const ext = path.extname(candidate).toLowerCase()
      return { buffer, isPng: ext === ".png" }
    }
  }

  throw new Error(`Template image not found: ${imageUrl}`)
}

async function renderOnTemplateImage(
  data: MembershipPdfInput,
  buffer: Buffer,
  isPng: boolean,
  useCalibrated: boolean
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const image = isPng ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer)

  const imgWidth = image.width
  const imgHeight = image.height
  const page = pdfDoc.addPage([imgWidth, imgHeight])
  page.drawImage(image, { x: 0, y: 0, width: imgWidth, height: imgHeight })

  if (useCalibrated) {
    drawCalibratedMembershipFields(page, data, imgWidth, imgHeight, {
      regular: helvetica,
      bold: helveticaBold,
    })
    return Buffer.from(await pdfDoc.save())
  }

  return Buffer.from(await pdfDoc.save())
}

async function generateStaticPdf(data: MembershipPdfInput): Promise<Buffer> {
  const templatePath = resolveTemplatePath()
  const imageBytes = readFileSync(templatePath)
  return renderOnTemplateImage(data, imageBytes, true, true)
}

async function generateCustomTemplatePdf(
  data: MembershipPdfInput,
  template: MembershipTemplateInput,
  buffer: Buffer,
  isPng: boolean
): Promise<Buffer> {
  let overlayFields: OverlayField[] = []
  if (template.overlayFields) {
    try {
      overlayFields = JSON.parse(template.overlayFields) as OverlayField[]
    } catch {
      overlayFields = []
    }
  }

  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const image = isPng ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer)

  const imgWidth = image.width
  const imgHeight = image.height
  const page = pdfDoc.addPage([imgWidth, imgHeight])
  page.drawImage(image, { x: 0, y: 0, width: imgWidth, height: imgHeight })

  for (const field of overlayFields) {
    let text = getMembershipShortcodeValue(field.shortcode, data) || "-"
    if (
      field.shortcode === "member_name" ||
      field.shortcode === "package_title" ||
      field.shortcode === "membership_no"
    ) {
      text = text.toUpperCase()
    }

    const color = parseRgb(field.color)
    const pdfX = (field.x / 100) * imgWidth
    const topFromTop = (field.y / 100) * imgHeight
    const pdfY = imgHeight - topFromTop - field.fontSize * 0.72
    const font =
      field.shortcode === "member_name" || field.shortcode === "package_title"
        ? helveticaBold
        : helvetica
    const textWidth = font.widthOfTextAtSize(text, field.fontSize)
    const centeredX =
      field.shortcode === "member_name" || field.shortcode === "package_title"
        ? pdfX - textWidth / 2
        : pdfX

    page.drawText(text, {
      x: centeredX,
      y: pdfY,
      size: field.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    })
  }

  return Buffer.from(await pdfDoc.save())
}

function overlayMatchesDefault(overlayFields?: string | null): boolean {
  if (!overlayFields) return true
  try {
    const fields = JSON.parse(overlayFields)
    const defaults = JSON.parse(DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields ?? "[]")
    return JSON.stringify(fields) === JSON.stringify(defaults)
  } catch {
    return false
  }
}

async function generateTemplatePdf(
  data: MembershipPdfInput,
  template: MembershipTemplateInput
): Promise<Buffer> {
  if (!template.imageUrl) return generateStaticPdf(data)

  const { buffer, isPng } = loadLocalImage(template.imageUrl)
  const useCalibrated =
    isDefaultMembershipTemplateImage(template.imageUrl) &&
    overlayMatchesDefault(template.overlayFields)

  if (useCalibrated) {
    return renderOnTemplateImage(data, buffer, isPng, true)
  }

  return generateCustomTemplatePdf(data, template, buffer, isPng)
}

export async function generateMembershipPdfBuffer(
  data: MembershipPdfInput,
  template?: MembershipTemplateInput | null
): Promise<Buffer> {
  if (template?.imageUrl) {
    return generateTemplatePdf(data, template)
  }
  return generateStaticPdf(data)
}
