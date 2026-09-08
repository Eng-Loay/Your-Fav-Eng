"use client"

import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
  Eye,
  CheckCircle,
  Play,
  Star,
  Target,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const monthLabelsAnalytics: Record<string, { en: string; ar: string }> = {
  Jan: { en: "Jan", ar: "يناير" }, Feb: { en: "Feb", ar: "فبراير" }, Mar: { en: "Mar", ar: "مارس" },
  Apr: { en: "Apr", ar: "أبريل" }, May: { en: "May", ar: "مايو" }, Jun: { en: "Jun", ar: "يونيو" },
  Jul: { en: "Jul", ar: "يوليو" }, Aug: { en: "Aug", ar: "أغسطس" }, Sep: { en: "Sep", ar: "سبتمبر" },
  Oct: { en: "Oct", ar: "أكتوبر" }, Nov: { en: "Nov", ar: "نوفمبر" }, Dec: { en: "Dec", ar: "ديسمبر" },
}

function parseMonthKey(key: string): string {
  if (!key || key.length < 7) return "Jan"
  const m = parseInt(key.slice(5, 7), 10)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months[m - 1] ?? "Jan"
}

export default function TeacherAnalyticsPage() {
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"

  const { data: metricsData } = useApi(() => api.getInstructorAnalyticsMetrics())
  const { data: enrollmentsData } = useApi(() => api.getInstructorAnalyticsEnrollments())
  const { data: coursesData } = useApi(() => api.getInstructorAnalyticsCourses())
  const { data: popularLessonsData } = useApi(() => api.getInstructorPopularLessons())

  const apiMetrics = metricsData as { totalEnrollments?: number; completionRate?: number; totalWatchTime?: number; totalCourses?: number } | null
  const enrollmentsRaw = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData as { data?: any[] })?.data ?? []
  const enrollmentTrendsDisplay = enrollmentsRaw.map((e: any) => {
    const monthKey = parseMonthKey(e.month ?? "2025-01")
    return {
      monthEn: monthKey,
      monthAr: monthLabelsAnalytics[monthKey]?.ar ?? "يناير",
      value: e.value ?? e.count ?? 0,
    }
  })
  const coursesRaw = Array.isArray(coursesData) ? coursesData : (coursesData as { data?: any[] })?.data ?? []
  const coursePerformanceDisplay = coursesRaw.map((c: any) => ({
    titleEn: c.title ?? c.name ?? "Course",
    titleAr: c.titleAr ?? c.nameAr ?? "دورة",
    enrollments: c.totalStudents ?? c.enrollments ?? 0,
    completion: c.completionRate ?? c.completion ?? 0,
    rating: c.averageRating ?? c.rating ?? 0,
    watchHours: Math.round((c.totalWatchTime ?? c.watchTime ?? 0) / 3600),
  }))
  const popularRaw = Array.isArray(popularLessonsData) ? popularLessonsData : (popularLessonsData as { data?: any[] })?.data ?? []
  const popularLessonsDisplay = popularRaw.map((l: any) => {
    const lesson = l.lesson ?? l
    const course = lesson?.chapter?.course ?? l.course ?? {}
    const courseTitle = typeof course === "string" ? course : (course.title ?? "")
    return {
      titleEn: lesson.title ?? l.title ?? "Lesson",
      titleAr: lesson.titleAr ?? l.titleAr ?? "درس",
      views: l.views ?? l.viewCount ?? 0,
      courseEn: courseTitle || (l.courseTitle ?? "Course"),
      courseAr: ((typeof course === "object" && course?.titleAr) || l.courseTitleAr) ?? "دورة",
    }
  })

  const maxEnrollment = Math.max(...enrollmentTrendsDisplay.map(e => e.value), 1)
  const completionRate = apiMetrics?.completionRate ?? 0
  const watchTimeHours = Math.round((apiMetrics?.totalWatchTime ?? 0) / 3600)
  const totalEnrollments = apiMetrics?.totalEnrollments ?? 0

  const metrics = [
    { labelEn: "Total Enrollments", labelAr: "إجمالي التسجيلات", value: totalEnrollments.toLocaleString(), icon: Users, color: "from-[#7C3AED] to-[#8B5CF6]", change: "" },
    { labelEn: "Avg. Completion", labelAr: "متوسط الإكمال", value: `${Math.round(completionRate * 100)}%`, icon: CheckCircle, color: "from-emerald-500 to-emerald-400", change: "" },
    { labelEn: "Watch Time", labelAr: "وقت المشاهدة", value: `${watchTimeHours.toLocaleString()}h`, icon: Clock, color: "from-primary to-primary/90", change: "" },
    { labelEn: "Total Courses", labelAr: "إجمالي الدورات", value: String(apiMetrics?.totalCourses ?? 0), icon: Target, color: "from-amber-500 to-amber-400", change: "" },
  ]

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          {locale === "ar" ? "التحليلات" : "Analytics"}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {locale === "ar" ? "تتبع أداء دوراتك وتفاعل الطلاب" : "Track your course performance and student engagement"}
        </p>
      </m.div>

      <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <m.div
            key={m.labelEn}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} shadow-md`}>
                <m.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-50">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">{m.change}</span>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#0F172A]">{m.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1 font-medium">
              {locale === "ar" ? m.labelAr : m.labelEn}
            </p>
          </m.div>
        ))}
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                <Users className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                {locale === "ar" ? "اتجاهات التسجيل" : "Enrollment Trends"}
              </h3>
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">
              {locale === "ar" ? "آخر 6 أشهر" : "Last 6 months"}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3 h-44">
            {enrollmentTrendsDisplay.map((e, i) => (
              <div key={e.monthEn} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-[10px] font-bold text-[#0F172A]">{e.value}</span>
                <m.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(e.value / maxEnrollment) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                  className={`w-full max-w-[36px] rounded-xl ${
                    i === enrollmentTrendsDisplay.length - 1
                      ? "bg-gradient-to-t from-[#7C3AED] to-[#8B5CF6] shadow-md shadow-[#8B5CF6]/20"
                      : "bg-[#F1F5F9] hover:bg-[#8B5CF6]/10 transition-colors"
                  }`}
                />
                <span className={`text-[10px] font-medium ${i === enrollmentTrendsDisplay.length - 1 ? "text-[#8B5CF6] font-bold" : "text-[#94A3B8]"}`}>
                  {locale === "ar" ? e.monthAr : e.monthEn}
                </span>
              </div>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              {locale === "ar" ? "معدلات الإكمال" : "Completion Rates"}
            </h3>
          </div>
          <div className="space-y-4">
            {coursePerformanceDisplay.map((c, i) => (
              <m.div
                key={c.titleEn}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-[#0F172A] truncate max-w-[200px]">
                    {locale === "ar" ? c.titleAr : c.titleEn}
                  </p>
                  <span className={`text-xs font-bold ${c.completion >= 75 ? "text-emerald-600" : c.completion >= 60 ? "text-[#8B5CF6]" : "text-amber-600"}`}>
                    {c.completion}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.completion}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      c.completion >= 75 ? "bg-emerald-500" : c.completion >= 60 ? "bg-[#8B5CF6]" : "bg-amber-500"
                    }`}
                  />
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            {locale === "ar" ? "أداء الدورات" : "Course Performance"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/60">
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "الدورة" : "Course"}</th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "التسجيلات" : "Enrollments"}</th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">{locale === "ar" ? "الإكمال" : "Completion"}</th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">{locale === "ar" ? "التقييم" : "Rating"}</th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">{locale === "ar" ? "ساعات المشاهدة" : "Watch Hours"}</th>
              </tr>
            </thead>
            <tbody>
              {coursePerformanceDisplay.map((c, i) => (
                <m.tr
                  key={c.titleEn}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="border-b border-[#E2E8F0]/40"
                >
                  <td className="py-3.5">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {locale === "ar" ? c.titleAr : c.titleEn}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-sm font-semibold text-[#64748B]">{c.enrollments}</span>
                  </td>
                  <td className="py-3.5 hidden sm:table-cell">
                    <span className={`text-sm font-bold ${c.completion >= 75 ? "text-emerald-600" : "text-[#8B5CF6]"}`}>
                      {c.completion}%
                    </span>
                  </td>
                  <td className="py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-[#0F172A]">{c.rating}</span>
                    </div>
                  </td>
                  <td className="py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-[#64748B]">{c.watchHours.toLocaleString()}h</span>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            {locale === "ar" ? "الدروس الأكثر شعبية" : "Popular Lessons"}
          </h3>
        </div>
        <div className="space-y-3">
          {popularLessonsDisplay.map((lesson, i) => (
            <m.div
              key={lesson.titleEn}
              initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="flex items-center gap-4 rounded-xl p-3 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0F172A] truncate">
                  {locale === "ar" ? lesson.titleAr : lesson.titleEn}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {locale === "ar" ? lesson.courseAr : lesson.courseEn}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="text-xs font-bold text-[#0F172A]">{lesson.views.toLocaleString()}</span>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>
    </div>
  )
}
