"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { ChevronLeft, ChevronRight, Trophy, Users, UserPlus, Trash2, Loader2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"

interface ClassStudentRow {
  studentId: string
  student: { id: string; name: string; email: string; avatar?: string | null } | null
  totalPoints: number
}

export default function TeacherClassDetailPage() {
  const params = useParams()
  const classId = params?.id as string
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const isRTL = dir === "rtl"
  const BackIcon = isRTL ? ChevronRight : ChevronLeft
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const { data: classRes, loading, refetch } = useApi(() => api.getTeacherClass(classId), { deps: [classId], immediate: !!classId })
  const cls = classRes as any

  const { data: assignedRes } = useApi(() => api.getTeacherAssignedStudents(), { immediate: showAddStudent })
  const assignedStudents = Array.isArray(assignedRes) ? assignedRes : []

  const students: ClassStudentRow[] = Array.isArray(cls?.students) ? cls.students : []
  const memberIds = new Set(students.map((s) => s.studentId))
  const availableToAdd = assignedStudents.filter((s: any) => !memberIds.has(s.id))

  const handleAdd = async (studentId: string) => {
    setAdding(studentId)
    try {
      const res = await api.addStudentToTeacherClass(classId, studentId)
      if (res.success) {
        showToast(locale === "ar" ? "تمت الإضافة" : "Added")
        refetch()
      } else {
        showToast(res.message || (locale === "ar" ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "خطأ" : "Error", "error")
    } finally {
      setAdding(null)
    }
  }

  const handleRemove = async (studentId: string) => {
    setRemoving(studentId)
    try {
      const res = await api.removeStudentFromTeacherClass(classId, studentId)
      if (res.success) {
        showToast(locale === "ar" ? "تم الحذف" : "Removed")
        refetch()
      } else {
        showToast(res.message || (locale === "ar" ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "خطأ" : "Error", "error")
    } finally {
      setRemoving(null)
    }
  }

  if (loading || !cls) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#059669]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher-dashboard/classes"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-2 transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          {locale === "ar" ? "العودة للصفوف" : "Back to Classes"}
        </Link>
        <h1 className="text-2xl font-bold text-[#0F172A]">{cls.name}</h1>
        {cls.subject && <p className="text-sm text-[#64748B] mt-1">{cls.subject}</p>}
        {cls.course && (
          <p className="text-sm text-[#059669] font-medium mt-1">
            {locale === "ar" ? "الكورس: " : "Course: "}
            {locale === "ar" && cls.course.titleAr ? cls.course.titleAr : cls.course.title}
          </p>
        )}
      </div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {locale === "ar" ? "الترتيب العام" : "Leaderboard"}
          </h2>
          <Button
            size="sm"
            onClick={() => setShowAddStudent(true)}
            className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            {locale === "ar" ? "إضافة طالب" : "Add Student"}
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">{locale === "ar" ? "لا يوجد طلاب في هذا الصف بعد" : "No students in this class yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((s, idx) => (
              <div
                key={s.studentId}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${idx === 0 ? "bg-amber-50" : "bg-[#F8FAFC]"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#64748B] border border-[#E2E8F0]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{s.student?.name ?? "—"}</p>
                    <p className="text-xs text-[#94A3B8]">{s.student?.email ?? ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#059669]">
                    {s.totalPoints} {locale === "ar" ? "نقطة" : "pts"}
                  </span>
                  <button
                    onClick={() => handleRemove(s.studentId)}
                    disabled={removing === s.studentId}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#94A3B8] hover:text-red-500"
                  >
                    {removing === s.studentId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </m.div>

      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "إضافة طالب للصف" : "Add Student to Class"}</h3>
              <button onClick={() => setShowAddStudent(false)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
            {availableToAdd.length === 0 ? (
              <p className="text-sm text-[#64748B] py-6 text-center">
                {locale === "ar" ? "لا يوجد طلاب معينين لك حاليًا لإضافتهم" : "No assigned students available to add"}
              </p>
            ) : (
              <div className="space-y-2">
                {availableToAdd.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{s.name}</p>
                      <p className="text-xs text-[#94A3B8]">{s.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdd(s.id)}
                      disabled={adding === s.id}
                      className="rounded-lg"
                    >
                      {adding === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === "ar" ? "إضافة" : "Add")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </m.div>
        </div>
      )}
    </div>
  )
}
