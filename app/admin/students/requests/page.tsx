"use client"

import React, { useState } from "react"
import { m } from "framer-motion"
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

interface PaymentRequestItem {
  id: string
  userId: string
  courseId: string
  amount: number
  status: string
  notes?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string | null
    avatar?: string | null
    role?: string
    status?: string
    city?: string | null
    country?: string | null
    createdAt?: string
  }
  course?: {
    id: string
    title: string
    titleAr?: string | null
    slug?: string
    price: number
    discountPrice?: number | null
    currency?: string
    thumbnail?: string | null
    category?: string | null
    description?: string | null
  }
  reviewedByUser?: { id: string; name: string; email: string } | null
}

export default function StudentRequestsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: res, loading, refetch } = useApi<{ data: PaymentRequestItem[]; total: number; page: number; limit: number }>(
    () => api.getAdminPaymentRequests({ status: statusFilter || undefined, limit: 50 }),
    { immediate: true, deps: [statusFilter] }
  )

  const itemsRaw = (res as { data?: { data?: PaymentRequestItem[] } })?.data
  const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw?.data ?? []

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      const r = await api.approvePaymentRequest(id)
      if (r.success) {
        showToast(isAr ? "تمت الموافقة على الطلب" : "Request approved")
        refetch()
      } else {
        showToast(r.message || (isAr ? "فشل في الموافقة" : "Failed to approve"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (id: string) => {
    setRejecting(id)
    try {
      const r = await api.rejectPaymentRequest(id, rejectNotes)
      if (r.success) {
        showToast(isAr ? "تم رفض الطلب" : "Request rejected")
        setRejectId(null)
        setRejectNotes("")
        refetch()
      } else {
        showToast(r.message || (isAr ? "فشل في الرفض" : "Failed to reject"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setRejecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <m.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isAr ? "طلبات الطلاب" : "Student Requests"}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {isAr ? "طلبات الدفع بانتظار موافقة الأدمن" : "Payment requests awaiting admin approval"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-[#F1F5F9] p-1">
        {[
          { v: "", ar: "الكل", en: "All" },
          { v: "PENDING", ar: "قيد الانتظار", en: "Pending" },
          { v: "APPROVED", ar: "تمت الموافقة", en: "Approved" },
          { v: "REJECTED", ar: "مرفوض", en: "Rejected" },
        ].map(({ v, ar, en }) => (
          <button
            key={v || "all"}
            onClick={() => setStatusFilter(v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === v ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {isAr ? ar : en}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
            <Send className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm font-medium">{isAr ? "لا توجد طلبات" : "No requests"}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]/60">
            {items.map((req) => {
              const isExpanded = expandedId === req.id
              return (
                <div key={req.id} className="p-4">
                  <div
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    <div className="flex flex-1 items-start gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                        {req.user?.avatar ? (
                          <img src={resolveImageUrl(req.user.avatar)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0F172A]">
                          {req.user?.name ?? "—"} <span className="text-slate-500 font-normal">({req.user?.email ?? "—"})</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#64748B]">
                          <BookOpen className="h-4 w-4 shrink-0" />
                          {locale === "ar" ? req.course?.titleAr ?? req.course?.title : req.course?.title}
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatCurrency(req.amount)}
                        </p>
                        <span
                          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            req.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {req.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                          {req.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {req.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {req.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleApprove(req.id) }}
                            disabled={!!approving}
                            className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          >
                            {approving === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            {isAr ? "موافقة" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setRejectId(rejectId === req.id ? null : req.id) }}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            {isAr ? "رفض" : "Reject"}
                          </Button>
                        </>
                      )}
                      <button className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 grid gap-6 rounded-xl border border-slate-200/60 bg-slate-50/50 p-5 sm:grid-cols-2"
                    >
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                          <User className="h-4 w-4" />
                          {isAr ? "بيانات الطالب" : "Student Data"}
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">{isAr ? "الاسم" : "Name"}</dt>
                            <dd className="font-medium text-slate-900">{req.user?.name ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {isAr ? "البريد" : "Email"}</dt>
                            <dd dir="ltr" className="text-slate-900">{req.user?.email ?? "—"}</dd>
                          </div>
                          {req.user?.phone && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {isAr ? "الهاتف" : "Phone"}</dt>
                              <dd dir="ltr" className="text-slate-900">{req.user.phone}</dd>
                            </div>
                          )}
                          {req.user?.role && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "الدور" : "Role"}</dt>
                              <dd className="text-slate-900">{req.user.role}</dd>
                            </div>
                          )}
                          {req.user?.status && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "الحالة" : "Status"}</dt>
                              <dd className="text-slate-900">{req.user.status}</dd>
                            </div>
                          )}
                          {(req.user?.city || req.user?.country) && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {isAr ? "الموقع" : "Location"}</dt>
                              <dd className="text-slate-900">{[req.user.city, req.user.country].filter(Boolean).join(", ")}</dd>
                            </div>
                          )}
                          {req.user?.createdAt && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {isAr ? "تاريخ التسجيل" : "Joined"}</dt>
                              <dd className="text-slate-900">{new Date(req.user.createdAt).toLocaleDateString()}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                          <BookOpen className="h-4 w-4" />
                          {isAr ? "بيانات الدورة" : "Course Data"}
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">{isAr ? "العنوان" : "Title"}</dt>
                            <dd className="font-medium text-slate-900">{locale === "ar" ? req.course?.titleAr ?? req.course?.title : req.course?.title}</dd>
                          </div>
                          {req.course?.slug && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "الرابط" : "Slug"}</dt>
                              <dd className="text-slate-600 font-mono text-xs">{req.course.slug}</dd>
                            </div>
                          )}
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {isAr ? "السعر" : "Price"}</dt>
                            <dd className="text-slate-900">{formatCurrency(req.course?.price ?? 0)}</dd>
                          </div>
                          {req.course?.discountPrice != null && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "سعر الخصم" : "Discount"}</dt>
                              <dd className="text-emerald-600">{formatCurrency(req.course.discountPrice)}</dd>
                            </div>
                          )}
                          {req.course?.category && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "الفئة" : "Category"}</dt>
                              <dd className="text-slate-900">{req.course.category}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div className="sm:col-span-2">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                          <FileText className="h-4 w-4" />
                          {isAr ? "بيانات الطلب" : "Request Data"}
                        </h4>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">ID</dt>
                            <dd className="font-mono text-xs text-slate-600">{req.id}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">{isAr ? "المبلغ" : "Amount"}</dt>
                            <dd className="font-bold text-primary">{formatCurrency(req.amount)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">{isAr ? "تاريخ الطلب" : "Created"}</dt>
                            <dd className="text-slate-900">{new Date(req.createdAt).toLocaleString()}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">{isAr ? "آخر تحديث" : "Updated"}</dt>
                            <dd className="text-slate-900">{new Date(req.updatedAt).toLocaleString()}</dd>
                          </div>
                          {req.reviewedAt && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "تاريخ المراجعة" : "Reviewed At"}</dt>
                              <dd className="text-slate-900">{new Date(req.reviewedAt).toLocaleString()}</dd>
                            </div>
                          )}
                          {req.reviewedByUser && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-slate-500">{isAr ? "راجع بواسطة" : "Reviewed By"}</dt>
                              <dd className="text-slate-900">{req.reviewedByUser.name} ({req.reviewedByUser.email})</dd>
                            </div>
                          )}
                          {req.notes && (
                            <div className="sm:col-span-2">
                              <dt className="text-slate-500 mb-1">{isAr ? "ملاحظات" : "Notes"}</dt>
                              <dd className="rounded-lg bg-white p-3 text-slate-700 border border-slate-200">{req.notes}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </m.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "رفض الطلب" : "Reject Request"}</h3>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder={isAr ? "ملاحظة (اختياري)" : "Note (optional)"}
              className="mt-4 w-full rounded-xl border border-[#E2E8F0] p-3 text-sm outline-none focus:border-primary"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectNotes("") }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(rejectId)}
                disabled={!!rejecting}
              >
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAr ? "رفض" : "Reject"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
