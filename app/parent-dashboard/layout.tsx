"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Globe,
  Bell,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr, getDashboardPath } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { key: "dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", path: "/parent-dashboard", icon: LayoutDashboard },
  { key: "children", labelEn: "My Children", labelAr: "أبنائي", path: "/parent-dashboard/children", icon: Users },
  { key: "progress", labelEn: "Progress", labelAr: "التقدم", path: "/parent-dashboard/progress", icon: TrendingUp },
  { key: "grades", labelEn: "Grades", labelAr: "الدرجات", path: "/parent-dashboard/grades", icon: FileText },
  { key: "attendance", labelEn: "Attendance", labelAr: "الحضور", path: "/parent-dashboard/attendance", icon: Calendar },
  { key: "messages", labelEn: "Messages", labelAr: "الرسائل", path: "/parent-dashboard/messages", icon: MessageSquare },
  { key: "settings", labelEn: "Settings", labelAr: "الإعدادات", path: "/parent-dashboard/settings", icon: Settings },
]

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, setLocale } = useI18n()
  const { user, isLoggedIn, hydrated, logout } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isRTL = dir === "rtl"

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn || !user) {
      router.replace("/login?redirect=/parent-dashboard")
      return
    }
    if (user.role !== "parent") {
      router.replace(getDashboardPath(user.role))
      return
    }
  }, [hydrated, isLoggedIn, user, router])

  if (!hydrated || !isLoggedIn || !user || user.role !== "parent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-[#64748B]">...</div>
      </div>
    )
  }

  const isActive = (path: string) => {
    if (path === "/parent-dashboard") return pathname === "/parent-dashboard"
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <m.div
            whileHover={{ scale: 1.05 }}
            className="relative w-10 h-10 overflow-hidden rounded-2xl shadow-lg shadow-[#EC4899]/15 ring-1 ring-black/5"
          >
            <Image src="/le-logo.png" alt="Eng. Loay Essam" fill className="object-contain bg-white p-1" sizes="40px" />
          </m.div>
          <span className="font-extrabold text-lg text-[#0F172A] tracking-tight">
            {locale === "ar" ? "المهندس لؤي عصام" : "Eng. Loay Essam"}
          </span>
        </Link>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#EC4899]/5 to-[#F472B6]/5 border border-[#EC4899]/10 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-[#EC4899]/20">
            <Image src={user?.avatar || "/user-avatar.png"} alt={safeStr(user?.name)} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-[#0F172A] truncate">
              {safeStr(user?.name, locale === "ar" ? "ولي الأمر" : "Parent")}
            </p>
            <p className="text-xs text-[#64748B]">{locale === "ar" ? "ولي أمر" : "Parent"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {sidebarItems.map((item, i) => {
          const active = isActive(item.path)
          return (
            <m.div
              key={item.key}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <Link
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#EC4899] text-white shadow-lg shadow-[#EC4899]/25"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    active ? "bg-white/20" : "bg-[#F1F5F9] group-hover:bg-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-[#94A3B8] group-hover:text-[#EC4899]"}`} />
                </div>
                {locale === "ar" ? item.labelAr : item.labelEn}
                {active && (
                  <m.div layoutId="parent-active-indicator" className="ms-auto h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            </m.div>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-[#E2E8F0] pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <LogOut className="w-4 h-4" />
          </div>
          {locale === "ar" ? "تسجيل الخروج" : "Logout"}
        </button>
      </div>
    </div>
  )

  return (
    <div dir={dir} className="min-h-screen bg-[#F8FAFC]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col bg-white border-e border-[#E2E8F0]/60 z-40">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <m.aside
              initial={{ x: isRTL ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 300 : -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl"
              style={{ [isRTL ? "right" : "left"]: 0 }}
            >
              <SidebarContent />
            </m.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:ms-[280px]">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-[#E2E8F0]/60">
          <div className="flex items-center justify-between px-6 h-[72px]">
            <div className="flex items-center gap-4">
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[#F1F5F9] transition-colors"
              >
                <Menu className="w-5 h-5 text-[#0F172A]" />
              </m.button>
              <div>
                <h1 className="text-lg font-bold text-[#0F172A]">
                  {locale === "ar" ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"}
                </h1>
                <p className="text-xs text-[#94A3B8] hidden sm:block">
                  {locale === "ar" ? "تابع تقدم أبنائك" : "Monitor your children's progress"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E2E8F0]/60 bg-[#F8FAFC]/60 text-[#64748B] hover:border-[#EC4899]/20 hover:bg-white hover:text-[#EC4899] transition-all"
              >
                <Bell className="w-[18px] h-[18px]" />
              </m.button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="gap-2 rounded-xl text-[#64748B] hover:text-[#EC4899] hover:bg-[#EC4899]/5"
              >
                <Globe className="w-4 h-4" />
                {locale === "ar" ? "EN" : "عر"}
              </Button>
              <div className="hidden sm:flex items-center gap-2.5 ms-2 rounded-xl border border-[#E2E8F0]/60 bg-[#F8FAFC]/60 px-3 py-1.5">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                  <Image src={user?.avatar || "/user-avatar.png"} alt="" fill className="object-cover" />
                </div>
                <span className="text-sm font-semibold text-[#0F172A] max-w-[100px] truncate">{safeStr(user?.name)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">{children}</main>
      </div>
    </div>
  )
}
