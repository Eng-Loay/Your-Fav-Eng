"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApi, api } from "@/hooks/use-api"
import { m, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Search,
  Plus,
  Star,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  EyeOff,
  Grid3X3,
  List,
  Loader2,
  AlertTriangle,
  BarChart3,
  GraduationCap,
  Layers,
  TrendingUp,
  PlayCircle,
  Crown,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import CourseImage from "@/components/admin/courses/course-image"
import { adminStatStyle } from "@/lib/admin-theme"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.04 } } }

const paymentMethodLabels: Record<string, string> = {
  card: "بطاقة ائتمان",
  stripe: "Stripe",
  payment_request: "طلب دفع يدوي",
  bank_transfer: "تحويل بنكي",
  cash: "نقدي",
  other: "أخرى",
}

interface CourseItem {
  id: string
  title: string
  titleAr: string
  instructor: string
  thumbnail: string
  students: number
  rating: number
  price: number
  status: "published" | "draft" | "hidden" | "pending" | "review"
  category: string
  description: string
  featured: boolean
  revenue: number
  totalRevenue?: number
  revenueByPaymentMethod?: Record<string, number>
  lessonsCount: number
  level: string
}

export default function CoursesPage() {
  const router = useRouter()
  const { showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [openAction, setOpenAction] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const paramsRef = useRef({ search, statusFilter })
  paramsRef.current = { search, statusFilter }
  const { data: coursesRes, loading, refetch } = useApi(() =>
    api.getAdminCourses({
      search: paramsRef.current.search || undefined,
      status: paramsRef.current.statusFilter !== "all" ? paramsRef.current.statusFilter : undefined,
    })
  )
  useEffect(() => { refetch() }, [search, statusFilter])

  const courses: CourseItem[] = (() => {
    const raw = coursesRes as any
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : null
    if (!list || list.length === 0) return []
    return list.map((c: any) => ({
      id: c.id,
      title: c.title ?? "",
      titleAr: c.titleAr ?? c.title ?? "",
      instructor: typeof c.instructor === "string" ? c.instructor : c.instructor?.name ?? "",
      thumbnail: c.thumbnail ?? c.imageUrl ?? c.uploadedImage ?? "",
      students: c.students ?? c._count?.enrollments ?? 0,
      rating: c.rating ?? 0,
      price: c.price ?? 0,
      status: ((c.status ?? "published").toLowerCase()) as CourseItem["status"],
      category: c.category ?? "",
      description: c.description ?? "",
      featured: c.featured ?? false,
      revenue: c.revenue ?? (c.students ?? 0) * (c.price ?? 0),
      totalRevenue: c.totalRevenue,
      revenueByPaymentMethod: c.revenueByPaymentMethod ?? {},
      lessonsCount: c.lessonsCount ?? c._count?.lessons ?? 0,
      level: c.level ?? "beginner",
    }))
  })()

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalStudents = courses.reduce((a, c) => a + c.students, 0)
  const totalRevenue = courses.reduce((a, c) => a + c.revenue, 0)
  const publishedCount = courses.filter((c) => c.status === "published").length
  const reviewCount = courses.filter((c) => c.status === "review" || c.status === "pending").length

  const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
    published: { label: "منشور", bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    draft: { label: "مسودة", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
    hidden: { label: "مخفي", bg: "bg-red-50 text-red-600", dot: "bg-red-400" },
    pending: { label: "قيد المراجعة", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
    review: { label: "قيد المراجعة", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  }

  const stats = [
    { label: "إجمالي الدورات", value: courses.length, icon: BookOpen, ...adminStatStyle(0) },
    { label: "الدورات المنشورة", value: publishedCount, icon: CheckCircle, ...adminStatStyle(1) },
    { label: "إجمالي الطلاب", value: totalStudents.toLocaleString(), icon: Users, ...adminStatStyle(2) },
    { label: "إيرادات المنصة", value: formatCurrency(totalRevenue), icon: TrendingUp, ...adminStatStyle(3) },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.request("/admin/courses/" + deleteTarget.id, { method: "DELETE" })
      showToast("تم حذف الدورة بنجاح")
      setDeleteTarget(null)
      refetch()
    } catch {
      showToast("فشل حذف الدورة", "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusToggle = async (course: CourseItem) => {
    try {
      const newStatus = course.status === "published" ? "hidden" : "published"
      const res = await api.updateCourseStatus(course.id, newStatus.toUpperCase())
      if (res.success) {
        showToast("تم تحديث حالة الدورة")
        setOpenAction(null)
        refetch()
      } else showToast(res.message || "فشل تحديث الحالة", "error")
    } catch {
      showToast("فشل تحديث الحالة", "error")
    }
  }

  const handleApproveCourse = async (course: CourseItem) => {
    try {
      const res = await api.updateCourseStatus(course.id, "PUBLISHED")
      if (res.success) {
        showToast("تمت الموافقة على الدورة")
        setOpenAction(null)
        refetch()
      } else showToast(res.message || "فشل", "error")
    } catch {
      showToast("فشل الموافقة", "error")
    }
  }

  const handleToggleFeatured = async (course: CourseItem) => {
    try {
      const res = await api.updateAdminCourse(course.id, { featured: !course.featured })
      if (res.success) {
        showToast(course.featured ? "تم إلغاء التميز" : "تم إظهار الدورة في الصفحة الرئيسية")
        setOpenAction(null)
        refetch()
      } else showToast(res.message || "فشل", "error")
    } catch {
      showToast("فشل التحديث", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-slate-400">جاري تحميل الدورات...</p>
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الدورات</h1>
          <p className="text-sm text-slate-500 mt-1">إنشاء وإدارة جميع دورات المنصة</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25/25 h-11 px-6">
            <Plus className="w-4 h-4" />
            إنشاء دورة جديدة
          </Button>
        </Link>
      </m.div>

      {/* Pending Approval Banner */}
      {reviewCount > 0 && (
        <m.div variants={fadeUp} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800">
                {reviewCount} {reviewCount === 1 ? "دورة" : "دورات"} بانتظار الموافقة
              </p>
              <p className="text-sm text-amber-700">الدورات المرفوعة من المدرسين/الانستراكتور تحتاج موافقة الأدمن للنشر</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("review")}
            className="rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            عرض الدورات
          </button>
        </m.div>
      )}

      {/* Stats */}
      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <m.div
            key={i}
            variants={fadeUp}
            className="relative overflow-hidden bg-white rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} ${s.icon} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-[0.07]`} />
          </m.div>
        ))}
      </m.div>

      {/* Filters */}
      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 flex-1 max-w-md border border-slate-200/60">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في الدورات..."
              className="bg-transparent text-sm outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
              {[
                { value: "all", label: "الكل" },
                { value: "review", label: "قيد الموافقة" },
                { value: "published", label: "منشور" },
                { value: "draft", label: "مسودة" },
                { value: "hidden", label: "مخفي" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === item.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex border border-slate-200/60 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${
                  viewMode === "grid" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${
                  viewMode === "list" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </m.div>

      {/* Empty State */}
      {filtered.length === 0 && !loading ? (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-5">
            <GraduationCap className="w-10 h-10 text-primary/30" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">لا توجد دورات</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            {search || statusFilter !== "all"
              ? "جرب تعديل معايير البحث أو الفلتر"
              : "ابدأ بإنشاء أول دورة للمنصة"}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/admin/courses/new">
              <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white mt-5">
                <Plus className="w-4 h-4" /> إنشاء دورة جديدة
              </Button>
            </Link>
          )}
        </m.div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <m.div
              key={course.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-lg hover:border-slate-300/60 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <CourseImage
                  src={course.thumbnail}
                  alt={course.titleAr || course.title}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Status Badge */}
                <div className="absolute top-3 start-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm ${statusConfig[course.status]?.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[course.status]?.dot}`} />
                    {statusConfig[course.status]?.label}
                  </span>
                </div>

                {/* Featured */}
                {course.featured && (
                  <div className="absolute top-3 end-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
                      <Crown className="w-3 h-3" /> مميز
                    </span>
                  </div>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute bottom-3 start-3 end-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Link href={`/admin/courses/${course.id}`} className="flex-1">
                    <Button size="sm" className="w-full rounded-lg bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm h-8 text-xs">
                      <BarChart3 className="w-3 h-3 ml-1" /> تحليلات
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}/content`} className="flex-1">
                    <Button size="sm" className="w-full rounded-lg bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm h-8 text-xs">
                      <Layers className="w-3 h-3 ml-1" /> المحتوى
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{course.titleAr || course.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{course.instructor}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200/60 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      title="تعديل"
                      aria-label="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setOpenAction(openAction === course.id ? null : course.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="المزيد"
                      >
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    <AnimatePresence>
                      {openAction === course.id && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute end-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/60 py-1.5 z-30"
                        >
                          <button
                            onClick={() => handleToggleFeatured(course)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm w-full ${course.featured ? "text-amber-600 hover:bg-amber-50" : "text-slate-600 hover:bg-slate-50"}`}
                          >
                            <Crown className="w-3.5 h-3.5" />
                            {course.featured ? "إلغاء الظهور في الصفحة الرئيسية" : "إظهار في الصفحة الرئيسية"}
                          </button>
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            onClick={() => setOpenAction(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                          >
                            <Edit className="w-3.5 h-3.5" /> تعديل الدورة
                          </Link>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            onClick={() => setOpenAction(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                          >
                            <BarChart3 className="w-3.5 h-3.5" /> التحليلات
                          </Link>
                          <Link
                            href={`/admin/courses/${course.id}/content`}
                            onClick={() => setOpenAction(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> إضافة درس
                          </Link>
                          {(course.status === "review" || course.status === "pending") ? (
                            <button
                              onClick={() => handleApproveCourse(course)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> موافقة
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(course)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                            >
                              {course.status === "published" ? (
                                <><EyeOff className="w-3.5 h-3.5" /> إخفاء</>
                              ) : (
                                <><Eye className="w-3.5 h-3.5" /> نشر</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              window.open("/courses/" + course.id, "_blank")
                              setOpenAction(null)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                          >
                            <Eye className="w-3.5 h-3.5" /> معاينة
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: course.id, title: course.titleAr || course.title })
                              setOpenAction(null)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> حذف
                          </button>
                        </m.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Category + Level */}
                <div className="flex items-center gap-2 mb-3">
                  {course.category && (
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-100">
                      {course.category}
                    </Badge>
                  )}
                  {course.level && (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/10">
                      {course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}
                    </Badge>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.students}
                    </span>
                    {course.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" /> {course.rating}
                      </span>
                    )}
                    {course.lessonsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" /> {course.lessonsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {course.price === 0 ? "مجاني" : formatCurrency(course.price)}
                  </span>
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      ) : (
        /* List View */
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-start px-5 py-3.5 font-semibold">الدورة</th>
                  <th className="text-start px-3 py-3.5 font-semibold">المدرب</th>
                  <th className="text-start px-3 py-3.5 font-semibold">الطلاب</th>
                  <th className="text-start px-3 py-3.5 font-semibold">الإيرادات</th>
                  <th className="text-start px-3 py-3.5 font-semibold">السعر</th>
                  <th className="text-start px-3 py-3.5 font-semibold">الحالة</th>
                  <th className="text-start px-3 py-3.5 font-semibold">الظهور</th>
                  <th className="text-start px-3 py-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-[72px] overflow-hidden rounded-lg shrink-0 bg-slate-100">
                          <CourseImage src={course.thumbnail} alt={course.titleAr || course.title} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors line-clamp-1"
                          >
                            {course.titleAr || course.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {course.category && (
                              <span className="text-[10px] text-slate-400">{course.category}</span>
                            )}
                            {course.featured && (
                              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> مميز
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600">{course.instructor}</td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm font-medium text-slate-900">{course.students.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="text-sm font-semibold text-emerald-600 cursor-help"
                        title={
                          Object.keys(course.revenueByPaymentMethod || {}).length > 0
                            ? `حسب طريقة الدفع:\n${Object.entries(course.revenueByPaymentMethod!)
                                .map(([k, v]) => `${paymentMethodLabels[k] || k}: ${formatCurrency(v)}`)
                                .join("\n")}`
                            : undefined
                        }
                      >
                        {formatCurrency(course.revenue)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm font-bold text-primary">
                        {course.price === 0 ? "مجاني" : formatCurrency(course.price)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusConfig[course.status]?.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[course.status]?.dot}`} />
                        {statusConfig[course.status]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <Switch
                        checked={course.status === "published"}
                        onCheckedChange={() => handleStatusToggle(course)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200/60 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          title="تعديل"
                          aria-label="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <div className="relative">
                          <button
                            onClick={() => setOpenAction(openAction === course.id ? null : course.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="المزيد"
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                        <AnimatePresence>
                          {openAction === course.id && (
                            <m.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute end-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/60 py-1.5 z-30"
                            >
                              <button
                                onClick={() => handleToggleFeatured(course)}
                                className={`flex items-center gap-2.5 px-3 py-2 text-sm w-full ${course.featured ? "text-amber-600 hover:bg-amber-50" : "text-slate-600 hover:bg-slate-50"}`}
                              >
                                <Crown className="w-3.5 h-3.5" />
                                {course.featured ? "إلغاء الظهور في الرئيسية" : "إظهار في الصفحة الرئيسية"}
                              </button>
                              <Link
                                href={`/admin/courses/${course.id}/edit`}
                                onClick={() => setOpenAction(null)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                              >
                                <Edit className="w-3.5 h-3.5" /> تعديل
                              </Link>
                              <Link
                                href={`/admin/courses/${course.id}`}
                                onClick={() => setOpenAction(null)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                              >
                                <BarChart3 className="w-3.5 h-3.5" /> تحليلات
                              </Link>
                              <Link
                                href={`/admin/courses/${course.id}/content`}
                                onClick={() => setOpenAction(null)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> إضافة درس
                              </Link>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => {
                                  setDeleteTarget({ id: course.id, title: course.titleAr || course.title })
                                  setOpenAction(null)
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> حذف
                              </button>
                            </m.div>
                          )}
                        </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </m.div>
      )}

      {/* Floating Add Button (Mobile) */}
      <Link href="/admin/courses/new" className="fixed bottom-6 left-6 z-40 lg:hidden">
        <Button className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25/30 p-0">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      {/* Delete Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            >
              <div className="p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">حذف الدورة</h3>
                <p className="text-sm text-slate-500 mt-2">
                  هل أنت متأكد من حذف{" "}
                  <span className="font-semibold text-slate-900">{deleteTarget.title}</span>
                  ؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
                </Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menus */}
      {openAction && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenAction(null)} />
      )}
    </m.div>
  )
}
