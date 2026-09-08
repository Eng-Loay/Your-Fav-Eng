"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { m } from "framer-motion"
import { ChevronLeft, Plus, Trash2, GripVertical, Loader2, ListChecks, CheckCircle, Circle, ToggleLeft, Type } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

export default function TeacherComprehensiveExamQuestionsPage() {
  const params = useParams()
  const examId = params.id as string
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()

  const { data: examData, loading, refetch } = useApi(() => api.getInstructorComprehensiveExamById(examId), { deps: [examId] })
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    question: "", questionAr: "",
    type: "multiple_choice" as "multiple_choice" | "true_false" | "short_answer",
    options: [{ id: "a", text: "", textAr: "", isCorrect: false }],
    correctAnswerText: "",
  })

  const exam = examData && typeof examData === "object" && "id" in examData
    ? (examData as { id: string; title: string; titleAr?: string; questions?: Array<Record<string, unknown>> })
    : null
  const questions = (exam?.questions ?? []) as Array<{ id: string; question: string; questionAr?: string | null; options?: string | null; correctAnswer?: string | null }>

  const addOption = () => {
    setNewQuestion((q) => ({ ...q, options: [...q.options, { id: String.fromCharCode(97 + q.options.length), text: "", textAr: "", isCorrect: false }] }))
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) { showToast(isAr ? "السؤال مطلوب" : "Question required", "error"); return }
    let optionsStr = ""; let correctAnswer = ""
    if (newQuestion.type === "multiple_choice" || newQuestion.type === "true_false") {
      const correctOpt = newQuestion.options.find((o) => o.isCorrect)
      if (!correctOpt) { showToast(isAr ? "حدد الإجابة الصحيحة" : "Select correct answer", "error"); return }
      optionsStr = JSON.stringify(newQuestion.options.map((o) => ({ ...o, textEn: o.text, isCorrect: o.isCorrect })))
      correctAnswer = correctOpt.id
    } else {
      if (!newQuestion.correctAnswerText.trim()) { showToast(isAr ? "أدخل الإجابة الصحيحة" : "Enter correct answer", "error"); return }
      optionsStr = JSON.stringify([{ id: "ans", text: newQuestion.correctAnswerText, textAr: newQuestion.correctAnswerText, isCorrect: true }])
      correctAnswer = "ans"
    }
    setSaving(true)
    try {
      await api.addInstructorComprehensiveExamQuestion(examId, { question: newQuestion.question, questionAr: newQuestion.questionAr || undefined, type: newQuestion.type, options: optionsStr, correctAnswer, points: 1 })
      showToast(isAr ? "تمت إضافة السؤال" : "Question added", "success")
      setShowAddModal(false)
      setNewQuestion({ question: "", questionAr: "", type: "multiple_choice", options: [{ id: "a", text: "", textAr: "", isCorrect: false }], correctAnswerText: "" })
      refetch()
    } catch { showToast(isAr ? "فشل" : "Failed", "error") }
    finally { setSaving(false) }
  }

  const handleDelete = async (qId: string) => {
    setDeletingId(qId)
    try { await api.deleteInstructorComprehensiveExamQuestion(examId, qId); showToast(isAr ? "تم الحذف" : "Deleted", "success"); refetch() }
    catch { showToast(isAr ? "فشل" : "Failed", "error") }
    finally { setDeletingId(null) }
  }

  const parseOpts = (o: string | null | undefined) => {
    if (!o) return []
    try { const arr = JSON.parse(o); return Array.isArray(arr) ? arr : [] } catch { return [] }
  }

  if (loading || !exam) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/teacher-dashboard/comprehensive-exams" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#7C3AED]">
        <ChevronLeft className="w-4 h-4" /> {isAr ? "العودة" : "Back"}
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{exam.titleAr || exam.title}</h1>
          <p className="text-sm text-[#64748B]">{questions.length} {isAr ? "أسئلة" : "questions"}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة سؤال" : "Add Question"}
        </Button>
      </div>

      {questions.length === 0 ? (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center">
          <ListChecks className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا توجد أسئلة" : "No questions yet"}</p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"><Plus className="w-4 h-4" /> {isAr ? "إضافة سؤال" : "Add Question"}</Button>
        </m.div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const opts = parseOpts(q.options)
            return (
              <m.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-xs font-semibold text-[#7C3AED]">{isAr ? `سؤال ${idx + 1}` : `Q${idx + 1}`}</span>
                    </div>
                    <p className="text-sm font-medium text-[#0F172A]">{q.questionAr || q.question}</p>
                    {opts.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {opts.map((o: any) => (
                          <li key={String(o.id)} className="flex items-center gap-2 text-sm text-[#64748B]">
                            {String(o.id) === q.correctAnswer ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5 text-[#CBD5E1]" />}
                            {o.textAr || o.text || "—"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button onClick={() => handleDelete(q.id)} disabled={deletingId === q.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50">
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
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{isAr ? "إضافة سؤال" : "Add Question"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">{isAr ? "نوع السؤال" : "Question Type"}</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: "multiple_choice" as const, label: isAr ? "اختيار من متعدد" : "Multiple Choice", icon: ListChecks },
                    { value: "true_false" as const, label: isAr ? "صح / خطأ" : "True/False", icon: ToggleLeft },
                    { value: "short_answer" as const, label: isAr ? "إجابة قصيرة" : "Short Answer", icon: Type },
                  ]).map((t) => (
                    <button key={t.value} type="button"
                      onClick={() => setNewQuestion((q) => ({
                        ...q, type: t.value,
                        options: t.value === "true_false" ? [{ id: "true", text: "True", textAr: "صح", isCorrect: true }, { id: "false", text: "False", textAr: "خطأ", isCorrect: false }] : [{ id: "a", text: "", textAr: "", isCorrect: false }],
                      }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${newQuestion.type === t.value ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]" : "border-[#E2E8F0] hover:border-[#94A3B8]"}`}
                    ><t.icon className="w-3.5 h-3.5" />{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "السؤال (عربي)" : "Question (Ar)"}</label>
                <input value={newQuestion.questionAr} onChange={(e) => setNewQuestion((q) => ({ ...q, questionAr: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "السؤال (إنجليزي)" : "Question (En)"}</label>
                <input value={newQuestion.question} onChange={(e) => setNewQuestion((q) => ({ ...q, question: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              {newQuestion.type === "short_answer" ? (
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "الإجابة الصحيحة" : "Correct Answer"}</label>
                  <input value={newQuestion.correctAnswerText} onChange={(e) => setNewQuestion((q) => ({ ...q, correctAnswerText: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">{isAr ? "الخيارات" : "Options"}</label>
                    {newQuestion.type === "multiple_choice" && <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-lg"><Plus className="w-3 h-3" /></Button>}
                  </div>
                  {newQuestion.options.map((opt, i) => (
                    <div key={opt.id} className="flex gap-2 mb-2 items-center">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setNewQuestion((q) => ({ ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === i })) }))} />
                        <span className="text-sm font-medium">{opt.textAr || opt.text || opt.id}</span>
                      </label>
                      {newQuestion.type !== "true_false" && (
                        <>
                          <input value={opt.textAr} onChange={(e) => setNewQuestion((q) => ({ ...q, options: q.options.map((o, j) => (j === i ? { ...o, textAr: e.target.value } : o)) }))} className="flex-1 border rounded-lg px-2 py-1 text-sm" placeholder="Ar" />
                          <input value={opt.text} onChange={(e) => setNewQuestion((q) => ({ ...q, options: q.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)) }))} className="flex-1 border rounded-lg px-2 py-1 text-sm" placeholder="En" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleAddQuestion} disabled={saving} className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
