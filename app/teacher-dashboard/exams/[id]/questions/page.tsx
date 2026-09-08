"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { m } from "framer-motion"
import { ChevronLeft, Plus, Trash2, GripVertical, X, Loader2, ListChecks, CheckCircle, Circle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

export default function TeacherExamQuestionsPage() {
  const params = useParams()
  const examId = params.id as string
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()

  const { data: examData, loading, refetch } = useApi(() => api.getInstructorExamById(examId), { deps: [examId] })
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    questionAr: "",
    type: "multiple_choice" as const,
    options: [{ id: "a", text: "", textAr: "", isCorrect: false }],
  })

  const exam = examData && typeof examData === "object" && "id" in examData ? (examData as { id: string; title: string; titleAr?: string; questions?: Array<Record<string, unknown>> }) : null
  const questions = (exam?.questions ?? []) as Array<{ id: string; question: string; questionAr?: string | null; type: string; options?: string | null; correctAnswer?: string | null; points?: number }>

  const addOption = () => {
    setNewQuestion((q) => ({ ...q, options: [...q.options, { id: String.fromCharCode(97 + q.options.length), text: "", textAr: "", isCorrect: false }] }))
  }
  const updateOption = (idx: number, updates: Partial<{ text: string; textAr: string; isCorrect: boolean }>) => {
    setNewQuestion((q) => ({ ...q, options: q.options.map((o, i) => (i === idx ? { ...o, ...updates } : updates.isCorrect ? { ...o, isCorrect: false } : o)) }))
  }
  const removeOption = (idx: number) => {
    setNewQuestion((q) => ({ ...q, options: q.options.filter((_, i) => i !== idx) }))
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) { showToast(isAr ? "السؤال مطلوب" : "Question is required", "error"); return }
    const correctOpt = newQuestion.options.find((o) => o.isCorrect)
    if (!correctOpt) { showToast(isAr ? "حدد الإجابة الصحيحة" : "Select correct answer", "error"); return }
    setSaving(true)
    try {
      const optionsPayload = JSON.stringify(newQuestion.options.map((o) => ({ id: o.id, text: o.text, textAr: o.textAr, textEn: o.text, isCorrect: o.isCorrect })))
      await api.addInstructorExamQuestion(examId, { question: newQuestion.question, questionAr: newQuestion.questionAr || undefined, type: newQuestion.type, options: optionsPayload, correctAnswer: correctOpt.id, points: 1 })
      showToast(isAr ? "تمت إضافة السؤال" : "Question added", "success")
      setShowAddModal(false)
      setNewQuestion({ question: "", questionAr: "", type: "multiple_choice", options: [{ id: "a", text: "", textAr: "", isCorrect: false }] })
      refetch()
    } catch { showToast(isAr ? "فشل في إضافة السؤال" : "Failed to add question", "error") }
    finally { setSaving(false) }
  }

  const handleDeleteQuestion = async (qId: string) => {
    setDeletingId(qId)
    try {
      await api.deleteInstructorExamQuestion(examId, qId)
      showToast(isAr ? "تم حذف السؤال" : "Question deleted", "success"); refetch()
    } catch { showToast(isAr ? "فشل حذف السؤال" : "Failed to delete question", "error") }
    finally { setDeletingId(null) }
  }

  const parseOptions = (opts: string | null | undefined) => {
    if (!opts) return []
    try { const arr = JSON.parse(opts); return Array.isArray(arr) ? arr : [] } catch { return [] }
  }

  if (loading || !exam) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/teacher-dashboard/exams" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#7C3AED]">
        <ChevronLeft className="w-4 h-4" />{isAr ? "العودة للاختبارات" : "Back to Exams"}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{exam.titleAr || exam.title}</h1>
          <p className="text-sm text-[#64748B] mt-1">{questions.length} {isAr ? "أسئلة" : "questions"}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          <Plus className="w-4 h-4" />{isAr ? "إضافة سؤال" : "Add Question"}
        </Button>
      </div>

      {questions.length === 0 ? (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center">
          <ListChecks className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"><Plus className="w-4 h-4" />{isAr ? "إضافة سؤال" : "Add Question"}</Button>
        </m.div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const opts = parseOptions(q.options)
            const correctId = q.correctAnswer
            return (
              <m.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                      <span className="text-xs font-semibold text-[#7C3AED]">{isAr ? `سؤال ${idx + 1}` : `Question ${idx + 1}`}</span>
                    </div>
                    <p className="text-sm font-medium text-[#0F172A]">{q.questionAr || q.question}</p>
                    {opts.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {opts.map((o: any) => (
                          <li key={String(o.id)} className="flex items-center gap-2 text-sm text-[#64748B]">
                            {String(o.id) === correctId ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-[#CBD5E1] flex-shrink-0" />}
                            {o.textAr || o.text || "—"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)} disabled={deletingId === q.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50 flex-shrink-0">
                    {deletingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </m.div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "إضافة سؤال جديد" : "Add New Question"}</h3>
              <button onClick={() => setShowAddModal(false)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "السؤال (عربي)" : "Question (Arabic)"}</label>
                <input value={newQuestion.questionAr} onChange={(e) => setNewQuestion((q) => ({ ...q, questionAr: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "السؤال (إنجليزي)" : "Question (English)"}</label>
                <input value={newQuestion.question} onChange={(e) => setNewQuestion((q) => ({ ...q, question: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#0F172A]">{isAr ? "الخيارات" : "Options"}</label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-lg gap-1"><Plus className="w-3 h-3" />{isAr ? "خيار" : "Option"}</Button>
                </div>
                <div className="space-y-2">
                  {newQuestion.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer w-8">
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => updateOption(idx, { isCorrect: true })} className="rounded-full" />
                        <span className="text-xs text-[#64748B]">{opt.id}</span>
                      </label>
                      <input value={opt.textAr} onChange={(e) => updateOption(idx, { textAr: e.target.value })} className="flex-1 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-[#7C3AED]" placeholder={isAr ? "النص عربي" : "Text (Ar)"} />
                      <input value={opt.text} onChange={(e) => updateOption(idx, { text: e.target.value })} className="flex-1 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-[#7C3AED]" placeholder={isAr ? "النص إنجليزي" : "Text (En)"} />
                      {newQuestion.options.length > 1 && (
                        <button type="button" onClick={() => removeOption(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0] flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleAddQuestion} disabled={saving} className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
