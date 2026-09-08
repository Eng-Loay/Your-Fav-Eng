import { NextRequest, NextResponse } from "next/server"
import { generateMembershipPdfBuffer } from "@/lib/membership-pdf-generate"
import { DEFAULT_MEMBERSHIP_TEMPLATE } from "@/lib/membership-pdf-shared"
import { getDevMembershipForPdf } from "@/lib/membership-dev-pdf"
import { readMembershipTemplateFile } from "@/lib/membership-template-file-store"
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
  }

  const membershipId = req.nextUrl.searchParams.get("id")
  const membershipNo = req.nextUrl.searchParams.get("no")
  const memberName = req.nextUrl.searchParams.get("name")

  const payload = getDevMembershipForPdf(membershipId, membershipNo, memberName)
  if (!payload) {
    return NextResponse.json({ success: false, message: "Membership not found" }, { status: 404 })
  }

  const fileTemplate = readMembershipTemplateFile()
  const template = {
    imageUrl: fileTemplate.imageUrl ?? DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
    overlayFields: fileTemplate.overlayFields ?? DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
  }
  const safeName = payload.input.membershipNo.replace(/[^a-zA-Z0-9-]/g, "") || "demo"
  const filename = `membership-${safeName}.pdf`

  try {
    const buffer = await generateMembershipPdfBuffer(payload.input, template)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate membership PDF"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
