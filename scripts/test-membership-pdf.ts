import { writeFileSync } from "fs"
import { join } from "path"
import { generateMembershipPdfBuffer } from "../lib/membership-pdf-generate"

async function main() {
  const data = {
    memberName: "IAGRCP Student",
    membershipNo: "IAGRCP-2026-100001",
    packageTitle: "Professional Membership",
    level: "Professional",
    courseCount: 6,
    duration: "Annual",
    issuedAt: "28 May 2025",
    expiresAt: "28 May 2026",
  }

  const buffer = await generateMembershipPdfBuffer(data, {
    imageUrl: "/brand/certificates/membership-template.png",
  })

  const outPath = join(process.cwd(), "test-membership-preview.pdf")
  writeFileSync(outPath, buffer)
  console.log(`Wrote ${outPath} (${buffer.length} bytes)`)
  console.log("Fields:", JSON.stringify(data, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
