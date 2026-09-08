"use client"

import { useEffect, useMemo, useState } from "react"
import { m } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Flame,
  Target,
  Zap,
  Star,
  Play,
  Calendar,
  Trophy,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { MembershipWalletCard, type MembershipWalletItem } from "@/components/dashboard/membership-wallet-card"
import { downloadMembershipPdf } from "@/lib/membership-download"
import { getActiveMemberships } from "@/lib/membership-utils"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function DashboardPage() {
  const { locale, dir, t } = useI18n()
  const { user, isLoggedIn, purchasedCourses } = useStore()
  const router = useRouter()
  const isRTL = dir === "rtl"
  const { data: stats } = useApi<any>(() => api.getDashboardStats(), { immediate: isLoggedIn })
  const { data: myGroups } = useApi<any[]>(() => api.getMyGroups(), { immediate: isLoggedIn })
  const { data: enrolledData } = useApi<any>(() => api.getEnrolledCourses(), { immediate: isLoggedIn })
  const { data: myMemberships } = useApi<any[]>(() => api.getMyMemberships(), { immediate: isLoggedIn })
  const [downloadingMembership, setDownloadingMembership] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) router.push("/login")
  }, [isLoggedIn, router])

  const recentCourses = useMemo(() => {
    const list = Array.isArray(enrolledData) ? enrolledData : (enrolledData as { data?: unknown[] } | undefined)?.data
    if (!list || !Array.isArray(list) || list.length === 0) return []
    return list.slice(0, 4).map((e: Record<string, unknown>) => {
      const course = e.course as Record<string, unknown> | undefined
      const instructor = course?.instructor
      const instructorName = typeof instructor === "string" ? instructor : (instructor as { name?: string })?.name ?? ""
      return {
        id: String(course?.id ?? e.courseId ?? ""),
        thumbnail: (course?.thumbnail as string) ?? "/course-1.png",
        titleAr: (course?.titleAr as string) ?? (course?.title as string) ?? "",
        titleEn: (course?.titleEn as string) ?? (course?.title as string) ?? "",
        instructorAr: instructorName,
        instructorEn: instructorName,
        progress: Math.round(Number(e.progress ?? 0)),
      }
    })
  }, [enrolledData])

  const myCoursesGrid = useMemo(() => {
    const list = Array.isArray(enrolledData) ? enrolledData : (enrolledData as { data?: unknown[] } | undefined)?.data
    if (!list || !Array.isArray(list) || list.length === 0) return []
    return list.slice(0, 6).map((e: Record<string, unknown>) => {
      const course = e.course as Record<string, unknown> | undefined
      const instructor = course?.instructor
      const instructorName = typeof instructor === "string" ? instructor : (instructor as { name?: string })?.name ?? ""
      return {
        id: String(course?.id ?? e.courseId ?? ""),
        thumbnail: (course?.thumbnail as string) ?? "/course-1.png",
        titleAr: (course?.titleAr as string) ?? (course?.title as string) ?? "",
        titleEn: (course?.titleEn as string) ?? (course?.title as string) ?? "",
        instructor: instructorName,
        progress: Math.round(Number(e.progress ?? 0)),
      }
    })
  }, [enrolledData])

  const statsCards = [
    { label: locale === "ar" ? "الدورات المسجلة" : "Enrolled", value: stats?.enrolledCourses ?? purchasedCourses.length ?? 3, icon: BookOpen, color: "from-primary to-primary/90", bg: "bg-primary/5" },
    { label: locale === "ar" ? "دورات مكتملة" : "Completed", value: stats?.completedCourses ?? 3, icon: CheckCircle, color: "from-emerald-500 to-emerald-400", bg: "bg-emerald-500/5" },
    { label: locale === "ar" ? "ساعات تعلم" : "Hours Learned", value: stats?.totalHours ?? 156, icon: Clock, color: "from-amber-500 to-amber-400", bg: "bg-amber-500/5" },
    { label: locale === "ar" ? "شهادات" : "Certificates", value: stats?.certificates ?? 3, icon: Award, color: "from-[#8B5CF6] to-[#A78BFA]", bg: "bg-[#8B5CF6]/5" },
    { label: locale === "ar" ? "نقاطي" : "My Points", value: stats?.totalPoints ?? 0, icon: Trophy, color: "from-amber-500 to-amber-400", bg: "bg-amber-500/5" },
  ]

  const weekDays = locale === "ar"
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const activityData = [40, 80, 55, 95, 70, 25, 60]

  const streakDays = 12
  const todayGoal = 75

  const activeMembership = useMemo((): MembershipWalletItem | null => {
    const active = getActiveMemberships(myMemberships)
    if (active.length === 0) return null
    const m = active[0]
    return {
      id: m.id,
      membershipNo: m.membershipNo,
      pdfUrl: m.pdfUrl,
      status: m.status,
      expiresAt: m.expiresAt,
      package: m.package as MembershipWalletItem["package"],
    }
  }, [myMemberships])

  return (
    <div dir={dir} className="space-y-6">
      {/* Welcome hero */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-7 sm:p-8 text-white"
      >
        <div className="pointer-events-none absolute inset-0">
          <m.div
            className="absolute -top-20 end-[10%] h-[300px] w-[300px] rounded-full bg-primary/15 blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute -bottom-16 start-[5%] h-[250px] w-[250px] rounded-full bg-primary/10 blur-[80px]"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl">
              <Image src={user?.avatar || "/user-avatar.png"} alt="" fill className="object-cover" />
            </div>
            <div>
              <m.p
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-white/50"
              >
                {locale === "ar" ? "مرحباً بعودتك" : "Welcome back"} 👋
              </m.p>
              <m.h2
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-extrabold sm:text-3xl"
              >
                {safeStr(user?.name, locale === "ar" ? "طالب" : "Student")}
              </m.h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-extrabold">{streakDays}</p>
                <p className="text-[10px] text-white/50">{locale === "ar" ? "يوم متتالي" : "Day Streak"}</p>
              </div>
            </m.div>

            {/* Daily goal */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 backdrop-blur-sm"
            >
              <div className="relative h-10 w-10">
                <svg className="h-10 w-10 -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <m.circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="url(#goalGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - todayGoal / 100) }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-primary)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white/60" />
                </div>
              </div>
              <div>
                <p className="text-xl font-extrabold">{todayGoal}%</p>
                <p className="text-[10px] text-white/50">{locale === "ar" ? "هدف اليوم" : "Daily Goal"}</p>
              </div>
            </m.div>
          </div>
        </div>
      </m.div>

      {activeMembership && (
        <MembershipWalletCard
          membership={activeMembership}
          compact
          downloading={downloadingMembership}
          onDownload={async (membershipId, no) => {
            setDownloadingMembership(no)
            try {
              await downloadMembershipPdf({
                membershipId,
                membershipNo: no,
                memberName: user?.name || user?.email,
              })
            } catch {
              // ignore
            } finally {
              setTimeout(() => setDownloadingMembership(null), 1000)
            }
          }}
        />
      )}

      {/* Stats grid */}
      <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, i) => (
          <m.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </m.div>
            </div>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-3xl font-extrabold text-[#0F172A]"
            >
              {stat.value}
            </m.p>
            <p className="text-xs text-[#94A3B8] mt-1 font-medium">{stat.label}</p>
            <div className="pointer-events-none absolute -bottom-4 -end-4 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
          </m.div>
        ))}
      </m.div>

      {/* Group leaderboard — only shown once a teacher has added the student to a group */}
      {Array.isArray(myGroups) && myGroups.length > 0 && (
        <div className="space-y-4">
          {myGroups.map((g: any) => (
            <m.div
              key={g.classId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-[#0F172A]">
                    {locale === "ar" ? `ترتيبك في ${g.classNameAr || g.className}` : `Your rank in ${g.className}`}
                  </h3>
                </div>
                <span className="text-sm font-bold text-primary">
                  {locale === "ar" ? `المركز ${g.myRank} من ${g.totalMembers}` : `Rank ${g.myRank} of ${g.totalMembers}`}
                </span>
              </div>
              <div className="space-y-2">
                {g.leaderboard.map((row: any, idx: number) => (
                  <div
                    key={row.userId}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                      row.isMe ? "bg-primary/10 ring-1 ring-primary/30" : idx === 0 ? "bg-amber-50" : "bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#64748B] border border-[#E2E8F0]">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {row.name}
                        {row.isMe ? (locale === "ar" ? " (أنت)" : " (You)") : ""}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {row.points} {locale === "ar" ? "نقطة" : "pts"}
                    </span>
                  </div>
                ))}
              </div>
            </m.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent courses - 2 cols */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {locale === "ar" ? "استمر في التعلم" : "Continue Learning"}
              </h3>
            </div>
            <Link href="/dashboard/courses">
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:bg-primary/5 rounded-xl font-semibold">
                {locale === "ar" ? "عرض الكل" : "View All"}
                {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-16">
                <BookOpen className="h-12 w-12 text-[#E2E8F0] mb-4" />
                <p className="text-sm text-[#94A3B8] font-medium">
                  {locale === "ar" ? "لم تسجل في أي دورة بعد" : "No courses enrolled yet"}
                </p>
                <Link href="/courses" className="mt-4">
                  <Button size="sm" className="rounded-xl bg-primary text-white gap-2">
                    {locale === "ar" ? "تصفح الدورات" : "Browse Courses"}
                  </Button>
                </Link>
              </div>
            ) : (
              recentCourses.map((course, i) => (
                <m.div
                  key={course.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ x: isRTL ? -4 : 4, transition: { duration: 0.2 } }}
                  className="group flex items-center gap-4 rounded-2xl border border-[#E2E8F0]/60 bg-white p-4 shadow-sm transition-all hover:border-primary/15 hover:shadow-md"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                    <Image src={course.thumbnail} alt="" fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#0F172A] truncate group-hover:text-primary transition-colors">
                      {locale === "ar" ? course.titleAr : course.titleEn}
                    </h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {locale === "ar" ? course.instructorAr : course.instructorEn}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="h-1.5 flex-1 rounded-full bg-[#F1F5F9] overflow-hidden">
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: "easeOut" }}
                          className={`h-full rounded-full ${course.progress >= 80 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-primary/90"}`}
                        />
                      </div>
                      <span className={`text-xs font-bold ${course.progress >= 80 ? "text-emerald-500" : "text-primary"}`}>
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                  <Link href={`/learning/${course.id}`}>
                    <m.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25"
                    >
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </m.div>
                  </Link>
                </m.div>
              ))
            )}
          </div>

          {/* My courses grid */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {locale === "ar" ? "كورساتي" : "My Courses"}
                </h3>
              </div>
              <Link href="/dashboard/courses">
                <Button variant="ghost" size="sm" className="gap-1.5 text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-xl font-semibold">
                  {locale === "ar" ? "عرض الكل" : "View All"}
                  {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Button>
              </Link>
            </div>

            {myCoursesGrid.length === 0 ? null : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myCoursesGrid.map((c, i) => (
                  <m.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="group rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-primary/15 transition-all"
                  >
                    <Link href={`/learning/${c.id}`} className="block">
                      <div className="relative h-36 bg-[#F1F5F9] overflow-hidden">
                        <Image
                          src={c.thumbnail}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 inset-x-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-bold text-white truncate">
                              {safeStr(locale === "ar" ? c.titleAr : c.titleEn)}
                            </p>
                            <span className="text-xs font-extrabold text-white shrink-0">{c.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.progress >= 80 ? "bg-emerald-400" : "bg-gradient-to-r from-primary to-primary/90"}`}
                              style={{ width: `${c.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="p-4">
                      <p className="text-xs text-[#94A3B8] truncate">{safeStr(c.instructor)}</p>
                      <Link href={`/learning/${c.id}`} className="mt-3 block">
                        <Button className="w-full h-10 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold gap-2 shadow-md shadow-primary/20">
                          {locale === "ar" ? "فتح الدورة" : "Open Course"}
                          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </Link>
                    </div>
                  </m.div>
                ))}
              </div>
            )}
          </div>
        </m.div>

        {/* Right column */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-5"
        >
          {/* Weekly activity chart */}
          <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {locale === "ar" ? "النشاط الأسبوعي" : "Weekly Activity"}
                </h4>
              </div>
              <span className="text-xs font-medium text-[#94A3B8]">
                {locale === "ar" ? "هذا الأسبوع" : "This Week"}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {activityData.map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: `${value}%` }}
                    transition={{ delay: 0.7 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                    className={`w-full max-w-[28px] rounded-lg ${
                      i === 3 ? "bg-gradient-to-t from-primary to-primary/90 shadow-md shadow-primary/20" : "bg-[#F1F5F9] hover:bg-primary/10 transition-colors"
                    }`}
                  />
                  <span className={`text-[10px] font-medium ${i === 3 ? "text-primary font-bold" : "text-[#94A3B8]"}`}>
                    {weekDays[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                <Star className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A]">
                {locale === "ar" ? "الإنجازات" : "Achievements"}
              </h4>
            </div>
            <div className="space-y-3">
              {[
                { icon: Flame, label: locale === "ar" ? "متعلم متحمس" : "Eager Learner", desc: locale === "ar" ? "أكمل 7 أيام متتالية" : "7 day streak", color: "from-amber-400 to-orange-500", earned: true },
                { icon: BookOpen, label: locale === "ar" ? "قارئ نهم" : "Bookworm", desc: locale === "ar" ? "سجّل في 3 دورات" : "Enrolled in 3 courses", color: "from-primary to-primary/90", earned: true },
                { icon: Award, label: locale === "ar" ? "خبير معتمد" : "Certified Expert", desc: locale === "ar" ? "احصل على 5 شهادات" : "Earn 5 certificates", color: "from-[#8B5CF6] to-[#A78BFA]", earned: false },
              ].map((badge, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className={`flex items-center gap-3 rounded-xl p-3 ${badge.earned ? "bg-[#F8FAFC]" : "bg-[#F8FAFC]/50 opacity-50"}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${badge.color} shadow-sm ${!badge.earned && "grayscale"}`}>
                    <badge.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0F172A]">{badge.label}</p>
                    <p className="text-[10px] text-[#94A3B8]">{badge.desc}</p>
                  </div>
                  {badge.earned && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                </m.div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A]">
                {locale === "ar" ? "الأحداث القادمة" : "Upcoming"}
              </h4>
            </div>
            <div className="space-y-3">
              {[
                { time: locale === "ar" ? "اليوم 3:00م" : "Today 3PM", label: locale === "ar" ? "بث مباشر: React المتقدم" : "Live: Advanced React" },
                { time: locale === "ar" ? "غداً 10:00ص" : "Tomorrow 10AM", label: locale === "ar" ? "موعد تسليم المشروع" : "Project Deadline" },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0]/60 p-3">
                  <div className="h-10 w-1 rounded-full bg-gradient-to-b from-primary to-primary/90" />
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{event.label}</p>
                    <p className="text-[10px] text-[#94A3B8]">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      </div>
    </div>
  )
}
