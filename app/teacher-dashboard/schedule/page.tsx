"use client"

import { m } from "framer-motion"
import { Calendar, Clock, MapPin } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Badge } from "@/components/ui/badge"

const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
const daysAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]

const scheduleDataFallback: Record<string, { time: string; endTime: string; classEn: string; classAr: string; room: string; color: string }[]> = {
  Sunday: [
    { time: "08:00", endTime: "09:30", classEn: "Math - Grade 10A", classAr: "رياضيات - العاشر أ", room: "201", color: "bg-[#059669]" },
    { time: "12:00", endTime: "13:30", classEn: "Calculus - Grade 12", classAr: "تفاضل - الثاني عشر", room: "102", color: "bg-[#8B5CF6]" },
  ],
  Monday: [
    { time: "10:00", endTime: "11:30", classEn: "Math - Grade 11B", classAr: "رياضيات - الحادي عشر ب", room: "305", color: "bg-primary" },
    { time: "14:00", endTime: "15:00", classEn: "Statistics - Grade 11A", classAr: "إحصاء - الحادي عشر أ", room: "204", color: "bg-[#F59E0B]" },
  ],
  Tuesday: [
    { time: "08:00", endTime: "09:30", classEn: "Math - Grade 10A", classAr: "رياضيات - العاشر أ", room: "201", color: "bg-[#059669]" },
    { time: "12:00", endTime: "13:30", classEn: "Calculus - Grade 12", classAr: "تفاضل - الثاني عشر", room: "102", color: "bg-[#8B5CF6]" },
  ],
  Wednesday: [
    { time: "10:00", endTime: "11:30", classEn: "Math - Grade 11B", classAr: "رياضيات - الحادي عشر ب", room: "305", color: "bg-primary" },
    { time: "14:00", endTime: "15:00", classEn: "Statistics - Grade 11A", classAr: "إحصاء - الحادي عشر أ", room: "204", color: "bg-[#F59E0B]" },
  ],
  Thursday: [
    { time: "08:00", endTime: "09:30", classEn: "Math - Grade 10A", classAr: "رياضيات - العاشر أ", room: "201", color: "bg-[#059669]" },
    { time: "14:00", endTime: "15:00", classEn: "Statistics - Grade 11A", classAr: "إحصاء - الحادي عشر أ", room: "204", color: "bg-[#F59E0B]" },
  ],
}

const todayIndex = new Date().getDay()
const colors = ["bg-[#059669]", "bg-[#8B5CF6]", "bg-primary", "bg-[#F59E0B]"]

export default function TeacherSchedulePage() {
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"
  const days = locale === "ar" ? daysAr : daysEn

  const { data: scheduleRes } = useApi(() => api.getTeacherSchedule())

  const scheduleData = (() => {
    const arr = scheduleRes as { day?: string; time?: string; endTime?: string; classEn?: string; classAr?: string; room?: string }[] | undefined
    if (!Array.isArray(arr) || arr.length === 0) return scheduleDataFallback
    const out: Record<string, { time: string; endTime: string; classEn: string; classAr: string; room: string; color: string }[]> = {}
    for (const item of arr) {
      const day = item.day ?? "Sunday"
      if (!out[day]) out[day] = []
      out[day].push({
        time: item.time ?? "",
        endTime: item.endTime ?? "",
        classEn: item.classEn ?? "",
        classAr: item.classAr ?? "",
        room: item.room ?? "",
        color: colors[out[day].length % colors.length],
      })
    }
    return Object.keys(out).length > 0 ? out : scheduleDataFallback
  })()

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الجدول الأسبوعي" : "Weekly Schedule"}</h2>
        <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "عرض جدولك الأسبوعي" : "View your weekly class schedule"}</p>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-6 border-b border-[#E2E8F0]/60">
              <div className="p-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {locale === "ar" ? "الوقت" : "Time"}
              </div>
              {daysEn.map((day, i) => {
                const isToday = i === (todayIndex === 0 ? 0 : todayIndex === 6 ? 4 : todayIndex - 1)
                return (
                  <div
                    key={day}
                    className={`p-4 text-center text-xs font-semibold uppercase tracking-wider ${
                      isToday ? "bg-[#059669]/5 text-[#059669]" : "text-[#64748B]"
                    }`}
                  >
                    {days[i]}
                    {isToday && (
                      <Badge variant="secondary" className="ms-2 text-[8px] bg-[#059669]/10 text-[#059669] border-0">
                        {locale === "ar" ? "اليوم" : "Today"}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {timeSlots.map((slot) => (
              <div key={slot} className="grid grid-cols-6 border-b border-[#E2E8F0]/30 min-h-[72px]">
                <div className="p-3 flex items-start">
                  <span className="text-xs font-mono text-[#94A3B8]">{slot}</span>
                </div>
                {daysEn.map((day, dayIdx) => {
                  const classItem = scheduleData[day]?.find((c) => c.time === slot || c.time?.startsWith(slot))
                  const isToday = dayIdx === (todayIndex === 0 ? 0 : todayIndex === 6 ? 4 : todayIndex - 1)
                  return (
                    <div key={day} className={`p-2 ${isToday ? "bg-[#059669]/[0.02]" : ""}`}>
                      {classItem && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`${classItem.color} rounded-xl p-2.5 text-white h-full`}
                        >
                          <p className="text-xs font-bold leading-tight">{locale === "ar" ? classItem.classAr : classItem.classEn}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-2.5 h-2.5 opacity-80" />
                            <span className="text-[10px] opacity-80">{classItem.time} - {classItem.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 opacity-80" />
                            <span className="text-[10px] opacity-80">{locale === "ar" ? "قاعة" : "Room"} {classItem.room}</span>
                          </div>
                        </m.div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </m.div>
    </div>
  )
}
