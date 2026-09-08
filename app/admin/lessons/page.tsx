"use client"

import React, { useState, useEffect } from "react"
import { useApi, api } from "@/hooks/use-api"
import { m } from "framer-motion"
import {
  BookOpen,
  Search,
  Video,
  FileText,
  HelpCircle,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  GripVertical,
  ChevronDown,
  Filter,
  Play,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface Lesson {
  id: string
  title: string
  titleAr?: string
  type: "video" | "text" | "quiz"
  duration?: number
  order?: number
  status?: string
  chapterTitle?: string
  courseId?: string
  courseTitle?: string
}

interface Course {
  id: string
  title: string
  titleAr?: string
  status?: string
}

interface Chapter {
  id: string
  title: string
  titleAr?: string
  lessons?: Lesson[]
}

export default function LessonsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: coursesRes, loading: coursesLoading } = useApi<Course[]>(
    () => api.getAdminCourses(),
    { immediate: true }
  )

  const coursesList: Course[] = (() => {
    const arr = coursesRes as Course[] | undefined
    const paginated = coursesRes as { data?: Course[] } | undefined
    const list = Array.isArray(arr) ? arr : (Array.isArray(paginated?.data) ? paginated.data : null)
    return list ?? []
  })()

  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([])
      return
    }
    let cancelled = false
    const loadLessons = async () => {
      setLessonsLoading(true)
      try {
        const course = coursesList.find(c => c.id === selectedCourseId)
        const res = await api.getCourseCurriculum(selectedCourseId)
        const data = res.data as Chapter[] | undefined
        if (!cancelled && Array.isArray(data)) {
          const flat: Lesson[] = []
          data.forEach((chapter) => {
            if (Array.isArray(chapter.lessons)) {
              chapter.lessons.forEach((lesson) => {
                flat.push({
                  ...lesson,
                  chapterTitle: chapter.title || chapter.titleAr || "",
                  courseId: selectedCourseId,
                  courseTitle: course?.title || course?.titleAr || "",
                })
              })
            }
          })
          setLessons(flat)
        } else if (!cancelled) {
          setLessons([])
        }
      } catch {
        if (!cancelled) {
          showToast(isAr ? "فشل تحميل الدروس" : "Failed to load lessons", "error")
          setLessons([])
        }
      } finally {
        if (!cancelled) setLessonsLoading(false)
      }
    }
    loadLessons()
    return () => { cancelled = true }
  }, [selectedCourseId])

  const filtered = lessons.filter((l) => {
    const matchSearch = (l.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.titleAr || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.chapterTitle || "").toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || l.type === typeFilter
    return matchSearch && matchType
  })

  const totalLessons = lessons.length
  const videoCount = lessons.filter(l => l.type === "video").length
  const textCount = lessons.filter(l => l.type === "text").length
  const quizCount = lessons.filter(l => l.type === "quiz").length

  const typeColors: Record<string, string> = {
    video: "bg-primary/10 text-primary",
    text: "bg-emerald-100 text-emerald-700",
    quiz: "bg-amber-100 text-amber-700",
  }

  const typeLabels: Record<string, { ar: string; en: string }> = {
    video: { ar: "فيديو", en: "Video" },
    text: { ar: "نصي", en: "Text" },
    quiz: { ar: "اختبار", en: "Quiz" },
  }

  const typeIcons: Record<string, React.ReactNode> = {
    video: <Video className="w-3.5 h-3.5" />,
    text: <FileText className="w-3.5 h-3.5" />,
    quiz: <HelpCircle className="w-3.5 h-3.5" />,
  }

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-700",
    hidden: "bg-red-100 text-red-700",
  }

  const statusLabels: Record<string, { ar: string; en: string }> = {
    published: { ar: "منشور", en: "Published" },
    draft: { ar: "مسودة", en: "Draft" },
    hidden: { ar: "مخفي", en: "Hidden" },
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.request(`/lessons/${deleteTarget.id}`, { method: "DELETE" })
      showToast(isAr ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully")
      setLessons(prev => prev.filter(l => l.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      showToast(isAr ? "فشل حذف الدرس" : "Failed to delete lesson", "error")
    } finally {
      setDeleting(false)
    }
  }

  const stats = [
    { label: isAr ? "إجمالي الدروس" : "Total Lessons", value: totalLessons, icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: isAr ? "دروس فيديو" : "Video Lessons", value: videoCount, icon: Video, color: "bg-primary/10 text-primary" },
    { label: isAr ? "دروس نصية" : "Text Lessons", value: textCount, icon: FileText, color: "bg-[#059669]/10 text-[#059669]" },
    { label: isAr ? "اختبارات" : "Quiz Lessons", value: quizCount, icon: HelpCircle, color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  ]

  const isLoading = coursesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة الدروس" : "Lessons Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "عرض وإدارة دروس جميع الدورات" : "View and manage lessons across all courses"}</p>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <m.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
          </m.div>
        ))}
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "بحث عن درس..." : "Search lessons..."}
              className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none appearance-none pe-8 min-w-[180px]"
              >
                <option value="">{isAr ? "اختر دورة" : "Select Course"}</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>{isAr ? (c.titleAr || c.title) : c.title}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none"
            >
              <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
              <option value="video">{isAr ? "فيديو" : "Video"}</option>
              <option value="text">{isAr ? "نصي" : "Text"}</option>
              <option value="quiz">{isAr ? "اختبار" : "Quiz"}</option>
            </select>
          </div>
        </div>
      </m.div>

      {!selectedCourseId ? (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] mb-4">
            <Filter className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "اختر دورة" : "Select a Course"}</h3>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-sm">
            {isAr ? "اختر دورة من القائمة أعلاه لعرض دروسها" : "Choose a course from the dropdown above to view its lessons"}
          </p>
        </m.div>
      ) : lessonsLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] mb-4">
            <BookOpen className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "لا توجد دروس" : "No lessons found"}</h3>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-sm">
            {search || typeFilter !== "all"
              ? (isAr ? "جرب تعديل معايير البحث أو الفلتر" : "Try adjusting your search or filter criteria")
              : (isAr ? "هذه الدورة لا تحتوي على دروس بعد" : "This course doesn't have any lessons yet")}
          </p>
        </m.div>
      ) : (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الدرس" : "Lesson"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الفصل" : "Chapter"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "النوع" : "Type"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "المدة" : "Duration"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الترتيب" : "Order"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lesson) => {
                  const lessonStatus = (lesson.status || "published").toLowerCase()
                  return (
                    <tr key={lesson.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${typeColors[lesson.type] || "bg-gray-100 text-gray-600"}`}>
                            {typeIcons[lesson.type] || <Play className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-sm font-medium text-[#0F172A] line-clamp-1">
                            {isAr ? (lesson.titleAr || lesson.title) : lesson.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B] max-w-[160px] truncate">{lesson.chapterTitle || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${typeColors[lesson.type] || ""}`}>
                          {typeIcons[lesson.type]}
                          {typeLabels[lesson.type] ? (isAr ? typeLabels[lesson.type].ar : typeLabels[lesson.type].en) : lesson.type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 text-sm text-[#64748B]">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(lesson.duration)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 text-sm text-[#64748B]">
                          <GripVertical className="w-3.5 h-3.5" />
                          {lesson.order ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusColors[lessonStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[lessonStatus] ? (isAr ? statusLabels[lessonStatus].ar : statusLabels[lessonStatus].en) : lessonStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              window.open(`/admin/courses?edit=${lesson.courseId}`, "_blank")
                              showToast(isAr ? "يتم فتح صفحة تعديل الدورة" : "Opening course editor", "info")
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#64748B]"
                            title={isAr ? "تعديل" : "Edit"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: lesson.id, title: isAr ? (lesson.titleAr || lesson.title) : lesson.title })}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                            title={isAr ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </m.div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "حذف الدرس" : "Delete Lesson"}</h3>
              <p className="text-sm text-[#64748B] mt-2">
                {isAr ? "هل أنت متأكد من حذف" : "Are you sure you want to delete"}{" "}
                <span className="font-semibold text-[#0F172A]">{deleteTarget.title}</span>
                {isAr ? "؟ لا يمكن التراجع عن هذا الإجراء." : "? This action cannot be undone."}
              </p>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حذف" : "Delete")}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
