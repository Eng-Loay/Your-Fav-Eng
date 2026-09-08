"use client"

import React, { useState } from "react"
import { m } from "framer-motion"
import {
  UserPlus,
  Search,
  Plus,
  X,
  XCircle,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { safeStr } from "@/lib/utils"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface Enrollment {
  id: string
  status: "active" | "completed" | "cancelled"
  student: string
  course: string
  enrolledDate: string
  progress: number
}

export default function EnrollmentsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showEnroll, setShowEnroll] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [enrolling, setEnrolling] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  const { data: enrollments, loading, error, refetch } = useApi<Enrollment[]>(
    () => api.getAdminEnrollments({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined }),
    { immediate: true, deps: [search, statusFilter] }
  )

  const { data: students } = useApi<{ id: string; name: string }[]>(
    () => api.getAdminStudents(),
    { immediate: true }
  )

  const { data: courses } = useApi<{ id: string; title: string }[]>(
    () => api.getAdminCourses(),
    { immediate: true }
  )

  const enrollmentsListRaw = enrollments || []

  const enrollmentsList: Enrollment[] = (Array.isArray(enrollmentsListRaw) ? enrollmentsListRaw : []).map((e: any) => {
    const id = safeStr(e?.id)
    const student = safeStr(e?.student ?? e?.user ?? e?.userName ?? e?.user?.name)
    const course = safeStr(e?.course?.title ?? e?.course?.name ?? e?.course)
    const statusRaw = safeStr(e?.status).toLowerCase()
    const status: Enrollment["status"] = statusRaw === "active"
      ? "active"
      : statusRaw === "completed"
        ? "completed"
        : statusRaw === "cancelled"
          ? "cancelled"
          : statusRaw === "inactive"
            ? "cancelled"
            : statusRaw === "cancel"
              ? "cancelled"
              : statusRaw === "pending"
                ? "active"
                : statusRaw === "suspended"
                  ? "cancelled"
                  : statusRaw === "expired"
                    ? "cancelled"
                    : statusRaw === "paid"
                      ? "active"
                      : statusRaw === "unpaid"
                        ? "active"
                        : statusRaw === "approved"
                          ? "active"
                          : statusRaw === "rejected"
                            ? "cancelled"
                            : statusRaw === "active_enrollment"
                              ? "active"
                              : statusRaw === "completed_enrollment"
                                ? "completed"
                                : statusRaw === "cancelled_enrollment"
                                  ? "cancelled"
                                  : statusRaw === "active"
                                    ? "active"
                                    : statusRaw === "completed"
                                      ? "completed"
                                      : statusRaw === "cancelled"
                                        ? "cancelled"
                                        : statusRaw === "active" // fallback
                                          ? "active"
                                          : "active"
    const enrolledDate = safeStr(e?.enrolledDate ?? e?.createdAt ?? e?.enrolledAt ?? "")
    const progress = Number(e?.progress ?? 0) || 0

    return { id, student, course, status, enrolledDate, progress }
  })
  
  const filtered = enrollmentsList.filter(e => {
    const q = search.toLowerCase()
    const studentText = safeStr(e.student).toLowerCase()
    const courseText = safeStr(e.course).toLowerCase()
    const matchSearch = !q || studentText.includes(q) || courseText.includes(q)
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = enrollmentsList.filter(e => e.status === "active").length
  const completedCount = enrollmentsList.filter(e => e.status === "completed").length
  const cancelledCount = enrollmentsList.filter(e => e.status === "cancelled").length

  const handleManualEnroll = async () => {
    if (!selectedStudentId || !selectedCourseId) return
    setEnrolling(true)
    try {
      const res = await api.manualEnroll(selectedStudentId, selectedCourseId)
      if (res.success) {
        setShowEnroll(false)
        setSelectedStudentId("")
        setSelectedCourseId("")
        showToast(isAr ? "تم التسجيل بنجاح" : "Enrolled successfully")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في التسجيل" : "Failed to enroll"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setEnrolling(false)
    }
  }

  const handleCancelEnrollment = async (id: string) => {
    setCancelling(id)
    try {
      const res = await api.cancelEnrollment(id)
      if (res.success) {
        showToast(isAr ? "تم إلغاء التسجيل" : "Enrollment cancelled")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في الإلغاء" : "Failed to cancel"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setCancelling(null)
      setConfirmCancel(null)
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

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  }

  const statusLabels: Record<string, { ar: string; en: string }> = {
    active: { ar: "نشط", en: "Active" },
    completed: { ar: "مكتمل", en: "Completed" },
    cancelled: { ar: "ملغى", en: "Cancelled" },
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة التسجيلات" : "Enrollments Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إدارة تسجيلات الطلاب في الدورات" : "Manage student course enrollments"}</p>
        </div>
        <Button onClick={() => setShowEnroll(true)} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
          <Plus className="w-4 h-4" /> {isAr ? "تسجيل يدوي" : "Manual Enroll"}
        </Button>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><UserPlus className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{enrollmentsList.length}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "إجمالي التسجيلات" : "Total Enrollments"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><Clock className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{activeCount}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "تسجيلات نشطة" : "Active"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669] mb-3"><CheckCircle className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{completedCount}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "مكتملة" : "Completed"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-3"><XCircle className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{cancelledCount}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "ملغاة" : "Cancelled"}</p>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search..."} className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none">
            <option value="all">{isAr ? "كل الحالات" : "All Status"}</option>
            <option value="active">{isAr ? "نشط" : "Active"}</option>
            <option value="completed">{isAr ? "مكتمل" : "Completed"}</option>
            <option value="cancelled">{isAr ? "ملغى" : "Cancelled"}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus className="w-12 h-12 text-[#E2E8F0] mb-3" />
            <p className="text-sm font-semibold text-[#94A3B8]">{isAr ? "لا توجد تسجيلات" : "No enrollments found"}</p>
            <p className="text-xs text-[#C0C9D4] mt-1">{isAr ? "جرب تغيير معايير البحث" : "Try adjusting your filters"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدورة" : "Course"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "تاريخ التسجيل" : "Enrolled Date"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "التقدم" : "Progress"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((enr) => (
                  <tr key={enr.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{enr.student}</td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{enr.course}</td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{enr.enrolledDate}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/90" style={{ width: `${enr.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A]">{enr.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusColors[enr.status]}`}>
                        {isAr ? statusLabels[enr.status].ar : statusLabels[enr.status].en}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {enr.status === "active" && (
                        <button 
                          onClick={() => setConfirmCancel(enr.id)}
                          disabled={cancelling === enr.id}
                          className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
                        >
                          {cancelling === enr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isAr ? "إلغاء" : "Cancel")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </m.div>

      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "تسجيل طالب يدوياً" : "Manual Enrollment"}</h3>
              <button onClick={() => setShowEnroll(false)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الطالب" : "Student"}</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">{isAr ? "اختر طالب" : "Select Student"}</option>
                  {(students || []).map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدورة" : "Course"}</label>
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">{isAr ? "اختر دورة" : "Select Course"}</option>
                  {(courses || []).map((c: { id: string; title: string }) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEnroll(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button 
                onClick={handleManualEnroll}
                disabled={enrolling || !selectedStudentId || !selectedCourseId}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white"
              >
                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تسجيل" : "Enroll")}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "تأكيد الإلغاء" : "Confirm Cancellation"}</h3>
            <p className="text-sm text-[#64748B] mb-6">{isAr ? "هل أنت متأكد من إلغاء هذا التسجيل؟" : "Are you sure you want to cancel this enrollment?"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmCancel(null)} className="rounded-xl">{isAr ? "رجوع" : "Go Back"}</Button>
              <Button
                onClick={() => handleCancelEnrollment(confirmCancel)}
                disabled={cancelling === confirmCancel}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling === confirmCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إلغاء التسجيل" : "Cancel Enrollment")}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
