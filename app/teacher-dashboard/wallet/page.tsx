"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  TrendingUp,
  Send,
  AlertCircle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

function formatDate(dateStr: string, locale: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return locale === "ar" ? d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function TeacherWalletPage() {
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"

  const { data: walletData, refetch: refetchWallet } = useApi(() => api.getInstructorWalletSummary())
  const { data: payoutsRes, refetch: refetchPayouts } = useApi(() => api.getInstructorPayouts({ limit: 50 }))

  const wallet = walletData as {
    totalRevenue?: number; totalEarnings?: number; platformFee?: number;
    commissionType?: string; commissionDetail?: string;
    revenueSharePercent?: number; totalPaid?: number; totalPending?: number;
    availableBalance?: number; payoutMethod?: string; payoutEmail?: string;
  } | null

  const payoutsRaw = Array.isArray(payoutsRes) ? payoutsRes : (payoutsRes as any)?.data ?? []

  const [requesting, setRequesting] = useState(false)
  const [requestAmount, setRequestAmount] = useState("")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestError, setRequestError] = useState("")

  const handleRequestPayout = async () => {
    setRequestError("")
    const amount = requestAmount ? parseFloat(requestAmount) : undefined
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      setRequestError(locale === "ar" ? "أدخل مبلغ صحيح" : "Enter a valid amount")
      return
    }
    if (amount && amount > (wallet?.availableBalance ?? 0)) {
      setRequestError(locale === "ar" ? "المبلغ أكبر من الرصيد المتاح" : "Amount exceeds available balance")
      return
    }
    setRequesting(true)
    const res = await api.requestInstructorPayout(amount)
    setRequesting(false)
    if (res.success) {
      setShowRequestModal(false)
      setRequestAmount("")
      refetchWallet()
      refetchPayouts()
    } else {
      setRequestError(res.message || (locale === "ar" ? "فشل الطلب" : "Request failed"))
    }
  }

  const methodLabels: Record<string, { ar: string; en: string }> = {
    vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" },
    instapay: { ar: "إنستاباي", en: "InstaPay" },
    bank: { ar: "تحويل بنكي", en: "Bank Transfer" },
  }

  const statusConfig = (status: string) => {
    const s = status.toUpperCase()
    if (s === "COMPLETED") return { labelAr: "تم التحويل", labelEn: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle }
    if (s === "REJECTED") return { labelAr: "مرفوض", labelEn: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle }
    return { labelAr: "قيد المراجعة", labelEn: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock }
  }

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "المحفظة" : "Wallet"}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar" ? "إدارة رصيدك وطلبات السحب" : "Manage your balance and withdrawal requests"}
          </p>
        </div>
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRequestModal(true)}
          disabled={(wallet?.availableBalance ?? 0) <= 0}
          className="flex items-center gap-2 rounded-xl bg-[#8B5CF6] text-white px-5 py-3 text-sm font-bold shadow-lg shadow-[#8B5CF6]/25 hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {locale === "ar" ? "طلب سحب" : "Request Withdrawal"}
        </m.button>
      </m.div>

      {/* Wallet Cards */}
      <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <m.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A]">{formatCurrency(wallet?.availableBalance ?? 0)}</p>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">{locale === "ar" ? "الرصيد المتاح" : "Available Balance"}</p>
        </m.div>

        <m.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A]">{formatCurrency(wallet?.totalEarnings ?? 0)}</p>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">{locale === "ar" ? "إجمالي الأرباح" : "Total Earnings"}</p>
        </m.div>

        <m.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 shadow-md">
              <ArrowDownCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A]">{formatCurrency(wallet?.totalPaid ?? 0)}</p>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">{locale === "ar" ? "إجمالي المسحوب" : "Total Withdrawn"}</p>
        </m.div>

        <m.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A]">{formatCurrency(wallet?.totalPending ?? 0)}</p>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">{locale === "ar" ? "قيد الانتظار" : "Pending"}</p>
        </m.div>
      </m.div>

      {/* Revenue Share Info */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
            <DollarSign className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0F172A]">{locale === "ar" ? "حصة الإيرادات والعمولة" : "Revenue Share & Commission"}</p>
            <p className="text-xs text-[#64748B]">
              {locale === "ar"
                ? `حصتك: ${wallet?.revenueSharePercent ?? 70}% • عمولة المنصة: ${wallet?.commissionDetail ?? `${100 - (wallet?.revenueSharePercent ?? 70)}%`}`
                : `Your share: ${wallet?.revenueSharePercent ?? 70}% • Platform fee: ${wallet?.commissionDetail ?? `${100 - (wallet?.revenueSharePercent ?? 70)}%`}`}
            </p>
          </div>
          <span className="text-lg font-bold text-[#8B5CF6]">{wallet?.revenueSharePercent ?? 70}%</span>
        </div>
        {wallet?.payoutMethod && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-semibold">{locale === "ar" ? "وسيلة السحب:" : "Withdrawal method:"}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0]">
              {locale === "ar" ? (methodLabels[wallet.payoutMethod]?.ar ?? wallet.payoutMethod) : (methodLabels[wallet.payoutMethod]?.en ?? wallet.payoutMethod)}
            </span>
            {wallet.payoutEmail && <span className="text-[#94A3B8]">({wallet.payoutEmail})</span>}
          </div>
        )}
      </m.div>

      {/* Payout History */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-bold text-[#0F172A]">{locale === "ar" ? "سجل طلبات السحب" : "Withdrawal History"}</h3>
        </div>
        <div className="overflow-x-auto p-6 pt-4">
          {payoutsRaw.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">{locale === "ar" ? "لا توجد طلبات سحب بعد" : "No withdrawal requests yet"}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0]/60">
                  <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                  <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">{locale === "ar" ? "الوسيلة" : "Method"}</th>
                  <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{locale === "ar" ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {payoutsRaw.map((p: any, i: number) => {
                  const sc = statusConfig(p.status)
                  const method = p.method ?? "—"
                  return (
                    <m.tr key={p.id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }} className="border-b border-[#E2E8F0]/40">
                      <td className="py-3.5 text-sm text-[#64748B]">{formatDate(p.requestedAt ?? p.createdAt, locale)}</td>
                      <td className="py-3.5 text-sm font-bold text-[#0F172A]">{formatCurrency(p.netAmount ?? p.amount ?? 0)}</td>
                      <td className="py-3.5 text-sm text-[#64748B] hidden sm:table-cell">
                        {locale === "ar" ? (methodLabels[method]?.ar ?? method) : (methodLabels[method]?.en ?? method)}
                      </td>
                      <td className="py-3.5">
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
      </m.div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRequestModal(false)}>
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">{locale === "ar" ? "طلب سحب رصيد" : "Request Withdrawal"}</h3>
            <p className="text-xs text-[#94A3B8] mb-6">
              {locale === "ar" ? `الرصيد المتاح: ${formatCurrency(wallet?.availableBalance ?? 0)}` : `Available: ${formatCurrency(wallet?.availableBalance ?? 0)}`}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#64748B] mb-2">
                {locale === "ar" ? "المبلغ المطلوب" : "Withdrawal Amount"}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={wallet?.availableBalance ?? 0}
                value={requestAmount}
                onChange={e => setRequestAmount(e.target.value)}
                placeholder={locale === "ar" ? "اتركه فارغ لسحب الكل" : "Leave empty to withdraw all"}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8B5CF6]/40"
              />
            </div>

            {wallet?.payoutMethod && (
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 p-3 mb-4">
                <p className="text-xs text-[#64748B]">
                  <span className="font-semibold">{locale === "ar" ? "سيتم التحويل إلى:" : "Will be transferred to:"}</span>{" "}
                  {locale === "ar" ? (methodLabels[wallet.payoutMethod]?.ar ?? wallet.payoutMethod) : (methodLabels[wallet.payoutMethod]?.en ?? wallet.payoutMethod)}
                  {wallet.payoutEmail && ` — ${wallet.payoutEmail}`}
                </p>
              </div>
            )}

            {!wallet?.payoutMethod && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  {locale === "ar" ? "يرجى تحديد وسيلة الدفع أولاً من الإعدادات" : "Please set your payment method in Settings first"}
                </p>
              </div>
            )}

            {requestError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-700">{requestError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={requesting || !wallet?.payoutMethod}
                className="flex-1 rounded-xl bg-[#8B5CF6] text-white px-4 py-3 text-sm font-bold shadow-lg shadow-[#8B5CF6]/25 hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
              >
                {requesting ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") : (locale === "ar" ? "تأكيد الطلب" : "Confirm")}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
