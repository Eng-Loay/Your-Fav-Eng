import {
  DEFAULT_MEMBERSHIP_TEMPLATE,
  type MembershipTemplateInput,
} from "@/lib/membership-pdf-shared"

const STORAGE_KEY = "lms_dev_membership_template_v3"
const LEGACY_KEYS = ["lms_dev_membership_template_v2", "lms_dev_membership_template_v1"]
const COOKIE_KEY = "lms_dev_membership_template_v3"

export type StoredMembershipTemplate = MembershipTemplateInput & {
  id?: string
  name?: string
  nameAr?: string
  isDefault?: boolean
}

function parseStored(raw: string | null | undefined): StoredMembershipTemplate | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredMembershipTemplate
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

function readFromStorage(): StoredMembershipTemplate | null {
  if (typeof window === "undefined") return null

  const current = parseStored(localStorage.getItem(STORAGE_KEY))
  if (current) return current

  for (const key of LEGACY_KEYS) {
    const legacy = parseStored(localStorage.getItem(key))
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
      return legacy
    }
  }

  return null
}

function defaultTemplate(): StoredMembershipTemplate {
  return {
    id: "mtpl-dev",
    name: "IAGRCP Membership Certificate",
    nameAr: "شهادة عضوية IAGRCP",
    imageUrl: DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
    overlayFields: DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
    isDefault: true,
  }
}

export function parseMembershipOverlayFields(raw?: string | null) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMembershipOverlayFields(fields: unknown[]) {
  if (typeof window === "undefined") return
  const current = getDevMembershipTemplate()
  saveDevMembershipTemplate({
    ...current,
    overlayFields: JSON.stringify(fields),
  })
}

export function getDevMembershipTemplate(): StoredMembershipTemplate {
  if (typeof window === "undefined") return defaultTemplate()

  const stored = readFromStorage()
  if (!stored) return defaultTemplate()

  return {
    id: stored.id || "mtpl-dev",
    name: stored.name || "IAGRCP Membership Certificate",
    nameAr: stored.nameAr || "شهادة عضوية IAGRCP",
    imageUrl: stored.imageUrl || DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
    overlayFields: stored.overlayFields || DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
    isDefault: stored.isDefault ?? true,
  }
}

export function saveDevMembershipTemplate(template: StoredMembershipTemplate) {
  if (typeof window === "undefined") return

  const payload: StoredMembershipTemplate = {
    id: template.id || "mtpl-dev",
    name: template.name || "IAGRCP Membership Certificate",
    nameAr: template.nameAr || "شهادة عضوية IAGRCP",
    imageUrl:
      template.imageUrl && !template.imageUrl.startsWith("data:")
        ? template.imageUrl
        : DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
    overlayFields: template.overlayFields || DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
    isDefault: template.isDefault ?? true,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

  try {
    const cookieValue = encodeURIComponent(
      JSON.stringify({
        imageUrl: payload.imageUrl,
        overlayFields: payload.overlayFields,
      })
    )
    if (cookieValue.length < 3800) {
      document.cookie = `${COOKIE_KEY}=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`
    }
  } catch {
    // Cookie is optional; localStorage is the source of truth.
  }
}

export function getDevMembershipTemplateFromCookie(
  cookieHeader: string | null | undefined
): MembershipTemplateInput {
  if (!cookieHeader) return DEFAULT_MEMBERSHIP_TEMPLATE

  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`))
  if (!match?.[1]) return DEFAULT_MEMBERSHIP_TEMPLATE

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as MembershipTemplateInput
    return {
      imageUrl: parsed.imageUrl || DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
      overlayFields: parsed.overlayFields || DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
    }
  } catch {
    return DEFAULT_MEMBERSHIP_TEMPLATE
  }
}
