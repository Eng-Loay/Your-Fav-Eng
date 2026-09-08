const POSTER = "/brand/loay/poster-programming-ai.png"

/**
 * Professional local course covers (no external CDN).
 */
export const LOCAL_COURSE_THUMBNAILS = {
  grcFundamentals: POSTER,
  riskEssentials: POSTER,
  compliance: POSTER,
  audit: POSTER,
  governance: POSTER,
  iso31000: POSTER,
  regulatory: POSTER,
  leadership: POSTER,
} as const

export const FEATURED_COURSE_FALLBACKS = [
  LOCAL_COURSE_THUMBNAILS.grcFundamentals,
  LOCAL_COURSE_THUMBNAILS.riskEssentials,
  LOCAL_COURSE_THUMBNAILS.compliance,
] as const

export const MEMBERSHIP_PACKAGE_IMAGES: Record<string, string> = {
  Associate: POSTER,
  Professional: POSTER,
  Fellow: POSTER,
}

const PACKAGE_ID_IMAGES: Record<string, string> = {
  "pkg-associate": MEMBERSHIP_PACKAGE_IMAGES.Associate,
  "pkg-professional": MEMBERSHIP_PACKAGE_IMAGES.Professional,
  "pkg-fellow": MEMBERSHIP_PACKAGE_IMAGES.Fellow,
  "1": MEMBERSHIP_PACKAGE_IMAGES.Associate,
  "2": MEMBERSHIP_PACKAGE_IMAGES.Professional,
  "3": MEMBERSHIP_PACKAGE_IMAGES.Fellow,
}

const COURSE_SLUG_THUMBNAILS: Record<string, string> = {
  "grc-fundamentals": LOCAL_COURSE_THUMBNAILS.grcFundamentals,
  "risk-management-essentials": LOCAL_COURSE_THUMBNAILS.riskEssentials,
  "compliance-frameworks": LOCAL_COURSE_THUMBNAILS.compliance,
  "internal-audit-basics": LOCAL_COURSE_THUMBNAILS.audit,
  "corporate-governance": LOCAL_COURSE_THUMBNAILS.governance,
  "iso-31000-risk": LOCAL_COURSE_THUMBNAILS.iso31000,
  "regulatory-compliance": LOCAL_COURSE_THUMBNAILS.regulatory,
  "advanced-grc-leadership": LOCAL_COURSE_THUMBNAILS.leadership,
}

export function getCourseThumbnailBySlug(slug?: string | null): string | undefined {
  if (!slug) return undefined
  return COURSE_SLUG_THUMBNAILS[slug]
}

export function getMembershipPackageImage(pkg: {
  id?: string
  level?: string | null
  image?: string | null
}): string {
  const image = pkg.image?.trim()
  if (image && image.startsWith("/")) return image
  if (image && !image.includes("unsplash.com")) return image
  if (pkg.id && PACKAGE_ID_IMAGES[pkg.id]) return PACKAGE_ID_IMAGES[pkg.id]
  if (pkg.level && MEMBERSHIP_PACKAGE_IMAGES[pkg.level]) {
    return MEMBERSHIP_PACKAGE_IMAGES[pkg.level]
  }
  return MEMBERSHIP_PACKAGE_IMAGES.Associate
}

export function resolveLocalCourseThumbnail(
  thumbnail?: string | null,
  fallback = LOCAL_COURSE_THUMBNAILS.grcFundamentals,
  slug?: string | null
): string {
  const raw = thumbnail?.trim()
  if (raw && (raw.startsWith("data:") || raw.startsWith("blob:"))) return raw
  if (raw && /^https?:\/\//i.test(raw) && !raw.includes("unsplash.com")) return raw
  if (raw && raw.startsWith("/") && !raw.includes("unsplash.com")) return raw
  if (slug) {
    const bySlug = getCourseThumbnailBySlug(slug)
    if (bySlug) return bySlug
  }
  if (!raw || raw.includes("unsplash.com")) return fallback
  return raw.startsWith("/") ? raw : `/${raw}`
}
