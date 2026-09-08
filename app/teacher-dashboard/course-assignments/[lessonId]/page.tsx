"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { ChevronLeft, ChevronRight, FileText, Loader2, CheckCircle2, ExternalLink } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Submission {
  id: string
  studentId: string
  content?: string | null
  fileUrl?: string | null
  grade?: number | null
  feedback?: string | null
  submittedAt: string
  gradedAt?: string | null
  student: { id: string; name: string; avatar?: string | null } | null
}

export default function TeacherCourseAssignmentGradingPage() {
  const params = useParams()
  const lessonId = params?.lessonId as string
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const isRTL = dir === "rtl"
  const BackIcon = isRTL ? ChevronRight : ChevronLeft
  const [drafts, setDrafts] = useState<Record<string, { grade: string; feedback: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const { data: assignmentRes, loading, refetch } = useApi(() => api.getInstructorAssignmentByLesson(lessonId), { deps: [lessonId], immediate: !!lessonId })
  const assignment = assignmentRes as any
  const submissions: Submission[] = Array.isArray(assignment?.submissions) ? assignment.submissions : []

  const getDraft = (s: Submission) =>
    drafts[s.id] ?? { grade: s.grade != null ? String(s.grade) : "", feedback: s.feedback ?? "" }

  const setDraft = (id: string, updates: Partial<{ grade: string; feedback: string }>) => {
    setDrafts((prev) => {
      const submission = submissions.find((s) => s.id === id)
      const base = prev[id] ?? { grade: submission?.grade != null ? String(submission.grade) : "", feedback: submission?.feedback ?? "" }
      return { ...prev, [id]: { ...base, ...updates } }
    })
  }

  const handleGrade = async (s: Submission) => {
    const draft = getDraft(s)
    const gradeNum = draft.grade.trim() === "" ? undefined : Number(draft.grade)
    if (gradeNum !== undefined && Number.isNaN(gradeNum)) {
      showToast(locale === "ar" ? "الدرجة لازم تكون رقم" : "Grade must be a number", "error")
      return
    }
    setSaving(s.id)
    try {
      const res = await api.gradeInstructorAssignmentSubmission(assignment.id, s.studentId, { grade: gradeNum, feedback: draft.feedback || undefined })
      if (res.success) {
        showToast(locale === "ar" ? "تم حفظ الدرجة" : "Grade saved")
        refetch()
      } else {
        showToast(res.message || (locale === "ar" ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "خطأ" : "Error", "error")
    } finally {
      setSaving(null)
    }
  }

  if (loading || !assignment) {
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
          href={`/teacher-dashboard/courses/${assignment.course?.id ?? ""}/content`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-2 transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          {locale === "ar" ? "العودة لمحتوى الدورة" : "Back to Course Content"}
        </Link>
        <h1 className="text-2xl font-bold text-[#0F172A]">{assignment.title}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {assignment.course?.title} — {submissions.length} {locale === "ar" ? "تسليم" : "submissions"}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">{locale === "ar" ? "لسه محدش سلّم الواجب ده" : "No one has submitted this assignment yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => {
            const draft = getDraft(s)
            const isGraded = s.grade != null
            return (
              <m.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{s.student?.name ?? "—"}</p>
                  </div>
                  {isGraded && (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#059669]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {locale === "ar" ? "تم التصحيح" : "Graded"}
                    </span>
                  )}
                </div>

                {s.content && (
                  <p className="text-sm text-[#334155] bg-[#F8FAFC] rounded-xl p-3 mb-3 whitespace-pre-wrap">{s.content}</p>
                )}
                {s.fileUrl && (
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-3"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {locale === "ar" ? "عرض الملف المرفق" : "View attached file"}
                  </a>
                )}

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                      {locale === "ar" ? "الدرجة" : "Grade"} {assignment.totalPoints ? `/ ${assignment.totalPoints}` : ""}
                    </label>
                    <Input
                      type="number"
                      value={draft.grade}
                      onChange={(e) => setDraft(s.id, { grade: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "ملاحظات" : "Feedback"}</label>
                    <Textarea
                      value={draft.feedback}
                      onChange={(e) => setDraft(s.id, { feedback: e.target.value })}
                      className="rounded-xl min-h-[38px]"
                      rows={1}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleGrade(s)}
                    disabled={saving === s.id}
                    className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-1.5"
                  >
                    {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {locale === "ar" ? "حفظ الدرجة" : "Save Grade"}
                  </Button>
                </div>
              </m.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
