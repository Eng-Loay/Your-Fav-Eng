import {
  buildMembershipPdfInput,
  DEFAULT_MEMBERSHIP_TEMPLATE,
  type MembershipTemplateInput,
} from "@/lib/membership-pdf-shared"

type DevMembershipRecord = {
  id: string
  membershipNo: string
  issuedAt: string
  expiresAt: string
  memberName?: string
  template?: MembershipTemplateInput
  package: {
    title: string
    titleAr?: string
    level: string
    courseCount: number
    duration: string
  }
}

const DEV_MEMBERSHIPS: DevMembershipRecord[] = [
  {
    id: "mem-1",
    membershipNo: "IAGRCP-2026-100001",
    memberName: "IAGRCP Student",
    issuedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 335 * 86400000).toISOString(),
    template: DEFAULT_MEMBERSHIP_TEMPLATE,
    package: {
      title: "Professional Membership",
      titleAr: "عضوية محترف",
      level: "Professional",
      courseCount: 6,
      duration: "Annual",
    },
  },
]

export function getDevMembershipForPdf(
  id?: string | null,
  membershipNo?: string | null,
  memberName?: string | null
) {
  const byId = id ? DEV_MEMBERSHIPS.find((item) => item.id === id) : undefined
  const byNo = membershipNo
    ? DEV_MEMBERSHIPS.find((item) => item.membershipNo === membershipNo)
    : undefined

  const record = byId || byNo
  if (!record) return null

  return {
    input: buildMembershipPdfInput({
      ...record,
      memberName: memberName?.trim() || record.memberName,
    }),
    template: record.template ?? DEFAULT_MEMBERSHIP_TEMPLATE,
  }
}
