"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import { m } from "framer-motion"
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

type PendingUser = {
  id: string
  name?: string
  email?: string
  avatar?: string
  specialty?: string
  subject?: string
  experience?: string
  createdAt?: string
  teacherProfile?: { specialty?: string; subject?: string }
}

const pendingTeachersFallback: PendingUser[] = []

export default function InstructorApprovalsPage() {
  const { locale } = useI18n()
  const router = useRouter()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [confirmModal, setConfirmModal] = useState<{ type: "reject"; id: string; name: string; role: "teacher" } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [instructorsEnabled, setInstructorsEnabled] = useState(true)

  useEffect(() => {
    api.getInstructorsStatus().then((r) => {
      if (r.success && r.data && !r.data.enabled) router.replace("/admin")
      else if (r.success && r.data) setInstructorsEnabled(r.data.enabled === true)
    }).catch(() => {})
  }, [router])

  const { data: pendingTeachersRes, loading: teachersLoading, refetch: refetchTeachers } = useApi(() => api.getPendingTeachers())

  const pageLoading = teachersLoading

  const pendingTeachers: PendingUser[] = (() => {
    const arr = pendingTeachersRes as PendingUser[] | undefined
    if (!Array.isArray(arr)) return pendingTeachersFallback
    return arr.map((p) => ({
      id: p.id,
      name: p.name ?? "",
      email: p.email ?? "",
      avatar: p.avatar ?? "/user-avatar.png",
      specialty: p.teacherProfile?.specialty ?? p.specialty ?? "",
      subject: p.teacherProfile?.subject ?? p.subject ?? "",
      createdAt: p.createdAt ?? "",
    }))
  })()

  const handleApproveTeacher = async (id: string) => {
    setActionLoading(true)
    try {
      await api.approveTeacher(id)
      showToast(isAr ? "تمت الموافقة على المدرس بنجاح" : "Teacher approved successfully")
      refetchTeachers()
    } catch {
      showToast(isAr ? "حدث خطأ أثناء الموافقة" : "Failed to approve teacher", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = (id: string, name: string, role: "teacher") => {
    setConfirmModal({ type: "reject", id, name, role })
  }

  const handleConfirmReject = async () => {
    if (!confirmModal) return
    setActionLoading(true)
    try {
      await api.rejectTeacher(confirmModal.id)
      showToast(isAr ? "تم رفض طلب المدرس" : "Teacher request rejected")
      refetchTeachers()
    } catch {
      showToast(isAr ? "حدث خطأ أثناء الرفض" : "Failed to reject request", "error")
    } finally {
      setActionLoading(false)
      setConfirmModal(null)
    }
  }

  if (pageLoading) {
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
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {isAr ? "موافقات المدرسين" : "Teacher Approvals"}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr ? "مراجعة طلبات الانضمام والموافقة أو الرفض" : "Review join requests and approve or reject"}
        </p>
      </m.div>

      {/* جدول تسجيلات المدرسين */}
      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-base font-bold text-[#0F172A]">
            {isAr ? "تسجيلات المدرسين" : "Teacher Registrations"}
          </h2>
          <span className="ms-auto bg-[#8B5CF6]/10 text-[#8B5CF6] px-2.5 py-1 rounded-lg text-xs font-bold">
            {pendingTeachers.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          {pendingTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] mb-3">
                <GraduationCap className="w-6 h-6 text-[#94A3B8]" />
              </div>
              <p className="text-sm font-medium text-[#64748B]">
                {isAr ? "لا توجد طلبات معلقة للمدرسين" : "No pending teacher requests"}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "المدرس" : "Teacher"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "التخصص" : "Specialty"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "المادة" : "Subject"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {pendingTeachers.map((t) => (
                  <tr key={t.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg shrink-0">
                          <Image src={resolveImageUrl(t.avatar, "/user-avatar.png")} alt={t.name!} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">{t.name}</p>
                          <p className="text-[11px] text-[#94A3B8]">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{t.specialty || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{t.subject || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${t.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isAr ? "عرض البيانات" : "View Details"}
                        </Link>
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleApproveTeacher(t.id)}
                          className="rounded-xl bg-[#059669] hover:bg-[#047857] text-white gap-1 h-8 text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> {isAr ? "موافقة" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => handleReject(t.id, t.name!, "teacher")}
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

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-[#0F172A]">
                {isAr ? "رفض الطلب" : "Reject Request"}
              </h3>
            </div>
            <p className="text-sm text-[#64748B] mb-5">
              {isAr
                ? `هل أنت متأكد من رفض طلب "${confirmModal.name}"؟`
                : `Are you sure you want to reject "${confirmModal.name}"'s request?`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={actionLoading} onClick={() => setConfirmModal(null)} className="rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "رفض" : "Reject")}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
