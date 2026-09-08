"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { Plus, Trash2, Loader2, FileText, ListPlus, BarChart2, Settings } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

export default function TeacherComprehensiveExamsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [activeTab, setActiveTab] = useState<"exams" | "results">("exams")
  const [showCreate, setShowCreate] = useState(false)
  const [editingExam, setEditingExam] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "", titleAr: "", courseId: "", duration: 60, passingScore: 60, maxAttempts: 2,
    showCorrectAnswer: true, randomizeQuestions: false, randomizeOptions: false,
    startDate: "", endDate: "", status: "active",
  })

  const { data: examsData, loading, refetch } = useApi(() => api.getInstructorComprehensiveExams())
  const { data: resultsData, loading: resultsLoading } = useApi(() => api.getInstructorComprehensiveExamResults(), { deps: [activeTab], immediate: activeTab === "results" })
  const { data: coursesData } = useApi(() => api.getInstructorCourses())

  const courses = useMemo(() => {
    const list = Array.isArray(coursesData) ? coursesData : (coursesData as { data?: unknown[] })?.data
    return (list ?? []).map((c: Record<string, unknown>) => ({ id: String(c.id ?? ""), title: String(c.titleAr ?? c.title ?? "") }))
  }, [coursesData])

  const examsList = Array.isArray(examsData) ? examsData : (examsData as { data?: unknown[] })?.data
  const exams = (examsList ?? []) as Array<{
    id: string; title: string; titleAr?: string; courseId: string;
    course?: { title?: string; titleAr?: string }; courseTitle?: string;
    questionsCount?: number; questions?: number; participantsCount?: number; participants?: number;
    duration?: number; passingScore?: number; maxAttempts?: number;
  }>

  const resultsList = Array.isArray(resultsData) ? resultsData : (resultsData as { data?: unknown[] })?.data
  const results = (resultsList ?? []) as Array<{
    id: string; student?: { name?: string }; score: number; passed: boolean; attempts: number;
    comprehensiveExam?: { title?: string; titleAr?: string };
  }>

  const handleCreate = async () => {
    if (!form.title.trim() || !form.courseId) { showToast(isAr ? "العنوان والدورة مطلوبان" : "Title and course required", "error"); return }
    setSaving(true)
    try {
      await api.createInstructorComprehensiveExam({
        courseId: form.courseId, title: form.title, titleAr: form.titleAr || undefined,
        duration: form.duration, passingScore: form.passingScore, maxAttempts: form.maxAttempts,
        showCorrectAnswer: form.showCorrectAnswer, randomizeQuestions: form.randomizeQuestions, randomizeOptions: form.randomizeOptions,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined, status: form.status,
      })
      showToast(isAr ? "تم إنشاء الامتحان" : "Exam created", "success")
      setShowCreate(false)
      setForm({ title: "", titleAr: "", courseId: "", duration: 60, passingScore: 60, maxAttempts: 2, showCorrectAnswer: true, randomizeQuestions: false, randomizeOptions: false, startDate: "", endDate: "", status: "active" })
      refetch()
    } catch { showToast(isAr ? "فشل" : "Failed", "error") }
    finally { setSaving(false) }
  }

  const openEditExam = (exam: any) => {
    setEditingExam(exam)
    setForm({
      title: exam.title, titleAr: exam.titleAr || "", courseId: exam.courseId,
      duration: exam.duration ?? 60, passingScore: exam.passingScore ?? 60, maxAttempts: exam.maxAttempts ?? 2,
      showCorrectAnswer: exam.showCorrectAnswer ?? true, randomizeQuestions: exam.randomizeQuestions ?? false, randomizeOptions: exam.randomizeOptions ?? false,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : "",
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : "",
      status: exam.status ?? "active",
    })
  }

  const handleUpdateExam = async () => {
    if (!editingExam) return
    setSaving(true)
    try {
      await api.updateInstructorComprehensiveExam(editingExam.id, {
        title: form.title, titleAr: form.titleAr || undefined, courseId: form.courseId,
        duration: form.duration, passingScore: form.passingScore, maxAttempts: form.maxAttempts,
        showCorrectAnswer: form.showCorrectAnswer, randomizeQuestions: form.randomizeQuestions, randomizeOptions: form.randomizeOptions,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined, status: form.status,
      })
      showToast(isAr ? "تم التحديث" : "Updated", "success"); setEditingExam(null); refetch()
    } catch { showToast(isAr ? "فشل" : "Failed", "error") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await api.deleteInstructorComprehensiveExam(id); showToast(isAr ? "تم الحذف" : "Deleted", "success"); refetch() }
    catch { showToast(isAr ? "فشل الحذف" : "Delete failed", "error") }
    finally { setDeletingId(null) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "امتحانات شاملة" : "Comprehensive Exams"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "امتحانات للطلاب المسجلين في دوراتك" : "Exams for students enrolled in your courses"}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4" /> {isAr ? "إنشاء امتحان" : "Create Exam"}
        </Button>
      </div>

      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab("exams")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "exams" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>{isAr ? "الامتحانات" : "Exams"}</button>
        <button onClick={() => setActiveTab("results")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "results" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>{isAr ? "نتائج الطلاب" : "Student Results"}</button>
      </div>

      {activeTab === "exams" && (
        exams.length === 0 ? (
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center">
            <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا توجد امتحانات شاملة" : "No comprehensive exams yet"}</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"><Plus className="w-4 h-4" /> {isAr ? "إنشاء امتحان" : "Create Exam"}</Button>
          </m.div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase border-b border-[#E2E8F0]">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الامتحان" : "Exam"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدورة" : "Course"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الأسئلة" : "Questions"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "المشاركون" : "Participants"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{isAr ? (exam.titleAr || exam.title) : exam.title}</td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{exam.courseTitle ?? exam.course?.titleAr ?? exam.course?.title ?? ""}</td>
                    <td className="px-3 py-3 text-sm">{exam.questionsCount ?? exam.questions ?? 0}</td>
                    <td className="px-3 py-3 text-sm">{exam.participantsCount ?? exam.participants ?? 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/teacher-dashboard/comprehensive-exams/${exam.id}/questions`} className="p-1.5 rounded-lg hover:bg-[#7C3AED]/10 text-[#7C3AED]" title={isAr ? "إضافة أسئلة" : "Add questions"}>
                          <ListPlus className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => openEditExam(exam)} className="p-1.5 rounded-lg hover:bg-[#64748B]/10 text-[#64748B]"><Settings className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(exam.id)} disabled={deletingId === exam.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50">
                          {deletingId === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "results" && (
        resultsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>
        ) : results.length === 0 ? (
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center">
            <BarChart2 className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا توجد نتائج بعد" : "No results yet"}</p>
          </m.div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase border-b border-[#E2E8F0]">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الامتحان" : "Exam"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدرجة" : "Score"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "المحاولات" : "Attempts"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "النتيجة" : "Result"}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{r.student?.name ?? "—"}</td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{r.comprehensiveExam?.titleAr ?? r.comprehensiveExam?.title ?? "—"}</td>
                    <td className="px-3 py-3 text-sm font-bold">{r.score?.toFixed(0)}%</td>
                    <td className="px-3 py-3 text-sm">{r.attempts}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {(showCreate || editingExam) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{editingExam ? (isAr ? "إعدادات الامتحان" : "Exam Settings") : isAr ? "إنشاء امتحان شامل" : "Create Comprehensive Exam"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "الدورة" : "Course"}</label>
                <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" disabled={!!editingExam}>
                  <option value="">{isAr ? "اختر الدورة" : "Select course"}</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "عنوان الامتحان" : "Exam Title"}</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "العنوان (عربي)" : "Title (Ar)"}</label>
                <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "المدة (دقيقة)" : "Duration (min)"}</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-sm" min={1} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "درجة النجاح (%)" : "Passing Score (%)"}</label>
                  <input type="number" value={form.passingScore} onChange={(e) => setForm((f) => ({ ...f, passingScore: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-sm" min={0} max={100} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "عدد المحاولات" : "Max Attempts"}</label>
                <input type="number" value={form.maxAttempts} onChange={(e) => setForm((f) => ({ ...f, maxAttempts: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-sm" min={1} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 col-span-2 cursor-pointer">
                  <input type="checkbox" checked={form.showCorrectAnswer} onChange={(e) => setForm((f) => ({ ...f, showCorrectAnswer: e.target.checked }))} className="rounded" />
                  <span className="text-sm">{isAr ? "إظهار الإجابة الصحيحة" : "Show correct answer"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.randomizeQuestions} onChange={(e) => setForm((f) => ({ ...f, randomizeQuestions: e.target.checked }))} className="rounded" />
                  <span className="text-sm">{isAr ? "ترتيب عشوائي للأسئلة" : "Randomize questions"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.randomizeOptions} onChange={(e) => setForm((f) => ({ ...f, randomizeOptions: e.target.checked }))} className="rounded" />
                  <span className="text-sm">{isAr ? "ترتيب عشوائي للخيارات" : "Randomize options"}</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "تاريخ البداية" : "Start Date"}</label>
                  <input type="datetime-local" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "تاريخ النهاية" : "End Date"}</label>
                  <input type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "حالة الامتحان" : "Status"}</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm">
                  <option value="active">{isAr ? "نشط" : "Active"}</option>
                  <option value="draft">{isAr ? "مسودة" : "Draft"}</option>
                  <option value="archived">{isAr ? "مؤرشف" : "Archived"}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditingExam(null) }} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              {editingExam ? (
                <Button onClick={handleUpdateExam} disabled={saving} className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "حفظ التغييرات" : "Save"}
                </Button>
              ) : (
                <Button onClick={handleCreate} disabled={saving} className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إنشاء" : "Create"}
                </Button>
              )}
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
