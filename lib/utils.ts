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
  if (envUrl) return envUrl.replace(/\/api\/?$/, "")
  if (typeof window !== "undefined") return `http://${window.location.hostname}:5001`
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
