"use client"

import { useState, useMemo } from "react"
import { m } from "framer-motion"
import { Users, BarChart3, Calendar, BookOpen, ChevronRight, ChevronLeft, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"
import { useApi, api } from "@/hooks/use-api"
import Link from "next/link"

const activityIcons: Record<string, { color: string }> = {
  grade: { color: "bg-[#059669]/10 text-[#059669]" },
  lesson_complete: { color: "bg-primary/10 text-primary" },
  exam_result: { color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  assignment: { color: "bg-primary/10 text-primary" },
  achievement: { color: "bg-[#EC4899]/10 text-[#EC4899]" },
}

function formatTimeAgo(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return { en: `${diffMins}m ago`, ar: `منذ ${diffMins} دقيقة` }
  if (diffHours < 24) return { en: `${diffHours}h ago`, ar: `منذ ${diffHours} ساعة` }
  if (diffDays === 1) return { en: "Yesterday", ar: "أمس" }
  if (diffDays < 7) return { en: `${diffDays} days ago`, ar: `منذ ${diffDays} أيام` }
  return { en: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), ar: d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) }
}

export default function ParentDashboardPage() {
  const { locale, dir } = useI18n()
  const { user } = useStore()
  const [selectedChild, setSelectedChild] = useState(-1)

  const { data: statsData } = useApi(() => api.getParentDashboardStats())
  const { data: activityData } = useApi(() => api.getParentRecentActivity())
  const { data: eventsData } = useApi(() => api.getParentUpcomingEvents())
  const { data: childrenData } = useApi(() => api.getParentChildren())

  const ensureName = (val: unknown): string =>
    typeof val === "string" ? val : (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string" ? String((val as { name: string }).name) : "Child")

  const children = useMemo(() => {
    if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
      return childrenData.map((c: { id: string; name?: unknown }) => ({
        id: c.id,
        name: ensureName(c.name) || "Child",
        nameAr: ensureName(c.name) || "طفل",
        avatar: (ensureName(c.name) || "C").charAt(0),
      }))
    }
    return []
  }, [childrenData])

  const statsLabels = [
    { key: "children", labelEn: "Children", labelAr: "الأبناء", icon: Users, color: "from-[#EC4899] to-[#F472B6]" },
    { key: "avgGrade", labelEn: "Average Grade", labelAr: "متوسط الدرجات", icon: BarChart3, color: "from-primary to-primary/90" },
    { key: "attendance", labelEn: "Attendance Rate", labelAr: "نسبة الحضور", icon: Calendar, color: "from-[#059669] to-[#10B981]" },
    { key: "courses", labelEn: "Courses Enrolled", labelAr: "الدورات المسجلة", icon: BookOpen, color: "from-[#F59E0B] to-[#FBBF24]" },
  ]
  const stats = useMemo(() => {
    const s = statsData as { childrenCount?: number; enrolledCourses?: number; avgAttendance?: number; avgGrade?: number } | null | undefined
    return [
      { ...statsLabels[0], valueEn: String(s?.childrenCount ?? 0), valueAr: String(s?.childrenCount ?? 0) },
      { ...statsLabels[1], valueEn: `${Math.round(s?.avgGrade ?? 0)}%`, valueAr: `${Math.round(s?.avgGrade ?? 0)}٪` },
      { ...statsLabels[2], valueEn: `${Math.round(s?.avgAttendance ?? 0)}%`, valueAr: `${Math.round(s?.avgAttendance ?? 0)}٪` },
      { ...statsLabels[3], valueEn: String(s?.enrolledCourses ?? 0), valueAr: String(s?.enrolledCourses ?? 0) },
    ]
  }, [statsData])

  const recentActivity = useMemo(() => {
    if (activityData && Array.isArray(activityData) && activityData.length > 0) {
      return activityData.slice(0, 5).map((a: { type?: string; user?: { name?: string }; lesson?: { title?: string }; course?: { title?: string }; exam?: { title?: string }; score?: number; date?: string }) => {
        const name = safeStr(a.user?.name, "Child")
        const time = formatTimeAgo(a.date || new Date())
        let activityEn = ""
        let activityAr = ""
        if (a.type === "lesson_complete") {
          activityEn = `Completed: ${a.lesson?.title || "Lesson"}`
          activityAr = `أكمل: ${a.lesson?.title || "درس"}`
        } else if (a.type === "exam_result") {
          activityEn = `Scored ${a.score ?? 0}% on ${a.exam?.title || "Exam"}`
          activityAr = `حصل على ${a.score ?? 0}٪ في ${a.exam?.title || "اختبار"}`
        } else {
          activityEn = "Activity"
          activityAr = "نشاط"
        }
        return { childEn: name, childAr: name, activityEn, activityAr, time: time.en, timeAr: time.ar, type: a.type || "assignment" }
      })
    }
    return []
  }, [activityData])

  const upcomingEvents = useMemo(() => {
    if (eventsData && typeof eventsData === "object") {
      const e = eventsData as { assignments?: Array<{ title?: string; dueDate?: string }>; exams?: Array<{ title?: string; startDate?: string }> }
      const items: { titleEn: string; titleAr: string; dateEn: string; dateAr: string; childEn: string; childAr: string }[] = []
      ;(e.assignments || []).slice(0, 3).forEach((a) => {
        const d = a.dueDate ? new Date(a.dueDate) : new Date()
        items.push({
          titleEn: a.title || "Assignment",
          titleAr: a.title || "واجب",
          dateEn: d.toLocaleDateString("en-US"),
          dateAr: d.toLocaleDateString("ar-SA"),
          childEn: "All",
          childAr: "الكل",
        })
      })
      ;(e.exams || []).slice(0, 3).forEach((ex) => {
        const d = ex.startDate ? new Date(ex.startDate) : new Date()
        items.push({
          titleEn: ex.title || "Exam",
          titleAr: ex.title || "اختبار",
          dateEn: d.toLocaleDateString("en-US"),
          dateAr: d.toLocaleDateString("ar-SA"),
          childEn: "All",
          childAr: "الكل",
        })
      })
      if (items.length > 0) return items
    }
    return []
  }, [eventsData])

  const isRTL = dir === "rtl"

  return (
    <div className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#F472B6] p-6 sm:p-8 text-white"
      >
        <div className="pointer-events-none absolute -top-10 -end-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {locale === "ar" ? `مرحباً، ${safeStr(user?.name, "ولي الأمر")}` : `Welcome back, ${safeStr(user?.name, "Parent")}`}
            </h2>
            <p className="text-white/80 text-sm sm:text-base">
              {locale === "ar" ? "أبناؤك يحرزون تقدماً رائعاً هذا الأسبوع" : "Your children are making great progress this week"}
            </p>
          </div>
          <div className="relative">
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(Number(e.target.value))}
              className="appearance-none bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl px-4 pe-10 py-2.5 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value={-1} className="text-[#0F172A]">{locale === "ar" ? "جميع الأبناء" : "All Children"}</option>
              {children.map((child, i) => (
                <option key={child.id} value={i} className="text-[#0F172A]">
                  {safeStr(locale === "ar" ? child.nameAr : child.name)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
          </div>
        </div>
      </m.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <m.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? stat.valueAr : stat.valueEn}</p>
            <p className="text-xs text-[#64748B] mt-1">{locale === "ar" ? stat.labelAr : stat.labelEn}</p>
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
            <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "النشاط الأخير" : "Recent Activity"}</h3>
            <Link href="/parent-dashboard/progress" className="text-xs text-[#EC4899] font-semibold hover:underline flex items-center gap-1">
              {locale === "ar" ? "عرض الكل" : "View All"}
              {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentActivity.map((activity, i) => {
              const config = activityIcons[activity.type] || { color: "bg-[#64748B]/10 text-[#64748B]" }
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${config.color}`}>
                    <span className="text-xs font-bold">{(locale === "ar" ? activity.childAr : activity.childEn).charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">
                      <span className="text-[#EC4899]">{locale === "ar" ? activity.childAr : activity.childEn}</span>
                      {" — "}
                      {locale === "ar" ? activity.activityAr : activity.activityEn}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{locale === "ar" ? activity.timeAr : activity.time}</p>
                  </div>
                </m.div>
              )
            })}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
            <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "الأحداث القادمة" : "Upcoming Events"}</h3>
          </div>
          <div className="p-4 space-y-3">
            {upcomingEvents.map((event, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-[#EC4899]/10 flex flex-col items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#EC4899]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{locale === "ar" ? event.titleAr : event.titleEn}</p>
                  <p className="text-xs text-[#64748B]">{locale === "ar" ? event.dateAr : event.dateEn}</p>
                  <p className="text-xs text-[#EC4899]">{locale === "ar" ? event.childAr : event.childEn}</p>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </div>
  )
}
