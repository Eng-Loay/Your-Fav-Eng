"use client"

import React, { useState } from "react"
import { m } from "framer-motion"
import { Plus, Trash2, Loader2, ClipboardList, ListChecks, ToggleLeft, Type } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

export default function QuestionBankPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const { data, loading, refetch } = useApi(() => api.getAdminQuestionBank())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    question: "",
    questionAr: "",
    type: "multiple_choice" as "multiple_choice" | "true_false" | "short_answer",
    options: [{ id: "a", text: "", textAr: "", isCorrect: false }],
    correctAnswerText: "",
  })

  const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data
  const items = (list ?? []) as Array<{ id: string; question: string; questionAr?: string; type?: string; options?: string }>

  const addOption = () => {
    setForm((f) => ({
      ...f,
      options: [...f.options, { id: String.fromCharCode(97 + f.options.length), text: "", textAr: "", isCorrect: false }],
    }))
  }

  const handleAdd = async () => {
    if (!form.question.trim()) {
      showToast(isAr ? "السؤال مطلوب" : "Question required", "error")
      return
    }
    let optionsStr = ""
    let correctAnswer = ""
    if (form.type === "multiple_choice" || form.type === "true_false") {
      const correct = form.options.find((o) => o.isCorrect)
      if (!correct) {
        showToast(isAr ? "حدد الإجابة الصحيحة" : "Select correct answer", "error")
        return
      }
      optionsStr = JSON.stringify(form.options.map((o) => ({ ...o, textEn: o.text, isCorrect: o.isCorrect })))
      correctAnswer = correct.id
    } else {
      if (!form.correctAnswerText.trim()) {
        showToast(isAr ? "أدخل الإجابة الصحيحة" : "Enter correct answer", "error")
        return
      }
      optionsStr = JSON.stringify([{ id: "ans", text: form.correctAnswerText, textAr: form.correctAnswerText, isCorrect: true }])
      correctAnswer = "ans"
    }
    setSaving(true)
    try {
      await api.createAdminQuestionBankItem({
        question: form.question,
        questionAr: form.questionAr || undefined,
        type: form.type,
        options: optionsStr,
        correctAnswer,
        points: 1,
      })
      showToast(isAr ? "تمت الإضافة" : "Added", "success")
      setShowAdd(false)
      setForm({
        question: "",
        questionAr: "",
        type: "multiple_choice",
        options: [{ id: "a", text: "", textAr: "", isCorrect: false }],
        correctAnswerText: "",
      })
      refetch()
    } catch {
      showToast(isAr ? "فشل" : "Failed", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.deleteAdminQuestionBankItem(id)
      showToast(isAr ? "تم الحذف" : "Deleted", "success")
      refetch()
    } catch {
      showToast(isAr ? "فشل الحذف" : "Delete failed", "error")
    } finally {
      setDeletingId(null)
    }
  }

  const parseOpts = (o: string | undefined) => {
    if (!o) return []
    try {
      const arr = JSON.parse(o) as Array<{ id?: string; text?: string; textAr?: string; isCorrect?: boolean }>
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "بنك الأسئلة" : "Question Bank"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "أضف أسئلة لاستخدامها في الاختبارات" : "Add questions to reuse in exams"}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-xl bg-primary">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة سؤال" : "Add Question"}
        </Button>
      </div>

      {items.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center"
        >
          <ClipboardList className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا توجد أسئلة" : "No questions yet"}</p>
          <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> {isAr ? "إضافة سؤال" : "Add Question"}
          </Button>
        </m.div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {items.map((q) => {
              const opts = parseOpts(q.options)
              const correctId = opts.find((o) => o.isCorrect)?.id
              return (
                <div key={q.id} className="flex items-center justify-between p-4 hover:bg-[#F8FAFC]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A]">{q.questionAr || q.question}</p>
                    {opts.length > 0 && (
                      <p className="text-xs text-[#64748B] mt-1">
                        {opts.map((o) => (String(o.id) === correctId ? `✓ ${o.textAr || o.text}` : `  ${o.textAr || o.text}`)).join(" | ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                  >
                    {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{isAr ? "إضافة سؤال" : "Add Question"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">{isAr ? "نوع السؤال" : "Question Type"}</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "multiple_choice" as const, label: isAr ? "اختيار من متعدد" : "Multiple Choice", icon: ListChecks },
                    { value: "true_false" as const, label: isAr ? "صح / خطأ" : "True/False", icon: ToggleLeft },
                    { value: "short_answer" as const, label: isAr ? "إجابة قصيرة" : "Short Answer", icon: Type },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          type: t.value,
                          options:
                            t.value === "true_false"
                              ? [
                                  { id: "true", text: "True", textAr: "صح", isCorrect: true },
                                  { id: "false", text: "False", textAr: "خطأ", isCorrect: false },
                                ]
                              : [{ id: "a", text: "", textAr: "", isCorrect: false }],
                        }))
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.type === t.value ? "border-primary bg-primary/10 text-primary" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "السؤال (عربي)" : "Question (Ar)"}</label>
                <input
                  value={form.questionAr}
                  onChange={(e) => setForm((f) => ({ ...f, questionAr: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder={isAr ? "السؤال بالعربية" : "Question in Arabic"}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "السؤال (إنجليزي)" : "Question (En)"}</label>
                <input
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder={isAr ? "السؤال بالإنجليزية" : "Question in English"}
                />
              </div>
              {form.type === "short_answer" ? (
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "الإجابة الصحيحة" : "Correct Answer"}</label>
                  <input
                    value={form.correctAnswerText}
                    onChange={(e) => setForm((f) => ({ ...f, correctAnswerText: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    placeholder={isAr ? "أدخل الإجابة الصحيحة" : "Enter correct answer"}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">{isAr ? "الخيارات" : "Options"}</label>
                    {form.type === "multiple_choice" && (
                      <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-lg">
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {form.options.map((opt, i) => (
                  <div key={opt.id} className="flex gap-2 mb-2 items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.isCorrect}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            options: f.options.map((o, j) => ({ ...o, isCorrect: j === i })),
                          }))
                        }
                      />
                      <span className="text-sm font-medium">{opt.textAr || opt.text || opt.id}</span>
                    </label>
                    {form.type !== "true_false" && (
                    <>
                    <input
                      value={opt.textAr}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          options: f.options.map((o, j) => (j === i ? { ...o, textAr: e.target.value } : o)),
                        }))
                      }
                      className="flex-1 border rounded-lg px-2 py-1 text-sm"
                      placeholder="Ar"
                    />
                    <input
                      value={opt.text}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          options: f.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                        }))
                      }
                      className="flex-1 border rounded-lg px-2 py-1 text-sm"
                      placeholder="En"
                    />
                    </>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleAdd} disabled={saving} className="rounded-xl bg-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
