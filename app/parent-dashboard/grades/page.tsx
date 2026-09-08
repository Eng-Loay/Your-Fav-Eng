"use client"

import { useState, useMemo } from "react"
import { m } from "framer-motion"
import { ChevronDown, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Badge } from "@/components/ui/badge"

export default function ParentGradesPage() {
  const { locale, dir } = useI18n()
  const [selectedChild, setSelectedChild] = useState(0)
  const isRTL = dir === "rtl"

  const { data: childrenData } = useApi(() => api.getParentChildren())
  const children = (childrenData && Array.isArray(childrenData) && childrenData.length > 0)
    ? childrenData.map((c: { id: string; name?: unknown }) => {
        const n = typeof c.name === "string" ? c.name : (c.name && typeof c.name === "object" && "name" in c.name ? String((c.name as { name: string }).name) : "Child")
        return { id: c.id, nameEn: n || "Child", nameAr: n || "طفل" }
      })
    : []

  const childId = children[Math.min(selectedChild, children.length - 1)]?.id ?? children[0]?.id
  const { data: gradesData } = useApi(
    () => (childId ? api.getChildGrades(childId) : Promise.resolve({ success: false })),
    { deps: [childId], immediate: !!childId }
  )

  const gradesDataMapped = useMemo(() => {
    const rows: { courseEn: string; courseAr: string; assignmentEn: string; assignmentAr: string; score: number; total: number; gradeEn: string; gradeAr: string; dateEn: string; dateAr: string; trend: string }[] = []
    if (gradesData && typeof gradesData === "object") {
      const g = gradesData as { examResults?: Array<{ score?: number; exam?: { title?: string }; createdAt?: string }>; assignmentSubmissions?: Array<{ grade?: number; assignment?: { title?: string }; createdAt?: string }> }
      ;(g.examResults || []).forEach((e) => {
        rows.push({
          courseEn: e.exam?.title || "Exam",
          courseAr: e.exam?.title || "اختبار",
          assignmentEn: e.exam?.title || "",
          assignmentAr: e.exam?.title || "",
          score: e.score ?? 0,
          total: 100,
          gradeEn: (e.score ?? 0) >= 90 ? "A" : (e.score ?? 0) >= 80 ? "B+" : "B",
          gradeAr: (e.score ?? 0) >= 90 ? "أ" : (e.score ?? 0) >= 80 ? "ب+" : "ب",
          dateEn: e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
          dateAr: e.createdAt ? new Date(e.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "",
          trend: "stable",
        })
      })
      ;(g.assignmentSubmissions || []).forEach((a) => {
        rows.push({
          courseEn: a.assignment?.title || "Assignment",
          courseAr: a.assignment?.title || "واجب",
          assignmentEn: a.assignment?.title || "",
          assignmentAr: a.assignment?.title || "",
          score: a.grade ?? 0,
          total: 100,
          gradeEn: (a.grade ?? 0) >= 90 ? "A" : (a.grade ?? 0) >= 80 ? "B+" : "B",
          gradeAr: (a.grade ?? 0) >= 90 ? "أ" : (a.grade ?? 0) >= 80 ? "ب+" : "ب",
          dateEn: a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
          dateAr: a.createdAt ? new Date(a.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "",
          trend: "stable",
        })
      })
    }
    return rows
  }, [gradesData])

  const subjectAverages = useMemo(() => {
    if (gradesDataMapped.length > 0) {
      const bySubject: Record<string, { sum: number; count: number }> = {}
      gradesDataMapped.forEach((g) => {
        const key = g.courseEn
        if (!bySubject[key]) bySubject[key] = { sum: 0, count: 0 }
        bySubject[key].sum += g.score
        bySubject[key].count += 1
      })
      const colors = ["from-[#059669] to-[#10B981]", "from-primary to-primary/90", "from-[#F59E0B] to-[#FBBF24]", "from-[#8B5CF6] to-[#A78BFA]", "from-[#EC4899] to-[#F472B6]"]
      return Object.entries(bySubject).slice(0, 5).map(([subj, v], i) => ({
        subjectEn: subj,
        subjectAr: subj,
        avg: Math.round(v.sum / v.count),
        color: colors[i % colors.length],
      }))
    }
    return []
  }, [gradesDataMapped])

  const overallAvg = gradesDataMapped.length > 0
    ? Math.round(gradesDataMapped.reduce((sum, g) => sum + g.score, 0) / gradesDataMapped.length)
    : 0

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الدرجات" : "Grades"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "عرض درجات أبنائك" : "View your children's grades"}</p>
        </div>
        <div className="relative">
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(Number(e.target.value))}
            className="appearance-none px-4 pe-10 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] cursor-pointer"
          >
            {children.map((child, i) => (
              <option key={child.id} value={i}>{locale === "ar" ? child.nameAr : child.nameEn}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-[#EC4899] to-[#F472B6] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6" />
          <h3 className="font-bold text-lg">{locale === "ar" ? "المعدل العام" : "Overall Average"}</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-extrabold">{overallAvg}%</span>
          <span className="text-white/70 mb-2">
            {overallAvg >= 90 ? (locale === "ar" ? "ممتاز" : "Excellent") : overallAvg >= 80 ? (locale === "ar" ? "جيد جداً" : "Very Good") : (locale === "ar" ? "جيد" : "Good")}
          </span>
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <h3 className="font-bold text-[#0F172A] mb-4">{locale === "ar" ? "متوسط المواد" : "Subject Averages"}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {subjectAverages.map((subject, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 text-center"
            >
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${subject.color} mb-2`}>
                <span className="text-xs font-bold text-white">{subject.avg}</span>
              </div>
              <p className="text-xs font-semibold text-[#0F172A]">{locale === "ar" ? subject.subjectAr : subject.subjectEn}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]/60">
          <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "سجل الدرجات" : "Grade History"}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/60">
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "المادة" : "Subject"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">{locale === "ar" ? "الواجب" : "Assignment"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "الدرجة" : "Score"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "التقدير" : "Grade"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">{locale === "ar" ? "التاريخ" : "Date"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden lg:table-cell">{locale === "ar" ? "الاتجاه" : "Trend"}</th>
              </tr>
            </thead>
            <tbody>
              {gradesDataMapped.map((grade, i) => (
                <m.tr
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-[#0F172A]">{locale === "ar" ? grade.courseAr : grade.courseEn}</span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-[#64748B]">{locale === "ar" ? grade.assignmentAr : grade.assignmentEn}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-bold ${grade.score >= 90 ? "text-[#059669]" : grade.score >= 80 ? "text-primary" : "text-[#F59E0B]"}`}>
                      {grade.score}/{grade.total}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary" className={`text-[10px] border-0 ${grade.score >= 90 ? "bg-[#059669]/10 text-[#059669]" : grade.score >= 80 ? "bg-primary/10 text-primary" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>
                      {locale === "ar" ? grade.gradeAr : grade.gradeEn}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#64748B]">{locale === "ar" ? grade.dateAr : grade.dateEn}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {grade.trend === "up" && <TrendingUp className="w-4 h-4 text-[#059669]" />}
                    {grade.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {grade.trend === "stable" && <Minus className="w-4 h-4 text-[#94A3B8]" />}
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
