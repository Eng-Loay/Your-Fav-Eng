"use client"

import { useState, useMemo } from "react"
import { m } from "framer-motion"
import { ChevronDown, BookOpen, CheckCircle2, Clock, Trophy, Star, Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"

const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const weekdaysAr = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]

export default function ParentProgressPage() {
  const { locale, dir } = useI18n()
  const [selectedChild, setSelectedChild] = useState(0)
  const isRTL = dir === "rtl"

  const { data: childrenData } = useApi(() => api.getParentChildren())
  const children = (childrenData && Array.isArray(childrenData) && childrenData.length > 0)
    ? childrenData.map((c: { id: string; name?: unknown }) => {
        const n = typeof c.name === "string" ? c.name : (c.name && typeof c.name === "object" && "name" in c.name ? String((c.name as { name: string }).name) : "Child")
        return { id: c.id, nameEn: n || "Child", nameAr: n || "طفل" }
      })
    : []

  const childId = children[Math.min(selectedChild, children.length - 1)]?.id ?? children[0]?.id
  const { data: progressData } = useApi(
    () => (childId ? api.getChildProgress(childId) : Promise.resolve({ success: false })),
    { deps: [childId], immediate: !!childId }
  )
  const { data: completedLessonsData } = useApi(
    () => (childId ? api.getChildCompletedLessons(childId, 10) : Promise.resolve({ success: false })),
    { deps: [childId], immediate: !!childId }
  )
  const { data: weeklyStudyData } = useApi(
    () => (childId ? api.getChildWeeklyStudyTime(childId) : Promise.resolve({ success: false })),
    { deps: [childId], immediate: !!childId }
  )
  const { data: achievementsData } = useApi(
    () => (childId ? api.getChildAchievements(childId) : Promise.resolve({ success: false })),
    { deps: [childId], immediate: !!childId }
  )

  const courseProgress = useMemo(() => {
    if (progressData && Array.isArray(progressData) && progressData.length > 0) {
      const colors = ["bg-[#059669]", "bg-primary", "bg-[#8B5CF6]", "bg-[#F59E0B]", "bg-[#EC4899]"]
      return progressData.map((p: { course?: { title?: string }; totalLessons?: number; completedLessons?: number; progressPercent?: number }, i: number) => ({
        courseEn: p.course?.title || "Course",
        courseAr: p.course?.title || "دورة",
        progress: Math.round(p.progressPercent ?? 0),
        lessonsCompleted: p.completedLessons ?? 0,
        totalLessons: p.totalLessons ?? 0,
        color: colors[i % colors.length],
      }))
    }
    return []
  }, [progressData])

  const completedLessons = useMemo(() => {
    if (completedLessonsData && Array.isArray(completedLessonsData) && completedLessonsData.length > 0) {
      return completedLessonsData.map((p: { lesson?: { title?: string }; course?: { title?: string }; completedAt?: string; score?: number }) => ({
        titleEn: p.lesson?.title || "Lesson",
        titleAr: p.lesson?.title || "درس",
        courseEn: p.course?.title || "Course",
        courseAr: p.course?.title || "دورة",
        dateEn: p.completedAt ? new Date(p.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        dateAr: p.completedAt ? new Date(p.completedAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "",
        score: p.score ?? 0,
      }))
    }
    return []
  }, [completedLessonsData])

  const weeklyHours = useMemo(() => {
    if (weeklyStudyData && Array.isArray(weeklyStudyData) && weeklyStudyData.length > 0) {
      return weeklyStudyData.map((d: { day: number; hours: number }) => ({
        dayEn: weekdaysEn[d.day] ?? "",
        dayAr: weekdaysAr[d.day] ?? "",
        hours: d.hours,
      }))
    }
    return weekdaysEn.map((dayEn, i) => ({ dayEn, dayAr: weekdaysAr[i], hours: 0 }))
  }, [weeklyStudyData])

  const achievements = useMemo(() => {
    const achs: { titleEn: string; titleAr: string; descEn: string; descAr: string; icon: typeof Trophy; color: string }[] = []
    if (achievementsData && typeof achievementsData === "object") {
      const d = achievementsData as { certificates?: unknown[]; completedCourses?: unknown[] }
      if (d.certificates && d.certificates.length > 0) {
        achs.push({ titleEn: "Certificates", titleAr: "الشهادات", descEn: `${d.certificates.length} certificate(s) earned`, descAr: `تم الحصول على ${d.certificates.length} شهادة`, icon: Trophy, color: "text-[#F59E0B]" })
      }
      if (d.completedCourses && d.completedCourses.length > 0) {
        achs.push({ titleEn: "Courses Completed", titleAr: "دورات مكتملة", descEn: `${d.completedCourses.length} course(s) completed`, descAr: `أكمل ${d.completedCourses.length} دورة`, icon: Star, color: "text-[#059669]" })
      }
    }
    if (achs.length === 0) {
      achs.push({ titleEn: "Keep learning!", titleAr: "استمر في التعلم!", descEn: "Complete lessons and exams to earn achievements", descAr: "أكمل الدروس والاختبارات للحصول على إنجازات", icon: Zap, color: "text-[#EC4899]" })
    }
    return achs
  }, [achievementsData])

  const maxHours = Math.max(1, ...weeklyHours.map((d) => d.hours))

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "متابعة التقدم" : "Progress Tracking"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "تابع تقدم أبنائك الدراسي" : "Track your children's learning progress"}</p>
        </div>
        <div className="relative">
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(Number(e.target.value))}
            className="appearance-none px-4 pe-10 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] cursor-pointer"
          >
            {children.map((child, i) => (
              <option key={child.id} value={i}>{locale === "ar" ? child.nameAr : child.nameEn}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#EC4899]" />
          {locale === "ar" ? "تقدم الدورات" : "Course Progress"}
        </h3>
        <div className="space-y-4">
          {courseProgress.map((course, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#0F172A]">{locale === "ar" ? course.courseAr : course.courseEn}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B]">
                    {course.lessonsCompleted}/{course.totalLessons} {locale === "ar" ? "درس" : "lessons"}
                  </span>
                  <span className="text-xs font-bold text-[#EC4899]">{course.progress}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  className={`h-full rounded-full ${course.color}`}
                />
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            {locale === "ar" ? "الدروس المكتملة" : "Completed Lessons"}
          </h3>
          <div className="space-y-3">
            {completedLessons.map((lesson, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{locale === "ar" ? lesson.titleAr : lesson.titleEn}</p>
                  <p className="text-xs text-[#94A3B8]">{locale === "ar" ? lesson.courseAr : lesson.courseEn} • {locale === "ar" ? lesson.dateAr : lesson.dateEn}</p>
                </div>
                {lesson.score > 0 && <span className={`text-sm font-bold ${lesson.score >= 90 ? "text-[#059669]" : "text-primary"}`}>{lesson.score}%</span>}
              </div>
            ))}
          </div>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {locale === "ar" ? "وقت الدراسة الأسبوعي" : "Weekly Study Time"}
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyHours.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-[#64748B]">{day.hours}h</span>
                <div className="w-full relative" style={{ height: "140px" }}>
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.hours / maxHours) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                    className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-[#EC4899] to-[#F472B6]"
                  />
                </div>
                <span className="text-[10px] font-medium text-[#94A3B8]">{locale === "ar" ? day.dayAr : day.dayEn}</span>
              </div>
            ))}
          </div>
        </m.div>
      </div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#F59E0B]" />
          {locale === "ar" ? "الإنجازات الأخيرة" : "Recent Achievements"}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {achievements.map((achievement, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 text-center hover:shadow-sm transition-shadow"
            >
              <achievement.icon className={`w-8 h-8 mx-auto mb-2 ${achievement.color}`} />
              <p className="text-sm font-bold text-[#0F172A]">{locale === "ar" ? achievement.titleAr : achievement.titleEn}</p>
              <p className="text-xs text-[#64748B] mt-1">{locale === "ar" ? achievement.descAr : achievement.descEn}</p>
            </m.div>
          ))}
        </div>
      </m.div>
    </div>
  )
}
