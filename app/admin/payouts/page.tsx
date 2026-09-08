"use client"

import { useState, useEffect, useCallback } from "react"
import { m, AnimatePresence } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  CreditCard,
  Search,
  Filter,
  X,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  MapPin,
} from "lucide-react"
import Image from "next/image"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { resolveImageUrl } from "@/lib/utils"

function formatDate(dateStr: string, locale: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return locale === "ar" ? d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function AdminPayoutsPage() {
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"

  const [statusFilter, setStatusFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [selectedPayout, setSelectedPayout] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)

  const fetchPayouts = useCallback(() => api.getAdminPayouts({ status: statusFilter || undefined, page, limit: 20 }), [statusFilter, page])
  const { data: payoutsRes, refetch } = useApi(fetchPayouts)
  const payouts = Array.isArray(payoutsRes) ? payoutsRes : (payoutsRes as any)?.data ?? []
  const totalPayouts = (payoutsRes as any)?.pagination?.total ?? payouts.length
  const totalPages = Math.ceil(totalPayouts / 20) || 1

  useEffect(() => { setPage(1) }, [statusFilter])

  const openDetail = async (payoutId: string) => {
    setDetailLoading(true)
    const res = await api.getAdminPayoutDetail(payoutId)
    setDetailLoading(false)
    if (res.success && res.data) setSelectedPayout(res.data)
  }

  const handleApprove = async () => {
    if (!selectedPayout) return
    setActionLoading(true)
    const res = await api.approveAdminPayout(selectedPayout.id)
    setActionLoading(false)
    if (res.success) {
      setSelectedPayout(null)
      refetch()
    }
  }

  const handleReject = async () => {
    if (!selectedPayout) return
    setActionLoading(true)
    const res = await api.rejectAdminPayout(selectedPayout.id, rejectNotes)
    setActionLoading(false)
    if (res.success) {
      setShowRejectModal(false)
      setRejectNotes("")
      setSelectedPayout(null)
      refetch()
    }
  }

  const statusConfig = (status: string) => {
    const s = (status ?? "").toUpperCase()
    if (s === "COMPLETED") return { labelAr: "تم التحويل", labelEn: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle }
    if (s === "REJECTED") return { labelAr: "مرفوض", labelEn: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle }
    if (s === "PROCESSING") return { labelAr: "قيد المعالجة", labelEn: "Processing", color: "bg-primary/10 text-primary border-blue-200", icon: Clock }
    return { labelAr: "قيد المراجعة", labelEn: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock }
  }

  const methodLabels: Record<string, { ar: string; en: string }> = {
    vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" },
    instapay: { ar: "إنستاباي", en: "InstaPay" },
    bank: { ar: "تحويل بنكي", en: "Bank Transfer" },
    paypal: { ar: "باي بال", en: "PayPal" },
  }

  const roleLabels: Record<string, { ar: string; en: string }> = {
    INSTRUCTOR: { ar: "مدرب", en: "Instructor" },
    TEACHER: { ar: "مدرس", en: "Teacher" },
  }

  const statusFilters = [
    { key: "", labelAr: "الكل", labelEn: "All" },
    { key: "PENDING", labelAr: "معلق", labelEn: "Pending" },
    { key: "COMPLETED", labelAr: "مكتمل", labelEn: "Completed" },
    { key: "REJECTED", labelAr: "مرفوض", labelEn: "Rejected" },
  ]

  if (selectedPayout) {
    const p = selectedPayout
    const sc = statusConfig(p.status)
    const user = p.user ?? {}
    const method = p.payoutMethod ?? p.method ?? "—"
    return (
      <div dir={dir} className="space-y-6">
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => setSelectedPayout(null)} className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
            <ArrowLeft className={`w-5 h-5 text-[#64748B] ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A]">{locale === "ar" ? "تفاصيل طلب السحب" : "Withdrawal Request Detail"}</h1>
            <p className="text-xs text-[#94A3B8]">#{p.id?.slice(0, 8)}</p>
          </div>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info */}
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0F172A] mb-5">{locale === "ar" ? "بيانات المستخدم" : "User Information"}</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl ring-2 ring-[#8B5CF6]/20">
                <Image src={resolveImageUrl(user.avatar, "/user-avatar.png")} alt="" fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{user.name ?? "—"}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[10px] font-bold text-[#8B5CF6]">
                  {locale === "ar" ? (roleLabels[user.role]?.ar ?? user.role) : (roleLabels[user.role]?.en ?? user.role)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Mail className="w-4 h-4 text-[#94A3B8]" />
                <span>{user.email ?? "—"}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Phone className="w-4 h-4 text-[#94A3B8]" />
                  <span>{user.phone}</span>
                </div>
              )}
              {(user.city || user.country) && (
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <MapPin className="w-4 h-4 text-[#94A3B8]" />
                  <span>{[user.city, user.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </m.div>

          {/* Payout Details */}
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0F172A] mb-5">{locale === "ar" ? "تفاصيل الطلب" : "Request Details"}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "المبلغ المطلوب" : "Amount"}</span>
                <span className="text-lg font-extrabold text-[#0F172A]">{formatCurrency(p.netAmount ?? p.amount ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "إجمالي الإيرادات" : "Course Revenue"}</span>
                <span className="text-sm font-bold text-[#64748B]">{formatCurrency(p.courseRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "رسوم المنصة" : "Platform Fee"}</span>
                <span className="text-sm font-bold text-red-500">{formatCurrency(p.platformFee ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "الحالة" : "Status"}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${sc.color}`}>
                  <sc.icon className="w-3 h-3" />
                  {locale === "ar" ? sc.labelAr : sc.labelEn}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "تاريخ الطلب" : "Requested"}</span>
                <span className="text-sm text-[#64748B]">{formatDate(p.requestedAt ?? p.createdAt, locale)}</span>
              </div>
              {p.processedAt && (
                <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]/40">
                  <span className="text-xs text-[#94A3B8] font-semibold">{locale === "ar" ? "تاريخ المعالجة" : "Processed"}</span>
                  <span className="text-sm text-[#64748B]">{formatDate(p.processedAt, locale)}</span>
                </div>
              )}
            </div>
          </m.div>

          {/* Transfer Info */}
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-[#0F172A] mb-5">{locale === "ar" ? "بيانات التحويل" : "Transfer Information"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-semibold text-[#64748B]">{locale === "ar" ? "وسيلة التحويل" : "Transfer Method"}</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">
                  {locale === "ar" ? (methodLabels[method]?.ar ?? method) : (methodLabels[method]?.en ?? method)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-semibold text-[#64748B]">{locale === "ar" ? "رقم / حساب التحويل" : "Account / Number"}</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">{p.payoutEmail ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-semibold text-[#64748B]">{locale === "ar" ? "نسبة المدرب" : "Revenue Share"}</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">{p.revenueShare ?? 70}%</p>
              </div>
            </div>

            {p.status === "PENDING" && (
              <div className="flex gap-3 mt-6">
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? (locale === "ar" ? "جاري..." : "Processing...") : (locale === "ar" ? "موافقة وتأكيد التحويل" : "Approve & Confirm Transfer")}
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl border border-red-200 text-red-600 px-6 py-3 text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {locale === "ar" ? "رفض" : "Reject"}
                </m.button>
              </div>
            )}
          </m.div>
        </div>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRejectModal(false)}>
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-[#0F172A] mb-4">{locale === "ar" ? "رفض طلب السحب" : "Reject Withdrawal"}</h3>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#64748B] mb-2">{locale === "ar" ? "سبب الرفض (اختياري)" : "Rejection reason (optional)"}</label>
                  <textarea
                    value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8B5CF6]/40 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button onClick={handleReject} disabled={actionLoading} className="flex-1 rounded-xl bg-red-500 text-white px-4 py-3 text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
                    {actionLoading ? (locale === "ar" ? "جاري..." : "Processing...") : (locale === "ar" ? "تأكيد الرفض" : "Confirm Reject")}
                  </button>
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">{locale === "ar" ? "طلبات سحب الأموال" : "Withdrawal Requests"}</h1>
        <p className="text-sm text-[#94A3B8] mt-1">{locale === "ar" ? "إدارة طلبات سحب أموال المدربين والمدرسين" : "Manage instructor and teacher withdrawal requests"}</p>
      </m.div>

      {/* Filters */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === f.key
                ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#8B5CF6]/30"
            }`}
          >
            {locale === "ar" ? f.labelAr : f.labelEn}
          </button>
        ))}
      </m.div>

      {/* Table */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {payouts.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-14 h-14 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">{locale === "ar" ? "لا توجد طلبات سحب" : "No withdrawal requests"}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]/60">
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "المستخدم" : "User"}</th>
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "الدور" : "Role"}</th>
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">{locale === "ar" ? "الوسيلة" : "Method"}</th>
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">{locale === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="text-start px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any, i: number) => {
                  const sc = statusConfig(p.status)
                  const method = p.payoutMethod ?? p.method ?? "—"
                  return (
                    <m.tr
                      key={p.id ?? i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.02 * i }}
                      onClick={() => openDetail(p.id)}
                      className="border-b border-[#E2E8F0]/40 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-[#E2E8F0]">
                            <Image src={resolveImageUrl(p.user?.avatar, "/user-avatar.png")} alt="" fill className="object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0F172A]">{p.user?.name ?? "—"}</p>
                            <p className="text-[10px] text-[#94A3B8]">{p.user?.email ?? ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[10px] font-bold text-[#8B5CF6]">
                          {locale === "ar" ? (roleLabels[p.user?.role]?.ar ?? p.user?.role ?? "—") : (roleLabels[p.user?.role]?.en ?? p.user?.role ?? "—")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-[#0F172A]">{formatCurrency(p.netAmount ?? p.amount ?? 0)}</td>
                      <td className="px-5 py-4 text-sm text-[#64748B] hidden md:table-cell">
                        {locale === "ar" ? (methodLabels[method]?.ar ?? method) : (methodLabels[method]?.en ?? method)}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#64748B] hidden sm:table-cell">{formatDate(p.requestedAt ?? p.createdAt, locale)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${sc.color}`}>
                          <sc.icon className="w-3 h-3" />
                          {locale === "ar" ? sc.labelAr : sc.labelEn}
                        </span>
                      </td>
                    </m.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-[#E2E8F0]/60">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <span className="text-xs text-[#94A3B8]">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors">
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </m.div>
    </div>
  )
}
