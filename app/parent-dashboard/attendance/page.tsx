"use client"

import { useState, useMemo } from "react"
import { m } from "framer-motion"
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"

const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const weekdaysAr = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]

const statusConfig: Record<string, { labelEn: string; labelAr: string; color: string; bgColor: string }> = {
  present: { labelEn: "Present", labelAr: "حاضر", color: "text-[#059669]", bgColor: "bg-[#059669]" },
  absent: { labelEn: "Absent", labelAr: "غائب", color: "text-red-500", bgColor: "bg-red-500" },
  late: { labelEn: "Late", labelAr: "متأخر", color: "text-[#F59E0B]", bgColor: "bg-[#F59E0B]" },
}

export default function ParentAttendancePage() {
  const { locale, dir } = useI18n()
  const [selectedChild, setSelectedChild] = useState(0)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const isRTL = dir === "rtl"

  const { data: childrenData } = useApi(() => api.getParentChildren())
  const children = (childrenData && Array.isArray(childrenData) && childrenData.length > 0)
    ? childrenData.map((c: { id: string; name?: unknown }) => {
        const n = typeof c.name === "string" ? c.name : (c.name && typeof c.name === "object" && "name" in c.name ? String((c.name as { name: string }).name) : "Child")
        return { id: c.id, nameEn: n || "Child", nameAr: n || "طفل" }
      })
    : []

  const childId = children.length > 0 ? children[Math.min(selectedChild, children.length - 1)]?.id ?? children[0]?.id : null
  const { data: attendanceData } = useApi(
    () => (childId ? api.getChildAttendance(childId, month) : Promise.resolve({ success: false })),
    { deps: [childId, month], immediate: !!childId }
  )

  const attendanceMap = useMemo(() => {
    const map: Record<number, "present" | "absent" | "late"> = {}
    if (attendanceData && typeof attendanceData === "object") {
      const d = attendanceData as { data?: Array<{ date?: string; status?: string }> }
      ;(d.data || []).forEach((r) => {
        const day = r.date ? new Date(r.date).getDate() : 0
        if (day) map[day] = (r.status === "present" ? "present" : r.status === "late" ? "late" : "absent") as "present" | "absent" | "late"
      })
    }
    return map
  }, [attendanceData])

  const monthDate = new Date(month + "-01")
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const totalDays = daysInMonth
  const presentDays = Object.values(attendanceMap).filter((s) => s === "present").length
  const absentDays = Object.values(attendanceMap).filter((s) => s === "absent").length
  const lateDays = Object.values(attendanceMap).filter((s) => s === "late").length
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  const firstDayOfMonth = monthDate.getDay()
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  const weekdays = locale === "ar" ? weekdaysAr : weekdaysEn

  const monthLabel = monthDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" })

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الحضور" : "Attendance"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "متابعة حضور وغياب أبنائك" : "Track your children's attendance"}</p>
        </m.div>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 text-center">
          <Calendar className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">{locale === "ar" ? "لم تربط أي أبناء بعد. اربط أبناءك من صفحة أبنائي لعرض الحضور." : "No children linked yet. Link your children from the Children page to view attendance."}</p>
        </m.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الحضور" : "Attendance"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "متابعة حضور وغياب أبنائك" : "Track your children's attendance"}</p>
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

      <div className="grid sm:grid-cols-4 gap-4">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm text-center"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EC4899]/10 mb-2">
            <Calendar className="w-5 h-5 text-[#EC4899]" />
          </div>
          <p className="text-2xl font-bold text-[#EC4899]">{attendanceRate}%</p>
          <p className="text-xs text-[#64748B]">{locale === "ar" ? "نسبة الحضور" : "Attendance Rate"}</p>
        </m.div>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm text-center"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#059669]/10 mb-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
          </div>
          <p className="text-2xl font-bold text-[#059669]">{presentDays}</p>
          <p className="text-xs text-[#64748B]">{locale === "ar" ? "أيام الحضور" : "Present Days"}</p>
        </m.div>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm text-center"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{absentDays}</p>
          <p className="text-xs text-[#64748B]">{locale === "ar" ? "أيام الغياب" : "Absent Days"}</p>
        </m.div>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm text-center"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/10 mb-2">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#F59E0B]">{lateDays}</p>
          <p className="text-xs text-[#64748B]">{locale === "ar" ? "أيام التأخر" : "Late Days"}</p>
        </m.div>
      </div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#0F172A]">{monthLabel}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const d = new Date(month + "-01")
                d.setMonth(d.getMonth() - 1)
                setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
              }}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              {isRTL ? <ChevronRight className="w-4 h-4 text-[#64748B]" /> : <ChevronLeft className="w-4 h-4 text-[#64748B]" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date(month + "-01")
                d.setMonth(d.getMonth() + 1)
                setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
              }}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              {isRTL ? <ChevronLeft className="w-4 h-4 text-[#64748B]" /> : <ChevronRight className="w-4 h-4 text-[#64748B]" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekdays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-[#64748B] py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} />
            const status = attendanceMap[day]
            const today = new Date()
            const isToday = day === today.getDate() && monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear()
            const config = status ? statusConfig[status] : null
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.01 * i }}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                  isToday ? "ring-2 ring-[#EC4899]" : ""
                } ${
                  config
                    ? `${config.bgColor}/10 hover:${config.bgColor}/20`
                    : day > 9 ? "bg-[#F8FAFC]" : "bg-[#F8FAFC]"
                }`}
              >
                <span className={`font-semibold ${config ? config.color : "text-[#94A3B8]"}`}>{day}</span>
                {config && (
                  <div className={`mt-0.5 h-1.5 w-1.5 rounded-full ${config.bgColor}`} />
                )}
              </m.div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#E2E8F0]/60">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${config.bgColor}`} />
              <span className="text-xs text-[#64748B]">{locale === "ar" ? config.labelAr : config.labelEn}</span>
            </div>
          ))}
        </div>
      </m.div>
    </div>
  )
}
