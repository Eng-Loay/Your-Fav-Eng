"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import { m } from "framer-motion"
import { Users, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface PendingStudent {
  id: string
  name?: string
  email?: string
  avatar?: string
  createdAt?: string
}

interface TeacherOption {
  id: string
  name: string
  email: string
}

export default function PendingStudentsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmReject, setConfirmReject] = useState<{ id: string; name: string } | null>(null)

  const { data: studentsRes, loading, refetch } = useApi(() =>
    api.getAdminUsers({ role: "student", status: "PENDING_REVIEW", limit: 100 })
  )
  const { data: teachersRes } = useApi(() => api.getAdminUsers({ role: "teacher", status: "active", limit: 100 }))

  const students: PendingStudent[] = (() => {
    const raw = studentsRes as { data?: PendingStudent[] } | PendingStudent[] | undefined
    const arr = Array.isArray(raw) ? raw : (raw?.data ?? [])
    return arr
  })()

  const teachers: TeacherOption[] = (() => {
    const raw = teachersRes as { data?: TeacherOption[] } | TeacherOption[] | undefined
    const arr = Array.isArray(raw) ? raw : (raw?.data ?? [])
    return arr
  })()

  const handleApprove = async (studentId: string) => {
    const teacherId = selectedTeacher[studentId]
    if (!teacherId) {
      showToast(isAr ? "اختر مدرس الأول" : "Select a teacher first", "error")
      return
    }
    setActionId(studentId)
    try {
      const res = await api.approveStudent(studentId, teacherId)
      if (res.success) {
        showToast(isAr ? "تمت الموافقة على الطالب" : "Student approved")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setActionId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!confirmReject) return
    setActionId(confirmReject.id)
    try {
      const res = await api.rejectStudent(confirmReject.id)
      if (res.success) {
        showToast(isAr ? "تم رفض الطالب" : "Student rejected")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setActionId(null)
      setConfirmReject(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-[#64748B]">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
      <m.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "الطلاب المعلّقين" : "Pending Students"}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr ? "اعتماد الطلاب الجدد وربطهم بمدرس في مكان واحد" : "Approve new students and assign a teacher, all in one place"}
        </p>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-[#0F172A]">{isAr ? "طلبات الطلاب" : "Student Requests"}</h2>
          <span className="ms-auto bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold">
            {students.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] mb-3">
                <Users className="w-6 h-6 text-[#94A3B8]" />
              </div>
              <p className="text-sm font-medium text-[#64748B]">
                {isAr ? "لا يوجد طلاب معلّقين حاليًا" : "No pending students right now"}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "المدرس" : "Teacher"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg shrink-0">
                          <Image src={resolveImageUrl(s.avatar, "/user-avatar.png")} alt={s.name || ""} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">{s.name}</p>
                          <p className="text-[11px] text-[#94A3B8]">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={selectedTeacher[s.id] ?? ""}
                        onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-full sm:w-56 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                      >
                        <option value="">{isAr ? "-- اختر --" : "-- Select --"}</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${s.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isAr ? "التفاصيل" : "Details"}
                        </Link>
                        <Button
                          size="sm"
                          disabled={actionId === s.id}
                          onClick={() => handleApprove(s.id)}
                          className="rounded-xl bg-[#059669] hover:bg-[#047857] text-white gap-1 h-8 text-xs"
                        >
                          {actionId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {isAr ? "اعتماد" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === s.id}
                          onClick={() => setConfirmReject({ id: s.id, name: s.name || "" })}
                          className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1 h-8 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {isAr ? "رفض" : "Reject"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </m.div>

      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-[#0F172A]">{isAr ? "رفض الطالب" : "Reject Student"}</h3>
            </div>
            <p className="text-sm text-[#64748B] mb-5">
              {isAr
                ? `هل أنت متأكد من رفض "${confirmReject.name}"؟`
                : `Are you sure you want to reject "${confirmReject.name}"?`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={!!actionId} onClick={() => setConfirmReject(null)} className="rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button disabled={!!actionId} onClick={handleConfirmReject} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                {actionId ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "رفض" : "Reject")}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
