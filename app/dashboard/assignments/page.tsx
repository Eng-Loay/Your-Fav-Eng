"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { FileText, BookOpen, GraduationCap, Calendar, Send, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"

export default function StudentAssignmentsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [submitContent, setSubmitContent] = useState<Record<string, string>>({})
  const [autoAnswers, setAutoAnswers] = useState<Record<string, Record<string, string | string[]>>>({})

  const { data: res, refetch } = useApi(() => api.getStudentAssignments())
  const list = (() => {
    const r = res as { data?: any[] } | any[] | undefined
    return Array.isArray(r) ? r : (r?.data ?? [])
  })()

  const setAnswer = (assignmentId: string, questionId: string, value: string | string[]) => {
    setAutoAnswers((prev) => ({
      ...prev,
      [assignmentId]: { ...prev[assignmentId], [questionId]: value },
    }))
  }

  const toggleMultiAnswer = (assignmentId: string, questionId: string, optionId: string) => {
    setAutoAnswers((prev) => {
      const current = prev[assignmentId]?.[questionId]
      const arr = Array.isArray(current) ? current : []
      const next = arr.includes(optionId) ? arr.filter((id) => id !== optionId) : [...arr, optionId]
      return { ...prev, [assignmentId]: { ...prev[assignmentId], [questionId]: next } }
    })
  }

  const handleSubmit = async (a: any) => {
    const isAutoGraded = a.type === "course" && a.gradingType === "AUTO"
    if (isAutoGraded) {
      const answers = autoAnswers[a.id] ?? {}
      if ((a.questions ?? []).some((q: any) => !answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0))) {
        showToast(locale === "ar" ? "جاوب على كل الأسئلة" : "Answer all questions", "error")
        return
      }
      setSubmittingId(a.id)
      try {
        const result = await api.submitCourseAssignment(a.id, { answers })
        if (result.success) {
          refetch()
          showToast(locale === "ar" ? "تم التسليم والتصحيح" : "Submitted and graded")
        } else {
          showToast(result.message || (locale === "ar" ? "فشل التسليم" : "Failed to submit"), "error")
        }
      } finally {
        setSubmittingId(null)
      }
      return
    }

    const content = submitContent[a.id]?.trim()
    if (!content) {
      showToast(locale === "ar" ? "أدخل المحتوى" : "Enter content", "error")
      return
    }
    setSubmittingId(a.id)
    try {
      const result = a.type === "course"
        ? await api.submitCourseAssignment(a.id, { content })
        : await api.submitTeacherAssignment(a.id, { content })
      if (result.success) {
        setSubmitContent((prev) => ({ ...prev, [a.id]: "" }))
        refetch()
        showToast(locale === "ar" ? "تم التسليم" : "Submitted")
      } else {
        showToast(result.message || (locale === "ar" ? "فشل التسليم" : "Failed to submit"), "error")
      }
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الواجبات" : "Assignments"}</h2>
        <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "عرض وتسليم الواجبات" : "View and submit your assignments"}</p>
      </m.div>

      {list.length === 0 ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-12 text-center">
          <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">{locale === "ar" ? "لا توجد واجبات حالياً" : "No assignments at the moment"}</p>
        </m.div>
      ) : (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {list.map((a: any, i: number) => {
            const submitted = a.mySubmission
            return (
              <m.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${a.type === "course" ? "bg-[#8B5CF6]/10" : "bg-[#059669]/10"}`}>
                      {a.type === "course" ? <BookOpen className="w-6 h-6 text-[#8B5CF6]" /> : <GraduationCap className="w-6 h-6 text-[#059669]" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F172A]">{locale === "ar" && a.titleAr ? a.titleAr : a.title}</h3>
                      <p className="text-sm text-[#64748B] mt-0.5">{locale === "ar" && a.contextAr ? a.contextAr : a.context}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US") : "—"}
                        </span>
                        <span>{a.totalPoints} {locale === "ar" ? "درجة" : "pts"}</span>
                      </div>
                    </div>
                  </div>
                  {submitted ? (
                    <div className="flex items-center gap-2 text-[#059669] shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">{locale === "ar" ? "تم التسليم" : "Submitted"}</span>
                      {submitted.grade != null && (
                        <span className="text-sm font-bold">{submitted.grade}/{a.totalPoints}</span>
                      )}
                      {submitted.autoGraded && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">
                          {locale === "ar" ? "تصحيح تلقائي" : "Auto-graded"}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
                {!submitted && a.type === "course" && a.gradingType === "AUTO" ? (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0]/60 space-y-4">
                    {(a.questions ?? []).map((q: any, qi: number) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-1.5">
                          {(q.options ?? []).map((opt: any) => {
                            const isMulti = q.type === "multi_select"
                            const current = autoAnswers[a.id]?.[q.id]
                            const checked = isMulti
                              ? Array.isArray(current) && current.includes(opt.id)
                              : current === opt.id
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                                  checked ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type={isMulti ? "checkbox" : "radio"}
                                  name={`q-${q.id}`}
                                  checked={checked}
                                  onChange={() =>
                                    isMulti
                                      ? toggleMultiAnswer(a.id, q.id, opt.id)
                                      : setAnswer(a.id, q.id, opt.id)
                                  }
                                  className="shrink-0"
                                />
                                {opt.text}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={() => handleSubmit(a)}
                      disabled={!!submittingId}
                      className="bg-primary hover:bg-primary-hover text-white rounded-xl gap-2"
                    >
                      {submittingId === a.id ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {locale === "ar" ? "تسليم" : "Submit"}
                    </Button>
                  </div>
                ) : !submitted ? (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0]/60">
                    <textarea
                      value={submitContent[a.id] ?? ""}
                      onChange={(e) => setSubmitContent((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                      placeholder={locale === "ar" ? "اكتب إجابتك هنا..." : "Write your answer here..."}
                    />
                    <Button
                      onClick={() => handleSubmit(a)}
                      disabled={!!submittingId}
                      className="mt-2 bg-primary hover:bg-primary-hover text-white rounded-xl gap-2"
                    >
                      {submittingId === a.id ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {locale === "ar" ? "تسليم" : "Submit"}
                    </Button>
                  </div>
                ) : null}
              </m.div>
            )
          })}
        </m.div>
      )}
    </div>
  )
}
