"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Globe,
  Bell,
  Search,
  Clock,
  Mail,
  Phone,
  ShieldAlert,
  MessageCircle,
  DollarSign,
  Star,
  BarChart3,
  Wallet,
  Library,
  ClipboardList,
  GraduationCap,
  Layers,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr, getDashboardPath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

const sidebarItemsBase = [
  { key: "dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", path: "/teacher-dashboard", icon: LayoutDashboard },
  { key: "courses", labelEn: "My Courses", labelAr: "دوراتي", path: "/teacher-dashboard/courses", icon: BookOpen },
  { key: "classes", labelEn: "My Classes", labelAr: "صفوفي", path: "/teacher-dashboard/classes", icon: Layers },
  { key: "students", labelEn: "Students", labelAr: "الطلاب", path: "/teacher-dashboard/students", icon: Users },
  { key: "content-bank", labelEn: "Content Bank", labelAr: "بنك المحتوى", path: "/teacher-dashboard/content-bank", icon: Library },
  { key: "question-bank", labelEn: "Question Bank", labelAr: "بنك الأسئلة", path: "/teacher-dashboard/question-bank", icon: ClipboardList },
  { key: "assignments", labelEn: "Assignments", labelAr: "الواجبات", path: "/teacher-dashboard/assignments", icon: FileText },
  { key: "comprehensive-exams", labelEn: "Comprehensive Exams", labelAr: "امتحانات شاملة", path: "/teacher-dashboard/comprehensive-exams", icon: GraduationCap },
  { key: "revenue", labelEn: "Revenue", labelAr: "الإيرادات", path: "/teacher-dashboard/revenue", icon: DollarSign },
  { key: "wallet", labelEn: "Wallet", labelAr: "المحفظة", path: "/teacher-dashboard/wallet", icon: Wallet },
  { key: "reviews", labelEn: "Reviews", labelAr: "التقييمات", path: "/teacher-dashboard/reviews", icon: Star },
  { key: "analytics", labelEn: "Analytics", labelAr: "التحليلات", path: "/teacher-dashboard/analytics", icon: BarChart3 },
  { key: "messages", labelEn: "Messages", labelAr: "الرسائل", path: "/teacher-dashboard/messages", icon: MessageSquare },
  { key: "communities", labelEn: "Communities", labelAr: "الكوميونتي", path: "/teacher-dashboard/communities", icon: MessageCircle },
  { key: "settings", labelEn: "Settings", labelAr: "الإعدادات", path: "/teacher-dashboard/settings", icon: Settings },
]

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, setLocale } = useI18n()
  const { user, isLoggedIn, hydrated, logout, refreshUser } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [chatEnabled, setChatEnabled] = useState(true)
  const [supportInfo, setSupportInfo] = useState<{ support_email?: string; support_phone?: string; platform_name?: string }>({})
  const isRTL = dir === "rtl"
  const isPendingReview = user?.verified === false

  useEffect(() => {
    fetch(`${API_BASE}/settings/chat-status`)
      .then((r) => r.json())
      .then((json) => setChatEnabled(json?.enabled !== false))
      .catch(() => setChatEnabled(true))
    const onToggle = () => setChatEnabled(localStorage.getItem("lms_chat_enabled") !== "false")
    window.addEventListener("chat-toggle", onToggle)
    return () => window.removeEventListener("chat-toggle", onToggle)
  }, [])

  const sidebarItems = chatEnabled
    ? sidebarItemsBase
    : sidebarItemsBase.filter((i) => i.key !== "messages" && i.key !== "communities")

  const { data: statsData } = useApi(() => api.getTeacherDashboardStats())
  const stats = statsData as any

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn || !user) {
      router.replace("/login?redirect=/teacher-dashboard")
      return
    }
    if (user.role !== "teacher") {
      router.replace(getDashboardPath(user.role))
      return
    }
  }, [hydrated, isLoggedIn, user, router])

  // While pending review, poll for approval so the gate clears on its own — no need to log out and back in.
  useEffect(() => {
    if (!isPendingReview) return
    const interval = setInterval(() => { refreshUser() }, 15000)
    return () => clearInterval(interval)
  }, [isPendingReview, refreshUser])

  useEffect(() => {
    if (isPendingReview) {
      api.request("/settings/support-info").then((res) => {
        if (res.success && res.data) setSupportInfo(res.data as any)
      }).catch(() => {})
    }
  }, [isPendingReview])

  if (!hydrated || !isLoggedIn || !user || user.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-[#64748B]">...</div>
      </div>
    )
  }

  const isActive = (path: string) => {
    if (path === "/teacher-dashboard") return pathname === "/teacher-dashboard"
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
            className="relative w-10 h-10 overflow-hidden rounded-2xl shadow-lg shadow-[#8B5CF6]/15 ring-1 ring-black/5"
          >
            <Image src="/le-logo.png" alt="Eng. Loay Essam" fill className="object-contain bg-white p-1" sizes="40px" />
          </m.div>
          <span className="font-extrabold text-lg text-[#0F172A] tracking-tight">
            {locale === "ar" ? "المهندس لؤي عصام" : "Eng. Loay Essam"}
          </span>
        </Link>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 border border-[#8B5CF6]/10 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-[#8B5CF6]/20">
            <Image src={user?.avatar || "/user-avatar.png"} alt={safeStr(user?.name)} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-[#0F172A] truncate">
              {safeStr(user?.name, locale === "ar" ? "المعلم" : "Teacher")}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GraduationCap className="w-3 h-3 text-[#8B5CF6]" />
              <span className="text-xs text-[#8B5CF6] font-semibold">
                {locale === "ar" ? "معلم" : "Teacher"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/80 p-2 text-center">
            <p className="text-sm font-extrabold text-[#0F172A]">{Number(stats?.totalCourses ?? stats?.totalClasses ?? 0) || 0}</p>
            <p className="text-[10px] text-[#94A3B8]">{locale === "ar" ? "دورات" : "Courses"}</p>
          </div>
          <div className="rounded-lg bg-white/80 p-2 text-center">
            <p className="text-sm font-extrabold text-[#0F172A]">{Number(stats?.totalStudents ?? 0) || 0}</p>
            <p className="text-[10px] text-[#94A3B8]">{locale === "ar" ? "طلاب" : "Students"}</p>
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
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    active ? "bg-white/20" : "bg-[#F1F5F9] group-hover:bg-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-[#94A3B8] group-hover:text-[#8B5CF6]"}`} />
                </div>
                {locale === "ar" ? item.labelAr : item.labelEn}
                {active && (
                  <m.div layoutId="teacher-active-indicator" className="ms-auto h-2 w-2 rounded-full bg-white" />
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
              <div className="hidden sm:flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-4 py-2.5 w-[320px]">
                <Search className="w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={locale === "ar" ? "بحث في الدورات والطلاب..." : "Search courses, students..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-[#E2E8F0]/60 bg-[#F8FAFC]/60 text-[#64748B] hover:border-[#8B5CF6]/20 hover:bg-white hover:text-[#8B5CF6] transition-all"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-[#8B5CF6] text-[9px] text-white font-bold flex items-center justify-center">3</span>
              </m.button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="gap-2 rounded-xl text-[#64748B] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5"
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

        {isPendingReview ? (
          <div className="relative p-5 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
            <div className="pointer-events-none select-none blur-[6px] opacity-40">
              {children}
            </div>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm lg:ms-[280px]">
              <m.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-4 w-full max-w-lg"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-8 shadow-2xl shadow-black/5">
                  <div className="pointer-events-none absolute -top-20 -end-20 h-40 w-40 rounded-full bg-amber-500/5 blur-[60px]" />
                  <div className="pointer-events-none absolute -bottom-20 -start-20 h-40 w-40 rounded-full bg-violet-500/5 blur-[60px]" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                      <m.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-lg shadow-amber-500/10"
                      >
                        <Clock className="h-10 w-10 text-amber-600" />
                      </m.div>
                    </div>

                    <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-2">
                      {locale === "ar" ? "حسابك قيد المراجعة" : "Account Under Review"}
                    </h2>
                    <p className="text-center text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
                      {locale === "ar"
                        ? "نقوم بمراجعة حسابك للتأكد من هويتك. سيتم إشعارك فور اعتماد الحساب."
                        : "We're reviewing your account to verify your identity. You'll be notified once approved."}
                    </p>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-bold text-slate-900">
                          {locale === "ar" ? "حالة الحساب" : "Account Status"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                          <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-700">
                            {locale === "ar" ? "قيد المراجعة" : "Pending Review"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {locale === "ar" ? "يستغرق عادة 24-48 ساعة" : "Usually takes 24-48 hours"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-900 mb-2">
                        {locale === "ar" ? "تواصل مع الدعم" : "Contact Support"}
                      </p>
                      <a
                        href={`mailto:${supportInfo.support_email || "support@platform.com"}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/50 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</p>
                          <p className="text-sm font-semibold text-slate-700">{supportInfo.support_email || "support@platform.com"}</p>
                        </div>
                      </a>
                      <a
                        href={`tel:${supportInfo.support_phone || ""}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-all hover:border-green-200 hover:bg-green-50/50 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">{locale === "ar" ? "رقم الهاتف" : "Phone"}</p>
                          <p className="text-sm font-semibold text-slate-700" dir="ltr">{supportInfo.support_phone || "+1 (555) 000-0000"}</p>
                        </div>
                      </a>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link href="/" className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl h-11 text-sm font-semibold">
                          {locale === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
                        </Button>
                      </Link>
                      <a href={`mailto:${supportInfo.support_email || "support@platform.com"}`} className="flex-1">
                        <Button className="w-full rounded-xl h-11 text-sm font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {locale === "ar" ? "تواصل معنا" : "Contact Us"}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </m.div>
            </div>
          </div>
        ) : (
          <main className="p-5 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">{children}</main>
        )}
      </div>
    </div>
  )
}
