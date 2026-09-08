export function getMembershipShortUrl(membershipNo: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/m/${encodeURIComponent(membershipNo)}`
}

export function getMembershipDashboardUrl(membershipId: string) {
  return `/dashboard/membership/${membershipId}`
}

export function getMembershipShortcodeValue(
  shortcode: string,
  data: {
    memberName: string
    membershipNo: string
    packageTitle: string
    level?: string
    courseCount?: number
    duration?: string
    issuedDate?: string
    expiresDate?: string
  }
): string {
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
      return data.courseCount != null ? String(data.courseCount) : ""
    case "duration":
      return data.duration ?? ""
    case "issued_date":
      return data.issuedDate ?? ""
    case "expires_date":
      return data.expiresDate ?? ""
    default:
      return ""
  }
}
