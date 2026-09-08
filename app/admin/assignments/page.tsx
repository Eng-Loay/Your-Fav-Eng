"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { FileText, BookOpen, GraduationCap, Calendar, Award } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"

export default function AdminAssignmentsPage() {
  const { locale } = useI18n()
  const [typeFilter, setTypeFilter] = useState("all")
  const { data: res, loading } = useApi(() => api.getAdminAssignments({ type: typeFilter !== "all" ? typeFilter : undefined }))

  const paginated = res as { data?: any[]; pagination?: { total?: number } } | undefined
  const list = Array.isArray(res) ? res : (paginated?.data ?? [])
  const total = paginated?.pagination?.total ?? list.length

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الواجبات" : "Assignments"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "عرض جميع الواجبات في النظام" : "View all assignments in the system"}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm"
          >
            <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
            <option value="teacher">{locale === "ar" ? "صفوف" : "Classes"}</option>
            <option value="instructor">{locale === "ar" ? "دورات" : "Courses"}</option>
          </select>
        </div>
      </m.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : list.length === 0 ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-12 text-center">
          <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">{locale === "ar" ? "لا توجد واجبات بعد" : "No assignments yet"}</p>
        </m.div>
      ) : (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          {list.map((a: any, i: number) => (
            <m.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.type === "instructor" ? "bg-[#8B5CF6]/10" : "bg-[#059669]/10"}`}>
                  {a.type === "instructor" ? <BookOpen className="w-6 h-6 text-[#8B5CF6]" /> : <GraduationCap className="w-6 h-6 text-[#059669]" />}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{locale === "ar" && a.titleAr ? a.titleAr : a.title}</h3>
                  <p className="text-sm text-[#64748B] mt-0.5">{locale === "ar" && a.contextAr ? a.contextAr : a.context}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US") : "—"}
                    </span>
                    <span>{a.creator}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#F1F5F9]">{a.type === "instructor" ? (locale === "ar" ? "دورة" : "Course") : (locale === "ar" ? "صف" : "Class")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-sm">
                  <Award className="w-4 h-4 text-[#F59E0B]" />
                  <span>{a.submissionsCount} {locale === "ar" ? "تسليم" : "submissions"}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#059669]/10 text-[#059669]">{a.status}</span>
              </div>
            </m.div>
          ))}
        </m.div>
      )}
    </div>
  )
}
