import { NextRequest, NextResponse } from "next/server"
import {
  readMembershipTemplateFile,
  writeMembershipTemplateFile,
} from "@/lib/membership-template-file-store"

export async function GET() {
  const template = readMembershipTemplateFile()
  return NextResponse.json({ success: true, data: [template] })
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const template = writeMembershipTemplateFile({
      id: typeof body.id === "string" ? body.id : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      nameAr: typeof body.nameAr === "string" ? body.nameAr : undefined,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      overlayFields:
        typeof body.overlayFields === "string" ? body.overlayFields : undefined,
      isDefault: body.isDefault === false ? false : true,
    })
    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save template"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
