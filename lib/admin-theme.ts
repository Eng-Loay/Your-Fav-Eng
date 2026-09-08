/** IAGRCP admin dashboard — burgundy palette aligned with sidebar/logo */
export const ADMIN_BRAND = {
  primary: "#1345D6",
  primaryDark: "#0B2F8C",
  primaryLight: "#3D74F2",
  surface: "#FAF8F8",
  muted: "#f5e8e8",
} as const

/** Stat card accents — same family, slight variation */
export const ADMIN_STAT_STYLES = [
  { bg: "bg-primary/10", icon: "text-primary", gradient: "from-primary to-[#0B2F8C]" },
  { bg: "bg-[#f5e8e8]", icon: "text-[#0B2F8C]", gradient: "from-[#0B2F8C] to-primary" },
  { bg: "bg-primary/8", icon: "text-primary", gradient: "from-primary to-[#3D74F2]" },
  { bg: "bg-[#f0dede]", icon: "text-[#3D74F2]", gradient: "from-[#3D74F2] to-primary/90" },
] as const

export function adminStatStyle(index: number) {
  return ADMIN_STAT_STYLES[index % ADMIN_STAT_STYLES.length]
}
