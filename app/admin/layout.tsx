"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Presentation,
  BookOpen,
  PlayCircle,
  FileText,
  Award,
  UserPlus,
  MessageSquare,
  Bell,
  FileEdit,
  FolderOpen,
  Shield,
  BarChart3,
  Star,
  LogOut,
  Menu,
  X,
  Search,
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Tag,
  Ticket,
  ShoppingBag,
  Layers,
  ClipboardList,
  Library,
  CreditCard,
  Percent,
  GraduationCap,
  School,
  Heart,
  UserCheck,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr, getDashboardPath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { IAGRCP_BRAND } from "@/lib/brand-assets"
import "./admin-theme.css"

type NavGroup = {
  titleKey: string
  items: { key: string; path: string; icon: any }[]
}

const navGroups: NavGroup[] = [
  {
    titleKey: "main",
    items: [{ key: "dashboard", path: "/admin", icon: LayoutDashboard }],
  },
  {
    titleKey: "usersSection",
    items: [
      { key: "users", path: "/admin/users", icon: Users },
      { key: "teachersPage", path: "/admin/teachers", icon: GraduationCap },
      { key: "studentsPage", path: "/admin/students", icon: School },
      { key: "pendingStudents", path: "/admin/students/pending", icon: UserCheck },
      { key: "parentsPage", path: "/admin/parents", icon: Heart },
      { key: "instructors", path: "/admin/instructors", icon: Presentation },
      { key: "studentRequests", path: "/admin/students/requests", icon: UserPlus },
    ],
  },
  {
    titleKey: "coursesSection",
    items: [
      { key: "courses", path: "/admin/courses", icon: BookOpen },
      { key: "categories", path: "/admin/categories", icon: Tag },
      { key: "enrollments", path: "/admin/enrollments", icon: UserPlus },
    ],
  },
  {
    titleKey: "examsSection",
    items: [
      { key: "questionBank", path: "/admin/question-bank", icon: ClipboardList },
      { key: "comprehensiveExams", path: "/admin/comprehensive-exams", icon: FileText },
      { key: "assignments", path: "/admin/assignments", icon: FileText },
    ],
  },
  {
    titleKey: "storeSection",
    items: [
      { key: "store", path: "/admin/store", icon: ShoppingBag },
      { key: "servicesBundles", path: "/admin/services-bundles", icon: Layers },
      { key: "membershipPackages", path: "/admin/membership-packages", icon: Award },
      { key: "coupons", path: "/admin/coupons", icon: Ticket },
      { key: "payouts", path: "/admin/payouts", icon: CreditCard },
      { key: "commission", path: "/admin/commission", icon: Percent },
    ],
  },
  {
    titleKey: "contentSection",
    items: [
      { key: "contentBank", path: "/admin/content-bank", icon: Library },
      { key: "content", path: "/admin/content", icon: FileEdit },
      { key: "files", path: "/admin/files", icon: FolderOpen },
    ],
  },
  {
    titleKey: "qualitySection",
    items: [
      { key: "reviews", path: "/admin/reviews", icon: Star },
      { key: "certificates", path: "/admin/certificates", icon: Award },
      { key: "membershipCertificates", path: "/admin/membership-certificates", icon: Award },
    ],
  },
  {
    titleKey: "communicationSection",
    items: [
      { key: "messages", path: "/admin/messages", icon: MessageSquare },
      { key: "communities", path: "/admin/communities", icon: UserPlus },
      { key: "notifications", path: "/admin/notifications", icon: Bell },
    ],
  },
  {
    titleKey: "systemSection",
    items: [
      { key: "roles", path: "/admin/roles", icon: Shield },
      { key: "reports", path: "/admin/reports", icon: BarChart3 },
    ],
  },
]

const labels: Record<string, { ar: string; en: string }> = {
  main: { ar: "الرئيسية", en: "Main" },
  usersSection: { ar: "المستخدمون والأعضاء", en: "Users & Members" },
  coursesSection: { ar: "الدورات والتعليم", en: "Courses & Learning" },
  examsSection: { ar: "الاختبارات والتقييم", en: "Exams & Assessment" },
  storeSection: { ar: "المتجر والمدفوعات", en: "Store & Payments" },
  contentSection: { ar: "المحتوى والملفات", en: "Content & Files" },
  qualitySection: { ar: "الجودة والشهادات", en: "Quality & Certificates" },
  communicationSection: { ar: "التواصل والتفاعل", en: "Communication" },
  systemSection: { ar: "النظام والإدارة", en: "System & Admin" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  users: { ar: "المستخدمون", en: "Users" },
  teachersPage: { ar: "المعلمون", en: "Teachers" },
  studentsPage: { ar: "الطلاب", en: "Students" },
  pendingStudents: { ar: "الطلاب المعلّقين", en: "Pending Students" },
  parentsPage: { ar: "أولياء الأمور", en: "Parents" },
  instructors: { ar: "موافقات المدرسين", en: "Teacher Approvals" },
  courses: { ar: "الدورات", en: "Courses" },
  studentRequests: { ar: "طلبات الطلاب", en: "Student Requests" },
  coupons: { ar: "الكوبونات", en: "Coupons" },
  lessons: { ar: "الدروس", en: "Lessons" },
  exams: { ar: "الاختبارات", en: "Exams" },
  questionBank: { ar: "بنك الأسئلة", en: "Question Bank" },
  contentBank: { ar: "بنك المحتوى", en: "Content Bank" },
  comprehensiveExams: { ar: "امتحانات شاملة", en: "Comprehensive Exams" },
  reviews: { ar: "مراجعة التقييمات", en: "Review Management" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  enrollments: { ar: "التسجيلات", en: "Enrollments" },
  assignments: { ar: "الواجبات", en: "Assignments" },
  messages: { ar: "الرسائل", en: "Messages" },
  communities: { ar: "المجتمعات", en: "Communities" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  categories: { ar: "التصنيفات", en: "Categories" },
  store: { ar: "المتجر الإلكتروني", en: "Store" },
  servicesBundles: { ar: "الخدمات والباقات", en: "Services & Bundles" },
  membershipPackages: { ar: "باقات العضوية", en: "Membership Packages" },
  membershipCertificates: { ar: "شهادات العضوية", en: "Membership Certificates" },
  content: { ar: "المحتوى", en: "Content" },
  files: { ar: "الملفات", en: "Files" },
  roles: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },
  payouts: { ar: "طلبات سحب الأموال", en: "Withdrawal Requests" },
  commission: { ar: "حساب العمولات", en: "Commission Settings" },
  reports: { ar: "التقارير", en: "Reports" },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir, setLocale } = useI18n()
  const { user, isLoggedIn, hydrated, logout } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [instructorsEnabled, setInstructorsEnabled] = useState(true)
  const isRTL = dir === "rtl"

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/settings/instructors-status`)
        .then((r) => r.json())
        .then((json) => setInstructorsEnabled(json?.enabled !== false))
        .catch(() => setInstructorsEnabled(true))
    }
    fetchStatus()
    window.addEventListener("instructors-toggle", fetchStatus)
    return () => window.removeEventListener("instructors-toggle", fetchStatus)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn || !user) {
      router.replace("/login?redirect=/admin")
      return
    }
    if (user.role !== "admin") {
      router.replace(getDashboardPath(user.role))
      return
    }
  }, [hydrated, isLoggedIn, user, router])

  if (!hydrated || !isLoggedIn || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F8]">
        <div className="animate-pulse text-[#1345D6]/60">...</div>
      </div>
    )
  }

  const isActive = (path: string) => {
    const current = pathname ?? ""
    if (path === "/admin") return current === "/admin"
    return current.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const instructorRelatedKeys = ["instructors", "studentRequests", "payouts", "commission"]
  const hiddenNavKeys = [
    "categories",
    "enrollments",
    "store",
    "servicesBundles",
    "membershipPackages",
    "coupons",
    "payouts",
    "commission",
    "contentBank",
    "reviews",
    "membershipCertificates",
  ]
  const filteredNavGroups = (instructorsEnabled
    ? navGroups
    : navGroups.map((g) => ({
        ...g,
        items: g.items.filter((item) => !instructorRelatedKeys.includes(item.key)),
      })))
    .map((g) => ({ ...g, items: g.items.filter((item) => !hiddenNavKeys.includes(item.key)) }))
    .filter((g) => g.items.length > 0)

  const SidebarNav = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#081A4D] via-[#0B2F8C] to-[#1345D6]">
      <div className="p-5 pb-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-white/20">
            <Image
              src={IAGRCP_BRAND.logo.primary}
              alt="Eng. Loay Essam"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base text-white block leading-tight">
              Eng. Loay Essam
            </span>
            <span className="text-[9px] text-white/55 font-medium leading-snug line-clamp-2">
              {locale === "ar"
                ? "Your Fav Engineer"
                : "Your Fav Engineer"}
            </span>
            <span className="text-[10px] text-white/40 font-medium mt-0.5 block">
              {locale === "ar" ? "لوحة الإدارة" : "Admin Panel"}
            </span>
          </div>
        </Link>
      </div>

      <nav className="admin-sidebar-nav flex-1 px-3 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
        {filteredNavGroups.map((group, gi) => (
          <div key={group.titleKey}>
            {group.items.length > 1 && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {locale === "ar" ? labels[group.titleKey]?.ar : labels[group.titleKey]?.en}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item, i) => {
                const active = isActive(item.path)
                const label = labels[item.key]
                return (
                  <m.div
                    key={item.key}
                    initial={{ opacity: 0, x: isRTL ? 15 : -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 5 + i) * 0.02 + 0.05 }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? "bg-white text-[#0B2F8C] shadow-lg shadow-black/20"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all shrink-0 ${
                        active ? "bg-[#1345D6]/15" : "bg-white/10 group-hover:bg-white/15"
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{locale === "ar" ? label?.ar : label?.en}</span>
                      {active && (
                        <m.div
                          layoutId="admin-active"
                          className="ms-auto h-1.5 w-1.5 rounded-full bg-[#1345D6] shrink-0"
                        />
                      )}
                    </Link>
                  </m.div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </div>
          {locale === "ar" ? "تسجيل الخروج" : "Logout"}
        </button>
      </div>
    </div>
  )

  return (
    <div dir={dir} className="admin-theme min-h-screen bg-[#FAF8F8]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:start-0 lg:flex lg:w-[270px] lg:flex-col z-40 overflow-hidden">
        <SidebarNav />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-[270px] border-0">
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <div className="lg:ps-[270px]">
        <header className="admin-header sticky top-0 z-30 backdrop-blur-xl border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-primary/5 transition-colors"
              >
                <Menu className="w-5 h-5 text-[#0B2F8C]" />
              </button>
              <div className="admin-search hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-[280px] transition-shadow">
                <Search className="w-4 h-4 text-primary/50" />
                <input
                  type="text"
                  placeholder={locale === "ar" ? "بحث..." : "Search..."}
                  className="bg-transparent text-sm text-[#1A1A1A] placeholder:text-primary/40 outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="gap-1.5 rounded-xl text-primary/70 hover:text-primary hover:bg-primary/5 h-9"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold">{locale === "ar" ? "EN" : "عر"}</span>
              </Button>

              <button className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-primary/15 text-primary/60 hover:text-primary hover:border-primary/30 transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">3</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-primary/15 px-2.5 py-1.5 hover:border-primary/30 transition-all"
                >
                  <div className="relative h-7 w-7 overflow-hidden rounded-lg">
                    <Image src={user?.avatar || "/user-avatar.png"} alt="" fill sizes="28px" className="object-cover" />
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-[#0F172A] max-w-[80px] truncate">
                    {safeStr(user?.name, "Admin")}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <m.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute end-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E2E8F0]/60 py-1 z-50"
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        {locale === "ar" ? "تسجيل الخروج" : "Logout"}
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
