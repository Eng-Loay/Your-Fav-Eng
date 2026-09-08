import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Use /api/membership/admin/templates" },
    { status: 410 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: "Use /api/membership/admin/templates" },
    { status: 410 }
  )
}
