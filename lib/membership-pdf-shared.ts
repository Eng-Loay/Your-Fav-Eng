export interface MembershipPdfInput {
  memberName: string
  membershipNo: string
  packageTitle: string
  level?: string
  courseCount: number
  duration: string
  issuedAt: string
  expiresAt?: string
}

export interface MembershipTemplateInput {
  imageUrl?: string | null
  overlayFields?: string | null
}

export function getMembershipShortcodeValue(shortcode: string, data: MembershipPdfInput): string {
  switch (shortcode) {
    case "member_name":
      return data.memberName
    case "membership_no":
      return data.membershipNo
    case "package_title":
      return data.packageTitle
    case "level":
      return data.level ?? ""
    case "course_count":
      return String(data.courseCount)
    case "duration":
      return data.duration
    case "issued_date":
      return data.issuedAt
    case "expires_date":
      return data.expiresAt ?? ""
    default:
      return ""
  }
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export function buildMembershipPdfInput(record: {
  membershipNo: string
  memberName?: string
  issuedAt?: string
  expiresAt?: string
  package?: {
    title?: string
    level?: string
    courseCount?: number
    duration?: string
  }
}): MembershipPdfInput {
  const pkg = record.package
  return {
    memberName: record.memberName || "Member",
    membershipNo: record.membershipNo,
    packageTitle: pkg?.title || "Membership",
    level: pkg?.level,
    courseCount: pkg?.courseCount ?? 0,
    duration: pkg?.duration || "Annual",
    issuedAt: formatDate(record.issuedAt || new Date()),
    expiresAt: record.expiresAt ? formatDate(record.expiresAt) : undefined,
  }
}

export const DEFAULT_MEMBERSHIP_TEMPLATE: MembershipTemplateInput = {
  imageUrl: "/brand/certificates/membership-template.png",
  overlayFields: JSON.stringify([
    { id: "1", shortcode: "member_name", x: 50, y: 48.3, fontSize: 28, color: "#1345D6" },
    { id: "2", shortcode: "membership_no", x: 50, y: 28.6, fontSize: 11, color: "#ffffff" },
    { id: "3", shortcode: "package_title", x: 50, y: 65.8, fontSize: 13, color: "#1a1a1a" },
    { id: "4", shortcode: "issued_date", x: 23, y: 86.5, fontSize: 9, color: "#333333" },
    { id: "5", shortcode: "expires_date", x: 23, y: 89, fontSize: 8, color: "#555555" },
  ]),
}

export function isDefaultMembershipTemplateImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return true
  return imageUrl.includes("membership-template.png")
}
