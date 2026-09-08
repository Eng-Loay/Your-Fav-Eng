"use client"

import { useState } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { BookOpen, Users, Clock, Plus, ChevronRight, ChevronLeft, MoreVertical } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const colors = ["from-[#059669] to-[#10B981]", "from-primary to-primary/90", "from-[#8B5CF6] to-[#A78BFA]", "from-[#F59E0B] to-[#FBBF24]"]

export default function TeacherClassesPage() {
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createSubject, setCreateSubject] = useState("")
  const [createCourseId, setCreateCourseId] = useState("")
  const { showToast } = useStore()

  const { data: classesRes, refetch } = useApi(() => api.getTeacherClasses())
  const { data: coursesRes } = useApi(() => api.getInstructorCourses({ limit: 100 }))

  const myCourses = (() => {
    const r = coursesRes as { data?: any[] } | any[] | undefined
    const arr = Array.isArray(r) ? r : (r?.data ?? [])
    return arr as { id: string; title: string; titleAr?: string }[]
  })()

  const classesData = (() => {
    const arr = classesRes as { id: string; name?: string; subject?: string; status?: string; course?: { id: string; title: string; titleAr?: string } | null; _count?: { students?: number; assignments?: number } }[] | undefined
    if (!Array.isArray(arr)) return []
    return arr.map((c, i) => ({
      id: c.id,
      nameEn: c.name ?? "",
      nameAr: c.name ?? "",
      subjectEn: c.subject ?? "",
      subjectAr: c.subject ?? "",
      courseTitle: (locale === "ar" && c.course?.titleAr) ? c.course.titleAr : c.course?.title,
      students: c._count?.students ?? 0,
      scheduleEn: "",
      scheduleAr: "",
      color: colors[i % colors.length],
      progress: 50,
    }))
  })()

  const handleCreate = async () => {
    if (!createCourseId) {
      showToast(locale === "ar" ? "اختار الكورس المرتبط بالمجموعة" : "Select the course this group is for", "error")
      return
    }
    const res = await api.createTeacherClass({ name: createName, subject: createSubject, courseId: createCourseId })
    if (res.success) {
      setShowCreate(false)
      setCreateName("")
      setCreateSubject("")
      setCreateCourseId("")
      refetch()
    } else {
      showToast(res.message || (locale === "ar" ? "فشل الإنشاء" : "Failed to create"), "error")
    }
  }

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "صفوفي" : "My Classes"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "إدارة صفوفك الدراسية" : "Manage your classes"}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-2 shadow-lg shadow-[#059669]/25">
          <Plus className="w-4 h-4" />
          {locale === "ar" ? "إنشاء صف جديد" : "Create Class"}
        </Button>
      </m.div>

      {classesData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">{locale === "ar" ? "لا توجد صفوف بعد. أنشئ صف جديد." : "No classes yet. Create a new one."}</p>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 gap-5">
        {classesData.map((cls, i) => (
          <m.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            <div className={`h-2 bg-gradient-to-r ${cls.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? cls.nameAr : cls.nameEn}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{locale === "ar" ? cls.subjectAr : cls.subjectEn}</p>
                  {cls.courseTitle && (
                    <p className="text-[11px] text-[#059669] font-medium mt-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {cls.courseTitle}
                    </p>
                  )}
                </div>
                <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                  <MoreVertical className="w-4 h-4 text-[#94A3B8]" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{cls.students} {locale === "ar" ? "طالب" : "students"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{locale === "ar" ? cls.scheduleAr : cls.scheduleEn}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#64748B]">{locale === "ar" ? "تقدم المنهج" : "Curriculum Progress"}</span>
                  <span className="text-xs font-bold text-[#059669]">{cls.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cls.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${cls.color}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]/60">
                <Badge variant="secondary" className="text-[10px] bg-[#059669]/10 text-[#059669] border-0">
                  {locale === "ar" ? "نشط" : "Active"}
                </Badge>
                <Link href={`/teacher-dashboard/classes/${cls.id}`} className="text-xs text-[#059669] font-semibold hover:underline flex items-center gap-1">
                  {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                  {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
              </div>
            </div>
          </m.div>
        ))}
      </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#0F172A] mb-4">{locale === "ar" ? "إنشاء صف جديد" : "Create Class"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الاسم" : "Name"}</label>
                <input value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "المادة" : "Subject"}</label>
                <input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                  {locale === "ar" ? "الكورس المرتبط بالمجموعة *" : "Course this group is for *"}
                </label>
                <select
                  value={createCourseId}
                  onChange={(e) => setCreateCourseId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                >
                  <option value="">{locale === "ar" ? "اختار الكورس..." : "Select course..."}</option>
                  {myCourses.map((c) => (
                    <option key={c.id} value={c.id}>{locale === "ar" && c.titleAr ? c.titleAr : c.title}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {locale === "ar" ? "الطالب هيقدر يشوف الكورس ده في الداشبورد لما تضيفه للمجموعة" : "Students will see this course on their dashboard once added to this group"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleCreate} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl">{locale === "ar" ? "إنشاء" : "Create"}</Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
