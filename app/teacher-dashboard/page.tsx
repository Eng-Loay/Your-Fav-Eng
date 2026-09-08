"use client"

import { m } from "framer-motion"
import { BookOpen, Users, FileText, BarChart3, Clock, CheckCircle2, Plus, ChevronRight, ChevronLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"
import { useApi, api } from "@/hooks/use-api"
import Image from "next/image"
import Link from "next/link"

const quickActions = [
  { labelEn: "Create Assignment", labelAr: "إنشاء واجب", href: "/teacher-dashboard/assignments", icon: FileText, color: "bg-[#059669]" },
  { labelEn: "View Schedule", labelAr: "عرض الجدول", href: "/teacher-dashboard/schedule", icon: Clock, color: "bg-primary" },
  { labelEn: "Grade Submissions", labelAr: "تصحيح الواجبات", href: "/teacher-dashboard/assignments", icon: CheckCircle2, color: "bg-[#F59E0B]" },
  { labelEn: "Send Message", labelAr: "إرسال رسالة", href: "/teacher-dashboard/messages", icon: Plus, color: "bg-[#8B5CF6]" },
]

export default function TeacherDashboardPage() {
  const { locale, dir } = useI18n()
  const { user } = useStore()
  const isRTL = dir === "rtl"

  const { data: statsRes } = useApi(() => api.getTeacherDashboardStats())
  const { data: scheduleRes } = useApi(() => api.getTeacherScheduleToday())
  const { data: submissionsRes } = useApi(() => api.getTeacherRecentSubmissions())

  const toAr = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d])
  const statsData = (() => {
    const s = statsRes as { classesCount?: number; studentsCount?: number; assignmentsDue?: number; averageScore?: number } | undefined
    const c = s?.classesCount ?? 0, st = s?.studentsCount ?? 0, a = s?.assignmentsDue ?? 0, avg = s?.averageScore ?? 0
    return [
      { key: "classes", valueEn: String(c), valueAr: toAr(c), labelEn: "My Classes", labelAr: "صفوفي", icon: BookOpen, color: "from-[#059669] to-[#10B981]" },
      { key: "students", valueEn: String(st), valueAr: toAr(st), labelEn: "Total Students", labelAr: "إجمالي الطلاب", icon: Users, color: "from-primary to-primary/90" },
      { key: "assignments", valueEn: String(a), valueAr: toAr(a), labelEn: "Assignments Due", labelAr: "واجبات مستحقة", icon: FileText, color: "from-[#F59E0B] to-[#FBBF24]" },
      { key: "average", valueEn: `${avg}%`, valueAr: `${toAr(avg)}٪`, labelEn: "Average Score", labelAr: "متوسط الدرجات", icon: BarChart3, color: "from-[#8B5CF6] to-[#A78BFA]" },
    ]
  })()

  const todaySchedule = (() => {
    const arr = scheduleRes as { time?: string; timeAr?: string; classEn?: string; classAr?: string; room?: string }[] | undefined
    if (!Array.isArray(arr) || arr.length === 0) return []
    return arr.map((x) => ({
      time: x.time ?? "",
      timeAr: x.timeAr ?? x.time ?? "",
      classEn: x.classEn ?? "",
      classAr: x.classAr ?? "",
      room: x.room ?? "",
    }))
  })()

  const recentSubmissions = (() => {
    const arr = submissionsRes as { studentEn?: string; studentAr?: string; assignmentEn?: string; assignmentAr?: string; score?: number; time?: string; timeAr?: string }[] | undefined
    if (!Array.isArray(arr) || arr.length === 0) return []
    return arr.map((x) => ({
      studentEn: x.studentEn ?? "",
      studentAr: x.studentAr ?? "",
      assignmentEn: x.assignmentEn ?? "",
      assignmentAr: x.assignmentAr ?? "",
      score: x.score ?? 0,
      time: x.time ?? "",
      timeAr: x.timeAr ?? x.time ?? "",
    }))
  })()

  return (
    <div className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] p-7 sm:p-8 text-white"
      >
        <div className="pointer-events-none absolute inset-0">
          <m.div
            className="absolute -top-20 end-[10%] h-[300px] w-[300px] rounded-full bg-white/10 blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute -bottom-16 start-[5%] h-[250px] w-[250px] rounded-full bg-white/5 blur-[80px]"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl">
              <Image src={user?.avatar || "/user-avatar.png"} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm text-white/60">
                {locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}
              </p>
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                {safeStr(user?.name, locale === "ar" ? "المعلم" : "Teacher")}
              </h2>
              <p className="text-white/75 text-sm mt-1">
                {locale === "ar"
                  ? "تابع جدول اليوم وآخر التسليمات بسرعة"
                  : "Quickly track today’s schedule and recent submissions"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/teacher-dashboard/assignments">
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-5 py-3 text-sm font-bold hover:bg-white/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {locale === "ar" ? "إنشاء واجب" : "Create Assignment"}
              </m.button>
            </Link>
            <Link href="/teacher-dashboard/schedule">
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-white text-[#7C3AED] px-5 py-3 text-sm font-bold hover:bg-white/90 transition-colors"
              >
                <Clock className="w-4 h-4" />
                {locale === "ar" ? "عرض الجدول" : "View Schedule"}
              </m.button>
            </Link>
          </div>
        </div>
      </m.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <m.div
            key={stat.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-md`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? stat.valueAr : stat.valueEn}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{locale === "ar" ? stat.labelAr : stat.labelEn}</p>
          </m.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
            <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "جدول اليوم" : "Today's Schedule"}</h3>
            <Link href="/teacher-dashboard/schedule" className="text-xs text-[#8B5CF6] font-semibold hover:underline flex items-center gap-1">
              {locale === "ar" ? "عرض الكل" : "View All"}
              {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {todaySchedule.map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex-shrink-0 w-20 text-xs font-semibold text-[#8B5CF6]">
                  {locale === "ar" ? item.timeAr : item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{locale === "ar" ? item.classAr : item.classEn}</p>
                  <p className="text-xs text-[#94A3B8]">{item.room}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
              </m.div>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
            <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "آخر التسليمات" : "Recent Submissions"}</h3>
            <Link href="/teacher-dashboard/assignments" className="text-xs text-[#8B5CF6] font-semibold hover:underline flex items-center gap-1">
              {locale === "ar" ? "عرض الكل" : "View All"}
              {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentSubmissions.map((sub, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#8B5CF6]">
                    {(locale === "ar" ? sub.studentAr : sub.studentEn).charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{locale === "ar" ? sub.studentAr : sub.studentEn}</p>
                  <p className="text-xs text-[#94A3B8] truncate">{locale === "ar" ? sub.assignmentAr : sub.assignmentEn}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <span className={`text-sm font-bold ${sub.score >= 90 ? "text-[#059669]" : sub.score >= 80 ? "text-primary" : "text-[#F59E0B]"}`}>
                    {sub.score}%
                  </span>
                  <p className="text-[10px] text-[#94A3B8]">{locale === "ar" ? sub.timeAr : sub.time}</p>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="font-bold text-[#0F172A] mb-4">{locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <m.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${action.color} mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold text-[#0F172A]">{locale === "ar" ? action.labelAr : action.labelEn}</p>
              </m.div>
            </Link>
          ))}
        </div>
      </m.div>
    </div>
  )
}
