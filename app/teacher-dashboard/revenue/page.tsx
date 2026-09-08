"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  ArrowUpRight,
  Download,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Wallet,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

function formatPayoutDate(dateStr: string, locale: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return locale === "ar" ? d.toLocaleDateString("ar-EG") : d.toLocaleDateString("en-US")
}

export default function TeacherRevenuePage() {
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"

  const { data: summaryData, refetch: refetchSummary } = useApi(() => api.getInstructorRevenueSummary())
  const { data: byCourseData } = useApi(() => api.getInstructorRevenueByCourse())
  const { data: payoutsRes, refetch: refetchPayouts } = useApi(() => api.getInstructorPayouts())
  const [requestingPayout, setRequestingPayout] = useState(false)

  const summary = summaryData as { total?: number; instructorShare?: number; thisMonth?: number; pending?: number } | null
  const byCourseRaw = Array.isArray(byCourseData) ? byCourseData : (byCourseData as { data?: any[] })?.data ?? []
  const totalRev = summary?.total ?? 0
  const revenueByCourseDisplay = byCourseRaw.map((c: any) => {
    const rev = c.revenue ?? c.amount ?? 0
    return {
      titleEn: c.title ?? c.courseTitle ?? "Course",
      titleAr: c.titleAr ?? c.courseTitleAr ?? "دورة",
      revenue: rev,
      students: c.students ?? c.totalStudents ?? 0,
      percentage: totalRev > 0 ? Math.round((rev / totalRev) * 100) : 0,
    }
  })
  const payoutsRaw = Array.isArray(payoutsRes) ? payoutsRes : (payoutsRes as { data?: any[] })?.data ?? []
  const payoutHistoryDisplay = payoutsRaw.map((p: any, i: number) => ({
    id: p.id ?? i + 1,
    dateEn: formatPayoutDate(p.requestedAt ?? p.createdAt ?? p.date, "en"),
    dateAr: formatPayoutDate(p.requestedAt ?? p.createdAt ?? p.date, "ar"),
    amount: p.amount ?? 0,
    statusEn: p.status === "COMPLETED" || p.status === "completed" ? "Completed" : "Pending",
    statusAr: p.status === "COMPLETED" || p.status === "completed" ? "مكتمل" : "قيد الانتظار",
    method: p.method ?? "PayPal",
  }))

  const stats = [
    { labelEn: "Total Revenue", labelAr: "إجمالي الإيرادات", value: formatCurrency(summary?.total ?? 0), icon: DollarSign, color: "from-emerald-500 to-emerald-400", change: "" },
    { labelEn: "This Month", labelAr: "هذا الشهر", value: formatCurrency(summary?.thisMonth ?? 0), icon: TrendingUp, color: "from-[#7C3AED] to-[#8B5CF6]", change: "" },
    { labelEn: "Pending Payout", labelAr: "مدفوعات معلقة", value: formatCurrency(summary?.pending ?? 0), icon: Clock, color: "from-amber-500 to-amber-400", change: "" },
  ]

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "الإيرادات" : "Revenue"}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar" ? "تتبع أرباحك ومدفوعاتك" : "Track your earnings and payouts"}
          </p>
        </div>
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={requestingPayout}
          onClick={async () => {
            setRequestingPayout(true)
            const res = await api.requestInstructorPayout()
            setRequestingPayout(false)
            if (res.success) {
              refetchSummary()
              refetchPayouts()
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-[#8B5CF6] text-white px-5 py-3 text-sm font-bold shadow-lg shadow-[#8B5CF6]/25 hover:bg-[#7C3AED] transition-colors disabled:opacity-70"
        >
          <Wallet className="w-4 h-4" />
          {requestingPayout ? (locale === "ar" ? "جاري..." : "Requesting...") : (locale === "ar" ? "طلب صرف" : "Request Payout")}
        </m.button>
      </m.div>

      <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <m.div
            key={stat.labelEn}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-50">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">{stat.change}</span>
                </div>
              )}
            </div>
            <p className="text-3xl font-extrabold text-[#0F172A]">{stat.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1 font-medium">
              {locale === "ar" ? stat.labelAr : stat.labelEn}
            </p>
          </m.div>
        ))}
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
            <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">
              {locale === "ar" ? "حصة الإيرادات" : "Revenue Share"}
            </p>
            <p className="text-xs text-[#64748B]">
              {locale === "ar"
                ? "تحصل على 70% من كل عملية بيع. تحتفظ المنصة بـ 30% لتغطية التكاليف والتسويق."
                : "You receive 70% of each sale. The platform retains 30% for costs and marketing."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-white overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]"
            />
          </div>
          <span className="text-sm font-bold text-[#8B5CF6]">70%</span>
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-[#0F172A] mb-5">
          {locale === "ar" ? "الإيرادات حسب الدورة" : "Revenue by Course"}
        </h3>
        <div className="space-y-4">
          {revenueByCourseDisplay.map((course, i) => (
            <m.div
              key={course.titleEn}
              initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10 shrink-0">
                <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-[#0F172A] truncate">
                    {locale === "ar" ? course.titleAr : course.titleEn}
                  </p>
                  <span className="text-sm font-bold text-emerald-600 shrink-0 ms-2">
                    {formatCurrency(course.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.percentage}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]"
                    />
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-medium shrink-0 w-8">
                    {course.percentage}%
                  </span>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h3 className="text-lg font-bold text-[#0F172A]">
            {locale === "ar" ? "سجل المدفوعات" : "Payout History"}
          </h3>
          <button className="flex items-center gap-1.5 text-xs text-[#8B5CF6] font-semibold hover:text-[#7C3AED] transition-colors">
            <Download className="w-3.5 h-3.5" />
            {locale === "ar" ? "تصدير" : "Export"}
          </button>
        </div>
        <div className="overflow-x-auto p-6 pt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/60">
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {locale === "ar" ? "التاريخ" : "Date"}
                </th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {locale === "ar" ? "المبلغ" : "Amount"}
                </th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">
                  {locale === "ar" ? "الطريقة" : "Method"}
                </th>
                <th className="text-start pb-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {locale === "ar" ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {payoutHistoryDisplay.map((payout, i) => (
                <m.tr
                  key={payout.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="border-b border-[#E2E8F0]/40"
                >
                  <td className="py-3.5 text-sm text-[#64748B]">
                    {locale === "ar" ? payout.dateAr : payout.dateEn}
                  </td>
                  <td className="py-3.5 text-sm font-bold text-[#0F172A]">
                    {formatCurrency(payout.amount)}
                  </td>
                  <td className="py-3.5 text-sm text-[#64748B] hidden sm:table-cell">
                    {payout.method}
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                      payout.statusEn === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {payout.statusEn === "Completed"
                        ? <CheckCircle className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />
                      }
                      {locale === "ar" ? payout.statusAr : payout.statusEn}
                    </span>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>
    </div>
  )
}
