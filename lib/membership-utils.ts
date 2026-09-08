export type MembershipRow = {
  id: string
  membershipNo: string
  status?: string
  issuedAt?: string
  expiresAt?: string
  pdfUrl?: string
  package?: {
    id?: string
    title?: string
    titleAr?: string
    level?: string
    courseCount?: number
    duration?: string
  }
  packageId?: string
}

export function parseMembershipList(raw: unknown): MembershipRow[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : []

  return list
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const m = item as Record<string, unknown>
      const pkg = m.package as MembershipRow["package"] | undefined
      return {
        id: String(m.id ?? ""),
        membershipNo: String(m.membershipNo ?? ""),
        status: m.status as string | undefined,
        issuedAt: m.issuedAt as string | undefined,
        expiresAt: m.expiresAt as string | undefined,
        pdfUrl: m.pdfUrl as string | undefined,
        package: pkg,
        packageId: (m.packageId as string) || pkg?.id,
      }
    })
    .filter((m) => m.id && m.membershipNo)
}

export function isActiveMembership(row: MembershipRow, now = Date.now()): boolean {
  const status = String(row.status ?? "ACTIVE").toUpperCase()
  if (status !== "ACTIVE") return false
  if (!row.expiresAt) return true
  return new Date(row.expiresAt).getTime() > now
}

export function getActiveMemberships(raw: unknown): MembershipRow[] {
  return parseMembershipList(raw).filter((row) => isActiveMembership(row))
}

export function hasActiveMembership(raw: unknown): boolean {
  return getActiveMemberships(raw).length > 0
}
