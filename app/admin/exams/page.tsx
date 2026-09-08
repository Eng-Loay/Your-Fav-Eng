"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import {
  FileText,
  Search,
  Plus,
  Users,
  CheckCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  ListPlus,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface ExamForm {
  title: string
  courseId: string
  timeLimit: number
  maxAttempts: number
  passingScore: number
  showCorrectAnswer: boolean
  randomizeQuestions: boolean
  randomizeOptions: boolean
}

const defaultForm: ExamForm = {
  title: "",
  courseId: "",
  timeLimit: 30,
  maxAttempts: 2,
  passingScore: 60,
  showCorrectAnswer: true,
  randomizeQuestions: false,
  randomizeOptions: false,
}

export default function ExamsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"exams" | "results">("exams")
  const [showCreate, setShowCreate] = useState(false)
  const [editingExam, setEditingExam] = useState<string | null>(null)
  const [form, setForm] = useState<ExamForm>(defaultForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExamForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const { data: examsData, loading, error, refetch } = useApi(() => api.getAdminExams())
  const { data: resultsData, loading: resultsLoading } = useApi(() => api.getAdminExamResults())
  const { data: coursesData } = useApi(() => api.getAdminCourses())

  const courses = useMemo(() => {
    const list = Array.isArray(coursesData) ? coursesData : (coursesData as { data?: unknown[] })?.data
    if (!list || !Array.isArray(list)) return []
    return list.map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ""),
      title: (c.title as string) ?? "",
    }))
  }, [coursesData])

  const exams = useMemo(() => {
    const list = Array.isArray(examsData) ? examsData : (examsData as { data?: unknown[] })?.data
    if (!list || !Array.isArray(list)) return []
    return list.map((e: Record<string, unknown>) => ({
      id: String(e.id ?? ""),
      title: (e.title as string) ?? "",
      course: (e.course as string) ?? ((e.course as Record<string, unknown>)?.title as string) ?? "",
      courseId: String(e.courseId ?? ""),
      questions: Number(e.questions ?? 0),
      timeLimit: Number(e.timeLimit ?? 30),
      maxAttempts: Number(e.maxAttempts ?? 3),
      passingScore: Number(e.passingScore ?? 60),
      status: ((e.status as string) ?? "active") as "active" | "draft",
      participants: Number(e.participants ?? 0),
      avgScore: Number(e.avgScore ?? 0),
    }))
  }, [examsData])

  const results = useMemo(() => {
    const list = Array.isArray(resultsData) ? resultsData : (resultsData as { data?: unknown[] })?.data
    if (!list || !Array.isArray(list)) return []
    return list.map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ""),
      student: (r.student as string) ?? ((r.user as Record<string, unknown>)?.name as string) ?? "",
      exam: (r.exam as string) ?? ((r.exam as Record<string, unknown>)?.title as string) ?? "",
      score: Number(r.score ?? 0),
      attempts: Number(r.attempts ?? 1),
      timeSpent: (r.timeSpent as string) ?? "-",
      status: ((r.status as string) ?? (Number(r.score ?? 0) >= 60 ? "passed" : "failed")) as "passed" | "failed",
    }))
  }, [resultsData])

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) || e.course.toLowerCase().includes(search.toLowerCase())
  )

  const totalExams = exams.length
  const totalParticipants = exams.reduce((a, e) => a + e.participants, 0)
  const activeExams = exams.filter(e => e.status === "active").length

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ExamForm, string>> = {}
    if (!form.title.trim()) errors.title = isAr ? "العنوان مطلوب" : "Title is required"
    if (!form.courseId) errors.courseId = isAr ? "الدورة مطلوبة" : "Course is required"
    if (form.timeLimit < 1) errors.timeLimit = isAr ? "المدة يجب أن تكون أكبر من 0" : "Time limit must be > 0"
    if (form.maxAttempts < 1) errors.maxAttempts = isAr ? "عدد المحاولات يجب أن يكون أكبر من 0" : "Attempts must be > 0"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openCreateModal = () => {
    setForm(defaultForm)
    setFormErrors({})
    setEditingExam(null)
    setShowCreate(true)
  }

  const openEditModal = (exam: typeof exams[0]) => {
    setForm({
      title: exam.title,
      courseId: exam.courseId,
      timeLimit: exam.timeLimit,
      maxAttempts: exam.maxAttempts,
      passingScore: exam.passingScore,
      showCorrectAnswer: (exam as Record<string, unknown>).showCorrectAnswer !== false,
      randomizeQuestions: Boolean((exam as Record<string, unknown>).randomizeQuestions),
      randomizeOptions: Boolean((exam as Record<string, unknown>).randomizeOptions),
    })
    setFormErrors({})
    setEditingExam(exam.id)
    setShowCreate(true)
  }

  const closeModal = () => {
    setShowCreate(false)
    setEditingExam(null)
    setForm(defaultForm)
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      if (editingExam) {
        await api.updateAdminExam(editingExam, {
          title: form.title,
          courseId: form.courseId,
          timeLimit: form.timeLimit,
          maxAttempts: form.maxAttempts,
          passingScore: form.passingScore,
          showCorrectAnswer: form.showCorrectAnswer,
          randomizeQuestions: form.randomizeQuestions,
          randomizeOptions: form.randomizeOptions,
        })
        showToast(isAr ? "تم تحديث الاختبار بنجاح" : "Exam updated successfully", "success")
      } else {
        await api.createAdminExam({
          title: form.title,
          courseId: form.courseId,
          timeLimit: form.timeLimit,
          maxAttempts: form.maxAttempts,
          passingScore: form.passingScore,
          showCorrectAnswer: form.showCorrectAnswer,
          randomizeQuestions: form.randomizeQuestions,
          randomizeOptions: form.randomizeOptions,
        })
        showToast(isAr ? "تم إنشاء الاختبار بنجاح" : "Exam created successfully", "success")
      }
      closeModal()
      refetch()
    } catch {
      showToast(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setShowDeleteConfirm(null)
    try {
      await api.deleteAdminExam(id)
      showToast(isAr ? "تم حذف الاختبار بنجاح" : "Exam deleted successfully", "success")
      refetch()
    } catch {
      showToast(isAr ? "فشل حذف الاختبار" : "Failed to delete exam", "error")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={refetch} variant="outline">{isAr ? "إعادة المحاولة" : "Retry"}</Button>
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة الاختبارات" : "Exams Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إنشاء وإدارة الاختبارات والنتائج" : "Create and manage exams and results"}</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
          <Plus className="w-4 h-4" /> {isAr ? "إنشاء اختبار" : "Create Exam"}
        </Button>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><FileText className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{totalExams}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{isAr ? "إجمالي الاختبارات" : "Total Exams"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669] mb-3"><CheckCircle className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{activeExams}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{isAr ? "الاختبارات النشطة" : "Active Exams"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-3"><Users className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{totalParticipants.toLocaleString()}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{isAr ? "إجمالي المشاركين" : "Total Participants"}</p>
        </div>
      </m.div>

      <m.div variants={fadeUp}>
        <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 w-fit mb-4">
          <button onClick={() => setActiveTab("exams")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "exams" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>
            {isAr ? "الاختبارات" : "Exams"}
          </button>
          <button onClick={() => setActiveTab("results")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "results" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>
            {isAr ? "النتائج" : "Results"}
          </button>
        </div>
      </m.div>

      {activeTab === "exams" && (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
          <div className="p-4 border-b border-[#E2E8F0]/60">
            <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 max-w-md">
              <Search className="w-4 h-4 text-[#94A3B8]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث عن اختبار..." : "Search exams..."} className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]" />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-12 h-12 text-[#CBD5E1]" />
              <p className="text-sm font-medium text-[#94A3B8]">{isAr ? "لا توجد اختبارات" : "No exams found"}</p>
              <p className="text-xs text-[#CBD5E1]">{isAr ? "ابدأ بإنشاء اختبار جديد" : "Start by creating a new exam"}</p>
              <Button onClick={openCreateModal} variant="outline" className="mt-2 rounded-xl gap-2 text-sm">
                <Plus className="w-4 h-4" /> {isAr ? "إنشاء اختبار" : "Create Exam"}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "الاختبار" : "Exam"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدورة" : "Course"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الأسئلة" : "Questions"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المدة" : "Time"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المحاولات" : "Attempts"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المشاركون" : "Participants"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المتوسط" : "Avg Score"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                    <th className="text-start px-3 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam) => (
                    <tr key={exam.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{exam.title}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{exam.course}</td>
                      <td className="px-3 py-3 text-sm text-[#0F172A]">{exam.questions}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{exam.timeLimit} {isAr ? "دقيقة" : "min"}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{exam.maxAttempts}</td>
                      <td className="px-3 py-3 text-sm text-[#0F172A]">{exam.participants}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-primary">{exam.avgScore > 0 ? `${exam.avgScore}%` : "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${exam.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {exam.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "مسودة" : "Draft")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/exams/${exam.id}/questions`}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"
                            title={isAr ? "إضافة أسئلة" : "Add questions"}
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => openEditModal(exam)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Edit className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => setShowDeleteConfirm(exam.id)}
                            disabled={deletingId === exam.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                          >
                            {deletingId === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </m.div>
      )}

      {activeTab === "results" && (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
          {resultsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Eye className="w-12 h-12 text-[#CBD5E1]" />
              <p className="text-sm font-medium text-[#94A3B8]">{isAr ? "لا توجد نتائج بعد" : "No results yet"}</p>
              <p className="text-xs text-[#CBD5E1]">{isAr ? "ستظهر النتائج بعد أداء الطلاب للاختبارات" : "Results will appear after students take exams"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الاختبار" : "Exam"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدرجة" : "Score"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المحاولات" : "Attempts"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الوقت" : "Time Spent"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "النتيجة" : "Result"}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{r.student}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{r.exam}</td>
                      <td className="px-3 py-3 text-sm font-bold text-[#0F172A]">{r.score}%</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{r.attempts}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{r.timeSpent}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${r.status === "passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.status === "passed" ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </m.div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {editingExam ? (isAr ? "تعديل الاختبار" : "Edit Exam") : (isAr ? "إنشاء اختبار جديد" : "Create New Exam")}
              </h3>
              <button onClick={closeModal} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "عنوان الاختبار" : "Exam Title"}</label>
                <input
                  value={form.title}
                  onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: undefined })) }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary ${formErrors.title ? "border-red-400" : "border-[#E2E8F0]/60"}`}
                  placeholder={isAr ? "أدخل عنوان الاختبار" : "Enter exam title"}
                />
                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدورة" : "Course"}</label>
                <select
                  value={form.courseId}
                  onChange={(e) => { setForm(f => ({ ...f, courseId: e.target.value })); setFormErrors(fe => ({ ...fe, courseId: undefined })) }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none bg-white ${formErrors.courseId ? "border-red-400" : "border-[#E2E8F0]/60"}`}
                >
                  <option value="">{isAr ? "اختر الدورة" : "Select a course"}</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                {formErrors.courseId && <p className="text-xs text-red-500 mt-1">{formErrors.courseId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "المدة (دقائق)" : "Time Limit (min)"}</label>
                  <input
                    type="number"
                    value={form.timeLimit}
                    onChange={(e) => { setForm(f => ({ ...f, timeLimit: Number(e.target.value) })); setFormErrors(fe => ({ ...fe, timeLimit: undefined })) }}
                    min={1}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary ${formErrors.timeLimit ? "border-red-400" : "border-[#E2E8F0]/60"}`}
                  />
                  {formErrors.timeLimit && <p className="text-xs text-red-500 mt-1">{formErrors.timeLimit}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "عدد المحاولات" : "Max Attempts"}</label>
                  <input
                    type="number"
                    value={form.maxAttempts}
                    onChange={(e) => { setForm(f => ({ ...f, maxAttempts: Number(e.target.value) })); setFormErrors(fe => ({ ...fe, maxAttempts: undefined })) }}
                    min={1}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary ${formErrors.maxAttempts ? "border-red-400" : "border-[#E2E8F0]/60"}`}
                  />
                  {formErrors.maxAttempts && <p className="text-xs text-red-500 mt-1">{formErrors.maxAttempts}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "درجة النجاح (%)" : "Passing Score (%)"}</label>
                <input
                  type="number"
                  value={form.passingScore}
                  onChange={(e) => setForm(f => ({ ...f, passingScore: Number(e.target.value) }))}
                  min={0}
                  max={100}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]/60">
                <p className="text-sm font-medium text-[#0F172A]">{isAr ? "إعدادات الاختبار" : "Exam Settings"}</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showCorrectAnswer}
                    onChange={(e) => setForm(f => ({ ...f, showCorrectAnswer: e.target.checked }))}
                    className="rounded border-[#E2E8F0]"
                  />
                  <span className="text-sm text-[#64748B]">{isAr ? "إظهار الإجابة الصحيحة بعد الاختبار" : "Show correct answer after quiz"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.randomizeQuestions}
                    onChange={(e) => setForm(f => ({ ...f, randomizeQuestions: e.target.checked }))}
                    className="rounded border-[#E2E8F0]"
                  />
                  <span className="text-sm text-[#64748B]">{isAr ? "ترتيب الأسئلة عشوائياً" : "Randomize question order"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.randomizeOptions}
                    onChange={(e) => setForm(f => ({ ...f, randomizeOptions: e.target.checked }))}
                    className="rounded border-[#E2E8F0]"
                  />
                  <span className="text-sm text-[#64748B]">{isAr ? "ترتيب الخيارات عشوائياً" : "Randomize option order"}</span>
                </label>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeModal} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingExam ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "إنشاء" : "Create")}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
              <p className="text-sm text-[#64748B]">{isAr ? "هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this exam? This action cannot be undone."}</p>
            </div>
            <div className="p-4 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => handleDelete(showDeleteConfirm)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">{isAr ? "حذف" : "Delete"}</Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
