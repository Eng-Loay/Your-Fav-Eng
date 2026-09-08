import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Student / default learner — not staff dashboards */
export function isLearnerRole(role?: string): boolean {
  const r = role?.toLowerCase()
  return !r || r === "student"
}

export function getNavDashboardLabelKey(role?: string): string {
  return isLearnerRole(role) ? "nav.myLearning" : "nav.dashboard"
}

/** Get dashboard path based on user role */
export function getDashboardPath(role?: string): string {
  switch (role?.toLowerCase()) {
    case "admin": return "/admin"
    case "teacher": return "/teacher-dashboard"
    case "parent": return "/parent-dashboard"
    default: return "/dashboard"
  }
}

/** Get "My Courses" / courses list path based on role */
export function getMyCoursesPath(role?: string): string {
  switch (role?.toLowerCase()) {
    case "teacher": return "/teacher-dashboard/classes"
    case "parent": return "/parent-dashboard/children"
    default: return "/dashboard/courses"
  }
}

/** Build full URL for product file download (handles data URLs, full URLs, relative paths) */
export function getProductFileUrl(fileUrl: string | undefined | null): string {
  if (!fileUrl) return ""
  if (fileUrl.startsWith("http") || fileUrl.startsWith("data:")) return fileUrl
  const base = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:5001/api"
  const origin = base.replace(/\/api\/?$/, "")
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`
  return `${origin}${path}`
}

function getBackendOrigin(): string {
  const envUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined
  if (envUrl) {
    if (envUrl.startsWith("/")) {
      if (typeof window !== "undefined") return window.location.origin
      return ""
    }
    return envUrl.replace(/\/api\/?$/, "")
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (host !== "localhost" && host !== "127.0.0.1") return window.location.origin
    return `http://${host}:5001`
  }
  return "http://localhost:5001"
}

/** Resolve media for UI: /uploads from API server; /brand and other public paths from Next.js */
export function resolveMediaUrl(url: string | null | undefined, fallback = ""): string {
  if (!url) return fallback
  const raw = url.trim()
  if (!raw) return fallback
  if (raw.includes("unsplash.com")) return fallback
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  const path = raw.startsWith("/") ? raw : `/${raw}`
  if (path.startsWith("/uploads/")) return `${getBackendOrigin()}${path}`
  return path
}

/** Resolve image/avatar URL to be usable in <img>/<Image> src. */
export function resolveImageUrl(url: string | null | undefined, fallback = ""): string {
  return resolveMediaUrl(url, fallback)
}

/**
 * Downscale/compress an image file in the browser before upload.
 * Real phone camera photos (often several MB) can exceed the serverless
 * function request-body limit, which silently fails the upload. Avatars
 * never need more than a few hundred KB, so shrink to maxDim on the
 * longest side and re-encode as JPEG.
 */
export async function compressImageFile(file: File, maxDim = 800, quality = 0.85): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!blob || blob.size >= file.size) return file
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], newName, { type: "image/jpeg" })
  } catch {
    return file
  }
}

/** Safely convert value to string for React rendering (handles {id, name}, {id, name, email}, etc.) */
export function safeStr(val: unknown, fallback = ""): string {
  if (val == null) return fallback
  if (typeof val === "string") return val
  if (typeof val === "number" || typeof val === "boolean") return String(val)
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>
    if (typeof o.name === "string") return o.name
    if (typeof o.email === "string") return o.email
  }
  return fallback
}
