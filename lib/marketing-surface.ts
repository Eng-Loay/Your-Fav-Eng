const EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/instructor-dashboard",
  "/parent-dashboard",
  "/teacher-dashboard",
  "/learning",
] as const

/**
 * True for public marketing pages. False for dashboards and the learning player.
 */
export function isMarketingSurfacePath(pathname: string | null): boolean {
  if (!pathname) return true
  return !EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
