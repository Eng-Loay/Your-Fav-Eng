"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { useI18n } from "@/lib/i18n"
import { useMarketingSurface } from "@/components/providers/MarketingSurfaceProvider"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

function GridIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 18L9 13L13 16L20 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="6" r="1.8" fill="currentColor" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 4C2 4 5 2 8 2C11 2 12 4 12 4V20C12 20 11 19 8 19C5 19 2 20 2 20V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4C22 4 19 2 16 2C13 2 12 4 12 4V20C12 20 13 19 16 19C19 19 22 20 22 20V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20C5 17.2386 8.13401 15 12 15C15.866 15 19 17.2386 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 7V6C6 3.79086 7.79086 2 10 2H14C16.2091 2 18 3.79086 18 6V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.69 11.4C3.36 9.09 3.19 7.94 3.91 7.22C4.11 7.02 4.35 6.87 4.6 6.76C5.5 6.39 6.6 7.03 8.79 8.31L9.5 8.73C10.82 9.5 11.48 9.89 12.22 9.89C12.96 9.89 13.62 9.5 14.94 8.73L15.65 8.31C17.84 7.03 18.94 6.39 19.84 6.76C20.09 6.87 20.33 7.02 20.53 7.22C21.25 7.94 21.08 9.09 20.75 11.4L20.28 14.6C19.86 17.46 19.65 18.89 18.56 19.69C17.47 20.5 15.97 20.5 12.97 20.5H11.47C8.47 20.5 6.97 20.5 5.88 19.69C4.79 18.89 4.58 17.46 4.16 14.6L3.69 11.4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

const navItems = [
  {
    key: "home",
    href: "/",
    labelAr: "الرئيسية",
    labelEn: "Home",
    matchPaths: ["/"],
  },
  {
    key: "cart",
    href: "/cart",
    labelAr: "السلة",
    labelEn: "Cart",
    matchPaths: ["/cart", "/checkout"],
    hideOnMds: true,
  },
  {
    key: "courses",
    href: "/courses",
    labelAr: "الدورات",
    labelEn: "Courses",
    matchPaths: ["/courses"],
    isCenter: true,
  },
  {
    key: "services",
    href: "/services",
    labelAr: "الخدمات",
    labelEn: "Services",
    matchPaths: ["/services"],
    mdsOnly: true,
  },
  {
    key: "myCourses",
    href: "/dashboard/courses",
    labelAr: "دوراتي",
    labelEn: "My Courses",
    matchPaths: ["/dashboard/courses", "/learning"],
    hideOnMds: true,
  },
  {
    key: "account",
    href: "/dashboard",
    labelAr: "حسابي",
    labelEn: "Account",
    matchPaths: ["/dashboard", "/login", "/register"],
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const isMds = useMarketingSurface()
  const { locale } = useI18n()
  const { isLoggedIn, cartCount, user } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const effectiveLocale = mounted ? locale : "en"

  const hiddenPaths = ["/learning", "/login", "/register", "/forgot-password"]
  const shouldHide = hiddenPaths.some((p) => pathname?.startsWith(p))
  if (shouldHide) return null

  const visibleItems = navItems.filter((item) => {
    if (isMds && item.hideOnMds) return false
    if (!isMds && item.mdsOnly) return false
    return true
  })

  const getHref = (item: (typeof navItems)[0]) => {
    if ((item.key === "account" || item.key === "myCourses") && (!mounted || !isLoggedIn)) return "/login"
    if (mounted && isLoggedIn && user?.role === "parent") {
      if (item.key === "account") return "/parent-dashboard"
      if (item.key === "myCourses") return "/parent-dashboard/children"
    }
    return item.href
  }

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.key === "home") return pathname === "/"
    if (item.key === "account") {
      if (user?.role === "parent") return pathname === "/parent-dashboard" || pathname?.startsWith("/parent-dashboard")
      return pathname === "/dashboard" || pathname === "/dashboard/profile" || pathname === "/dashboard/billing"
    }
    if (item.key === "myCourses" && user?.role === "parent") return pathname?.startsWith("/parent-dashboard")
    if (item.key === "services") return pathname?.startsWith("/services")
    return item.matchPaths.some((p) => pathname?.startsWith(p))
  }

  const renderIcon = (key: string, active: boolean, isCenter: boolean) => {
    const size = isCenter ? "h-[26px] w-[26px]" : "h-[21px] w-[21px]"
    const accent = isMds ? "text-mds-primary" : "text-medex-red"
    const cls = cn(size, isCenter ? "text-white" : active ? accent : "text-gray-400")
    switch (key) {
      case "home": return <GridIcon className={cls} active={active} />
      case "courses": return <ChartIcon className={cls} />
      case "myCourses": return <BookIcon className={cls} />
      case "account": return <UserIcon className={cls} />
      case "cart": return <BagIcon className={cls} />
      case "services": return <ChartIcon className={cls} />
      default: return null
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden pointer-events-none">
      <nav
        className="pointer-events-auto px-4 pb-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)" }}
      >
        <div
          className="relative mx-auto max-w-[420px] rounded-[20px]"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="absolute inset-x-4 top-0 h-[0.5px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)" }}
          />

          <div className="relative flex items-end justify-between px-3 py-2.5">
            {visibleItems.map((item) => {
              const active = isActive(item)
              const href = getHref(item)

              if (item.isCenter) {
                return (
                  <Link
                    key={item.key}
                    href={href}
                    className="relative flex flex-col items-center"
                    style={{ marginTop: "-26px" }}
                  >
                    <m.div
                      whileTap={{ scale: 0.92 }}
                      className="flex h-[54px] w-[54px] items-center justify-center rounded-[16px]"
                        style={{
                        background: isMds
                          ? "linear-gradient(145deg, #0B2F8C 0%, #1345D6 100%)"
                          : "linear-gradient(145deg, #EB2D3C 0%, #d42535 100%)",
                        boxShadow: isMds
                          ? "0 8px 20px rgba(139,26,26,0.3), 0 2px 6px rgba(139,26,26,0.2)"
                          : "0 8px 20px rgba(235,45,60,0.3), 0 2px 6px rgba(235,45,60,0.2)",
                      }}
                    >
                      {renderIcon(item.key, active, true)}
                    </m.div>
                    <span className={cn(
                      "mt-[5px] text-[10px] font-bold leading-none",
                      active ? (isMds ? "text-mds-primary" : "text-medex-red") : "text-gray-400"
                    )}>
                      {effectiveLocale === "ar" ? item.labelAr : item.labelEn}
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.key}
                  href={href}
                  className="relative flex flex-col items-center min-w-[52px] py-0.5"
                >
                  <m.div whileTap={{ scale: 0.85 }} className="relative flex flex-col items-center">
                    {active && (
                      <m.div
                        layoutId="bottomNavActivePill"
                        className="absolute -inset-x-2.5 -top-1.5 -bottom-1 rounded-[14px]"
                        style={{
                          background: isMds ? "rgba(187, 0, 35, 0.08)" : "rgba(235, 45, 60, 0.08)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="relative z-10">
                      {renderIcon(item.key, active, false)}
                      {item.key === "cart" && mounted && cartCount > 0 && (
                        <span
                          className={cn(
                            "absolute -top-1 -end-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white ring-2 ring-white",
                            isMds ? "bg-mds-primary" : "bg-medex-red"
                          )}
                        >
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "relative z-10 mt-[5px] text-[10px] font-bold leading-none",
                      active ? (isMds ? "text-mds-primary" : "text-medex-red") : "text-gray-400"
                    )}>
                      {effectiveLocale === "ar" ? item.labelAr : item.labelEn}
                    </span>
                  </m.div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
