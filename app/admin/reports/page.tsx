"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Users,
  BookOpen,
  DollarSign,
  FileText,
  Download,
  GraduationCap,
  Award,
  Loader2,
  UserCheck,
  ShoppingCart,
  Star,
  FileSpreadsheet,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const reportTypes = [
  { key: "financial-detail", icon: DollarSign, en: "Financial Reports", ar: "التقارير المالية", color: "bg-[#059669]/10 text-[#059669]" },
  { key: "students-detail", icon: GraduationCap, en: "Students", ar: "الطلاب", color: "bg-primary/10 text-primary" },
  { key: "teachers-detail", icon: UserCheck, en: "Teachers", ar: "المعلمون", color: "bg-[#8B5CF6]/10 text-[#8B5CF6]" },
  { key: "courses-detail", icon: BookOpen, en: "Courses", ar: "الدورات", color: "bg-[#14B8A6]/10 text-[#14B8A6]" },
  { key: "orders-detail", icon: ShoppingCart, en: "Orders & Revenue", ar: "الطلبات والإيرادات", color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  { key: "enrollments-detail", icon: Users, en: "Enrollments", ar: "التسجيلات", color: "bg-[#0EA5E9]/10 text-[#0EA5E9]" },
  { key: "exams-detail", icon: FileText, en: "Exam Results", ar: "نتائج الاختبارات", color: "bg-[#EC4899]/10 text-[#EC4899]" },
  { key: "reviews-detail", icon: Star, en: "Reviews", ar: "التقييمات", color: "bg-[#14B8A6]/10 text-[#14B8A6]" },
  { key: "certificates-detail", icon: Award, en: "Certificates", ar: "الشهادات", color: "bg-[#6366F1]/10 text-[#6366F1]" },
]

export default function ReportsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [activeReport, setActiveReport] = useState("financial-detail")
  const [dateRange, setDateRange] = useState("6months")
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)

  const { data: reportRes, loading: reportLoading, error: reportError } = useApi(
    () => api.getAdminReport(activeReport, dateRange),
    { deps: [activeReport, dateRange] }
  )

  const reportData = reportRes as { summary?: { total: number; totalRevenue?: number }; detailedData?: Record<string, unknown>[] } | undefined
  const detailedData = reportData?.detailedData ?? []
  const summary = reportData?.summary ?? { total: 0 }

  const handleExport = useCallback(
    async (format: string) => {
      setExportingFormat(format)
      try {
        const res = await api.exportAdminReport(activeReport, format, dateRange)
        if (res.success && res.data) {
          const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data)])
          const ext = format === "excel" || format === "xlsx" ? "xlsx" : format
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${activeReport}-report.${ext}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          showToast(isAr ? `تم تصدير التقرير بصيغة ${ext.toUpperCase()}` : `Report exported as ${ext.toUpperCase()}`, "success")
        } else {
          showToast(res.message || (isAr ? "فشل تصدير التقرير" : "Failed to export report"), "error")
        }
      } catch {
        showToast(isAr ? "حدث خطأ أثناء التصدير" : "Export failed", "error")
      } finally {
        setExportingFormat(null)
      }
    },
    [activeReport, dateRange, isAr, showToast]
  )

  const columns = detailedData.length > 0 ? Object.keys(detailedData[0] as Record<string, unknown>) : []

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "التقارير الشاملة" : "Comprehensive Reports"}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr ? "تقارير تفصيلية لكل جوانب المنصة مع إمكانية تصدير Excel" : "Detailed reports for all platform aspects with Excel export"}
        </p>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {reportTypes.map(rt => (
          <m.div
            key={rt.key}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            onClick={() => setActiveReport(rt.key)}
            className={`bg-white rounded-2xl p-4 border-2 shadow-sm cursor-pointer transition-all ${
              activeReport === rt.key ? "border-primary shadow-md" : "border-[#E2E8F0]/60 hover:border-primary/30"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${rt.color} mb-2`}>
              <rt.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">{isAr ? rt.ar : rt.en}</p>
          </m.div>
        ))}
      </m.div>

      <m.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1">
          {[
            { key: "30days", en: "30 Days", ar: "30 يوم" },
            { key: "6months", en: "6 Months", ar: "6 أشهر" },
            { key: "1year", en: "1 Year", ar: "سنة" },
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setDateRange(range.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateRange === range.key ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
            >
              {isAr ? range.ar : range.en}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            disabled={!!exportingFormat}
            onClick={() => handleExport("excel")}
            className="gap-2 rounded-xl text-xs h-9"
          >
            {exportingFormat === "excel" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Excel
          </Button>
          <Button variant="outline" disabled={!!exportingFormat} onClick={() => handleExport("csv")} className="gap-2 rounded-xl text-xs h-9">
            {exportingFormat === "csv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            CSV
          </Button>
        </div>
      </m.div>

      {reportError && (
        <m.div variants={fadeUp} className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {reportError}
        </m.div>
      )}
      {reportLoading ? (
        <m.div variants={fadeUp} className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </m.div>
      ) : (
        <>
          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5">
            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{isAr ? "الإجمالي" : "Total Records"}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{summary.total?.toLocaleString() ?? 0}</p>
              </div>
              {summary.totalRevenue != null && (
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{isAr ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                  <p className="text-2xl font-bold text-[#059669]">${(summary.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
              )}
            </div>
          </m.div>

          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0]/60 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#0F172A]">
                {isAr ? "البيانات التفصيلية" : "Detailed Data"} • {reportTypes.find(r => r.key === activeReport)?.[isAr ? "ar" : "en"]}
              </h3>
              <Button variant="outline" size="sm" disabled={!!exportingFormat} onClick={() => handleExport("excel")} className="gap-1.5 rounded-lg text-xs h-8">
                {exportingFormat ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                {isAr ? "تصدير Excel" : "Export Excel"}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {detailedData.length === 0 ? (
                <div className="p-12 text-center text-[#64748B] text-sm">{isAr ? "لا توجد بيانات" : "No data"}</div>
              ) : (
                <table className="w-full min-w-[600px]">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                      {columns.map(col => (
                        <th key={col} className="text-start px-4 py-3 font-semibold whitespace-nowrap">
                          {col.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailedData.map((row, i) => (
                      <tr key={i} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                        {columns.map(col => {
                          const val = (row as Record<string, unknown>)[col]
                          const display =
                            val instanceof Date
                              ? val.toLocaleDateString()
                              : typeof val === "object" && val !== null
                                ? JSON.stringify(val)
                                : String(val ?? "")
                          return (
                            <td key={col} className="px-4 py-3 text-sm text-[#64748B] max-w-[200px] truncate" title={display}>
                              {display}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </m.div>
        </>
      )}
    </m.div>
  )
}
