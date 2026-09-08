"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePlatformBranding } from "@/hooks/use-platform-branding"
import { usePathname, useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  CreditCard,
  Heart,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  FileQuestion,
  ClipboardList,
  ShoppingBag,
  MessageSquare,
  Users,
  Video,
  Clock,
  ShieldAlert,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { safeStr, getDashboardPath } from "@/lib/utils"
import { hasActiveMembership, getActiveMemberships } from "@/lib/membership-utils"
import { Button } from "@/components/ui/button"

const sidebarItemsBase = [
  { key: "overview", path: "/dashboard", icon: LayoutDashboard, color: "from-primary to-primary/90" },
  { key: "myCourses", path: "/dashboard/courses", icon: BookOpen, color: "from-primary to-primary/90" },
  { key: "liveSessions", path: "/dashboard/live-sessions", icon: Video, color: "from-[#F59E0B] to-[#FBBF24]" },
  { key: "purchases", path: "/dashboard/purchases", icon: ShoppingBag, color: "from-[#10B981] to-[#34D399]" },
  { key: "notifications", path: "/dashboard/notifications", icon: Bell, color: "from-[#F59E0B] to-[#FBBF24]" },
  { key: "assignments", path: "/dashboard/assignments", icon: ClipboardList, color: "from-[#F59E0B] to-[#FBBF24]" },
  { key: "comprehensiveExams", path: "/dashboard/comprehensive-exams", icon: FileQuestion, color: "from-[#8B5CF6] to-[#A78BFA]" },
  { key: "examResults", path: "/dashboard/exam-results", icon: ClipboardList, color: "from-[#6366F1] to-[#818CF8]" },
  { key: "certificates", path: "/dashboard/certificates", icon: Award, color: "from-[#8B5CF6] to-[#A78BFA]" },
  { key: "membership", path: "/dashboard/membership", icon: Award, color: "from-[#0F3D5C] to-[#1a5276]" },
  { key: "messages", path: "/dashboard/messages", icon: MessageSquare, color: "from-[#10B981] to-[#34D399]" },
  { key: "communities", path: "/dashboard/communities", icon: Users, color: "from-[#8B5CF6] to-[#A78BFA]" },
  { key: "profile", path: "/dashboard/profile", icon: User, color: "from-[#F59E0B] to-[#FBBF24]" },
  { key: "billing", path: "/dashboard/billing", icon: CreditCard, color: "from-[#059669] to-[#34D399]" },
  { key: "wishlist", path: "/dashboard/wishlist", icon: Heart, color: "from-[#EC4899] to-[#F472B6]" },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, setLocale, t } = useI18n()
  const { user, isLoggedIn, hydrated, logout, purchasedCourses, refreshUser } = useStore()
  const { branding } = usePlatformBranding()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [supportInfo, setSupportInfo] = useState<{ support_email?: string; support_phone?: string; platform_name?: string }>({})
  const isRTL = dir === "rtl"
  const isPendingReview = user?.status === "pending_review"
  const { data: myMemberships } = useApi<any[]>(() => api.getMyMemberships(), { immediate: isLoggedIn })
  const memberHasAccess = hasActiveMembership(myMemberships)

  const sidebarMembership = React.useMemo(() => {
    const active = getActiveMemberships(myMemberships)
    if (active.length === 0) return null
    const row = active[0]
    const pkg = row.package
    return {
      title: locale === "ar" ? pkg?.titleAr || pkg?.title : pkg?.title,
      level: pkg?.level,
      membershipNo: row.membershipNo,
    }
  }, [myMemberships, locale])

  useEffect(() => {
    fetch(`${API_BASE}/settings/chat-status`)
      .then((r) => r.json())
      .then((json) => setChatEnabled(json?.enabled !== false))
      .catch(() => setChatEnabled(true))
    const onToggle = () => setChatEnabled(localStorage.getItem("lms_chat_enabled") !== "false")
    window.addEventListener("chat-toggle", onToggle)
    return () => window.removeEventListener("chat-toggle", onToggle)
  }, [])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null
    if (!token) return
    const fetchUnread = () => {
      fetch(`${API_BASE}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          const c = json?.data?.count ?? 0
          setUnreadCount(c)
        })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [hydrated, isLoggedIn])

  useEffect(() => {
    if (isPendingReview) {
      api.request("/settings/support-info").then((res) => {
        if (res.success && res.data) setSupportInfo(res.data as any)
      }).catch(() => {})
    }
  }, [isPendingReview])

  // While pending review, poll for approval so the gate clears on its own — no need to log out and back in.
  useEffect(() => {
    if (!isPendingReview) return
    const interval = setInterval(() => { refreshUser() }, 15000)
    return () => clearInterval(interval)
  }, [isPendingReview, refreshUser])

  const sidebarItems = (chatEnabled
    ? sidebarItemsBase
    : sidebarItemsBase.filter((i) => i.key !== "messages" && i.key !== "communities")
  ).filter((item) => item.key !== "membership" || memberHasAccess)

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn || !user) {
      router.replace("/login?redirect=/dashboard")
      return
    }
    const rolePath = getDashboardPath(user.role)
    if (rolePath !== "/dashboard") {
      router.replace(rolePath)
      return
    }
  }, [hydrated, isLoggedIn, user, router])

  if (!hydrated || !isLoggedIn || !user || getDashboardPath(user.role) !== "/dashboard") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-[#64748B]">...</div>
      </div>
    )
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <m.div
            whileHover={{ scale: 1.05 }}
            className="relative w-10 h-10 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 bg-white"
            style={{ boxShadow: `0 10px 40px ${branding.headerColor}20` }}
          >
            <Image src={branding.logo} alt={branding.platformName} fill className="object-contain" sizes="40px" />
          </m.div>
          <span className="font-extrabold text-lg tracking-tight" style={{ color: branding.headerColor }}>
            {branding.platformName}
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#1d2856]/10 to-[#f65404]/5 border border-[#1d2856]/15 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-[#1d2856]/25">
            <Image
              src={user?.avatar || "/user-avatar.png"}
              alt={safeStr(user?.name)}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-[#0F172A] truncate">{safeStr(user?.name, locale === "ar" ? "طالب" : "Student")}</p>
            <p className="text-xs text-[#64748B]">{purchasedCourses.length} {locale === "ar" ? "دورات" : "courses"}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-[#E2E8F0] overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#1d2856] to-[#f65404]"
            />
          </div>
          <span className="text-[10px] font-bold text-[#1d2856]">65%</span>
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-1">{locale === "ar" ? "مستوى التقدم الإجمالي" : "Overall Progress"}</p>
      </div>

      {/* Nav links */}
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
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  active ? "bg-white/20" : "bg-[#F1F5F9] group-hover:bg-white"
                }`}>
                  <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-[#94A3B8] group-hover:text-primary"}`} />
                </div>
                {t(`dashboard.${item.key}`)}
                {active && (
                  <m.div
                    layoutId="active-indicator"
                    className="ms-auto h-2 w-2 rounded-full bg-white"
                  />
                )}
              </Link>
            </m.div>
          )
        })}
      </nav>

      {/* Membership wallet shortcut */}
      {memberHasAccess && (
      <div className="mx-4 mb-3">
        <Link
          href="/dashboard/membership"
          className="relative block overflow-hidden rounded-2xl bg-gradient-to-br from-[#081A4D] via-[#0B2F8C] to-[#1345D6] p-4 text-white transition-opacity hover:opacity-95"
        >
          <div className="pointer-events-none absolute -top-6 -end-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold">
              {sidebarMembership
                ? (locale === "ar" ? "عضويتك" : "Your membership")
                : (locale === "ar" ? "محفظة العضوية" : "Membership Wallet")}
            </span>
          </div>
          <p className="relative z-10 mt-2 text-[11px] text-white/70 leading-relaxed">
            {sidebarMembership ? (
              <>
                <span className="font-semibold text-white">{sidebarMembership.title}</span>
                {sidebarMembership.level ? ` · ${sidebarMembership.level}` : ""}
                <span className="mt-1 block font-mono text-[10px] text-white/50">#{sidebarMembership.membershipNo}</span>
              </>
            ) : (
              locale === "ar" ? "حمّل شهادة PDF وادخل دورات باقتك" : "Download your PDF certificate and access bundle courses"
            )}
          </p>
        </Link>
      </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[#E2E8F0] pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <LogOut className="w-4 h-4" />
          </div>
          {t("dashboard.logout")}
        </button>
      </div>
    </div>
  )

  return (
    <div dir={dir} className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col bg-white border-e border-[#E2E8F0]/60 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
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

      {/* Main content area */}
      <div className="lg:ms-[280px]">
        {/* Top bar */}
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
                <h1 className="text-lg font-bold text-[#0F172A]">{t("dashboard.title")}</h1>
                <p className="text-xs text-[#94A3B8] hidden sm:block">
                  {locale === "ar" ? "إدارة حسابك ودوراتك" : "Manage your account and courses"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/notifications">
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-[#E2E8F0]/60 bg-[#F8FAFC]/60 text-[#64748B] hover:border-primary/20 hover:bg-white hover:text-primary transition-all"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </m.button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="gap-2 rounded-xl text-[#64748B] hover:text-primary hover:bg-primary/5"
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
                  <div className="pointer-events-none absolute -bottom-20 -start-20 h-40 w-40 rounded-full bg-primary/5 blur-[60px]" />

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
                        ? "نقوم بمراجعة حسابك وتعيينك لمدرس. سيتم إشعارك فور اعتماد الحساب."
                        : "We're reviewing your account and assigning you a teacher. You'll be notified once approved."}
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
                        <Button className="w-full rounded-xl h-11 text-sm font-semibold gap-2">
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
