"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Plus,
  Search,
  Filter,
  Users,
  Star,
  DollarSign,
  Eye,
  Edit3,
  BarChart3,
  Trash2,
  MoreVertical,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

type CourseStatus = "published" | "draft" | "review"

export default function TeacherCoursesPage() {
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | CourseStatus>("all")
  const [activeMenu, setActiveMenu] = useState<number | string | null>(null)

  const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api") : "http://localhost:5001/api"
  const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, "")

  const { data: coursesRes, loading: coursesLoading, error: coursesError, refetch } = useApi(() => api.getInstructorCourses())
  const coursesRaw = (() => {
    const raw = coursesRes as any
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data
    if (raw?.items && Array.isArray(raw.items)) return raw.items
    return []
  })()
  const coursesDisplay = coursesRaw.map((c: any, i: number) => {
    const statusStr = String(c.status ?? "PUBLISHED").toUpperCase()
    const status: CourseStatus =
      statusStr === "DRAFT" ? "draft"
      : ["PENDING_REVIEW", "REVIEW", "PENDING"].includes(statusStr) ? "review"
      : "published"
    const thumb = c.thumbnail ?? c.imageUrl ?? c.uploadedImage ?? ""
    const thumbnail = thumb && thumb.startsWith("/") && !thumb.startsWith("//") ? `${UPLOADS_BASE}${thumb}` : thumb
    return {
      id: c.id ?? String(i + 1),
      slug: c.slug ?? c.id,
      titleEn: c.title ?? c.name ?? "Course",
      titleAr: c.titleAr ?? c.nameAr ?? c.title ?? "دورة",
      students: c.totalStudents ?? c.students ?? c._count?.enrollments ?? 0,
      rating: c.averageRating ?? c.rating ?? 0,
      revenue: c.revenue ?? 0,
      status,
      lessons: c.lessons ?? c.totalLessons ?? c.lessonsCount ?? c._count?.lessons ?? 0,
      hours: c.hours ?? c.totalHours ?? c.duration ?? 0,
      thumbnail: thumbnail || undefined,
    }
  })

  const statusConfig: Record<CourseStatus, { labelEn: string; labelAr: string; color: string; icon: React.ElementType }> = {
    published: { labelEn: "Published", labelAr: "منشور", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    draft: { labelEn: "Draft", labelAr: "مسودة", color: "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]", icon: Clock },
    review: { labelEn: "Under Review", labelAr: "قيد المراجعة", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
  }

  const handleDelete = useCallback(async (courseId: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?")) return
    setActiveMenu(null)
    const res = await api.deleteCourse(courseId)
    if (res.success) refetch()
  }, [locale, refetch])

  const filtered = coursesDisplay.filter(c => {
    const matchesSearch = (locale === "ar" ? c.titleAr : c.titleEn).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "دوراتي" : "My Courses"}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar" ? `${coursesDisplay.length} دورات إجمالاً` : `${coursesDisplay.length} courses total`}
          </p>
        </div>
        <Link href="/teacher-dashboard/courses/new">
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-xl bg-[#8B5CF6] text-white px-5 py-3 text-sm font-bold shadow-lg shadow-[#8B5CF6]/25 hover:bg-[#7C3AED] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {locale === "ar" ? "إنشاء دورة جديدة" : "Create New Course"}
          </m.button>
        </Link>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-[#E2E8F0]/60 flex-1">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder={locale === "ar" ? "بحث في الدورات..." : "Search courses..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none flex-1"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "draft", "review"] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20"
                  : "bg-white text-[#64748B] border border-[#E2E8F0]/60 hover:border-[#8B5CF6]/20"
              }`}
            >
              {status === "all"
                ? (locale === "ar" ? "الكل" : "All")
                : (locale === "ar" ? statusConfig[status].labelAr : statusConfig[status].labelEn)
              }
            </button>
          ))}
        </div>
      </m.div>

      <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {coursesLoading ? (
          <div className="col-span-full py-12 text-center text-[#94A3B8]">
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : coursesError ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-500 mb-2">{coursesError}</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-[#8B5CF6] hover:underline"
            >
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#94A3B8]">
            {locale === "ar" ? "لا توجد دورات" : "No courses yet"}
          </div>
        ) : filtered.map((course, i) => {
          const sc = statusConfig[course.status]
          return (
            <m.div
              key={course.id}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="relative h-40 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-[#8B5CF6]/30" />
                )}
                <div className="absolute top-3 start-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${sc.color}`}>
                    <sc.icon className="w-3 h-3" />
                    {locale === "ar" ? sc.labelAr : sc.labelEn}
                  </div>
                </div>
                <div className="absolute top-3 end-3">
                  <button
                    onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-[#64748B]" />
                  </button>
                  {activeMenu === course.id && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-10 end-0 w-40 rounded-xl bg-white border border-[#E2E8F0] shadow-xl z-10 overflow-hidden"
                    >
                      <Link
                        href={`/teacher-dashboard/courses/${course.id}/content`}
                        onClick={() => setActiveMenu(null)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {locale === "ar" ? "إضافة محتوى" : "Add content"}
                      </Link>
                      <Link
                        href={`/teacher-dashboard/courses/${course.id}/edit`}
                        onClick={() => setActiveMenu(null)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </Link>
                      <button
                        onClick={() => { window.open(`/courses/${course.id}`, "_blank"); setActiveMenu(null) }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {locale === "ar" ? "معاينة" : "Preview"}
                      </button>
                      <Link
                        href="/teacher-dashboard/analytics"
                        onClick={() => setActiveMenu(null)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        {locale === "ar" ? "تحليلات" : "Analytics"}
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {locale === "ar" ? "حذف" : "Delete"}
                      </button>
                    </m.div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-[#0F172A] mb-3 group-hover:text-[#8B5CF6] transition-colors">
                  {locale === "ar" ? course.titleAr : course.titleEn}
                </h3>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8] mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.lessons} {locale === "ar" ? "درس" : "lessons"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.hours} {locale === "ar" ? "ساعة" : "hours"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]/60">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs font-semibold text-[#0F172A]">{course.students}</span>
                  </div>
                  {course.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-[#0F172A]">{course.rating}</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-emerald-600">
                    {formatCurrency(course.revenue)}
                  </span>
                </div>
              </div>
            </m.div>
          )
        })}
      </m.div>
    </div>
  )
}
