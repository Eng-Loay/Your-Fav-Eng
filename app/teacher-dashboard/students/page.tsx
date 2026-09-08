"use client"

import { useMemo, useState } from "react"
import { m } from "framer-motion"
import Image from "next/image"
import { Search, Download, Mail } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { safeStr, resolveImageUrl } from "@/lib/utils"

function formatRelativeTime(date: Date | string, locale: string) {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return locale === "ar" ? "منذ دقائق" : "Just now"
  if (diffHours < 24) return locale === "ar" ? `منذ ${diffHours} ساعات` : `${diffHours}h ago`
  if (diffDays < 7) return locale === "ar" ? `منذ ${diffDays} أيام` : `${diffDays}d ago`
  return locale === "ar" ? "منذ أسبوع" : "1 week ago"
}

export default function TeacherStudentsPage() {
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "completed">("all")

  const { data: studentsRes, loading: studentsLoading } = useApi(() => api.getTeacherStudents())

  const studentsDisplay = useMemo(() => {
    const raw = Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.data
    const arr: any[] = Array.isArray(raw) ? raw : []
    return arr.map((s: any, i: number) => {
      const user = s.user ?? s.student ?? s.profile ?? {}
      const progress = typeof s.progress === "number" ? Math.round(s.progress) : (s.completedAt ? 100 : 0)
      const status: "active" | "inactive" | "completed" =
        s.completedAt || progress >= 100 ? "completed" : progress > 0 ? "active" : "inactive"
      const lastDate = s.updatedAt ?? s.lastActiveAt ?? s.createdAt ?? s.enrolledAt
      return {
        id: s.id ?? user.id ?? i + 1,
        avatar: resolveImageUrl(user.avatar, "/user-avatar.png"),
        nameEn: safeStr(user.name) || safeStr(s.studentName) || "Student",
        nameAr: safeStr(user.nameAr) || safeStr(s.studentNameAr) || "طالب",
        email: user.email ?? s.email ?? "",
        courseEn: safeStr(s.courseTitle) || safeStr(s.className) || safeStr(s.course?.title) || "—",
        courseAr: safeStr(s.courseTitleAr) || safeStr(s.classNameAr) || safeStr(s.course?.titleAr) || "—",
        progress,
        lastActiveEn: lastDate ? formatRelativeTime(lastDate, "en") : "—",
        lastActiveAr: lastDate ? formatRelativeTime(lastDate, "ar") : "—",
        status,
      }
    })
  }, [studentsRes])

  const filtered = studentsDisplay.filter((s) => {
    const matchesSearch =
      (locale === "ar" ? s.nameAr : s.nameEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
  }

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "الطلاب" : "Students"}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar" ? `${studentsDisplay.length} طلاب` : `${studentsDisplay.length} students`}
          </p>
        </div>
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            const res = await api.getTeacherStudents()
            const raw = Array.isArray(res.data) ? res.data : (res.data as any)?.data
            const arr: any[] = Array.isArray(raw) ? raw : []
            const csv = [
              ["Name", "Email"].join(","),
              ...arr.map((e: any) => [e?.name ?? e?.user?.name ?? "", e?.email ?? e?.user?.email ?? ""].join(",")),
            ].join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="flex items-center gap-2 rounded-xl bg-white text-[#0F172A] px-5 py-3 text-sm font-bold border border-[#E2E8F0]/60 shadow-sm hover:shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          {locale === "ar" ? "تصدير البيانات" : "Export Data"}
        </m.button>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { labelEn: "Total Students", labelAr: "إجمالي الطلاب", value: studentsDisplay.length },
          { labelEn: "Active", labelAr: "نشط", value: studentsDisplay.filter(s => s.status === "active").length },
          { labelEn: "Completed", labelAr: "مكتمل", value: studentsDisplay.filter(s => s.status === "completed").length },
          { labelEn: "Avg. Progress", labelAr: "متوسط التقدم", value: `${studentsDisplay.length ? Math.round(studentsDisplay.reduce((a, b) => a + b.progress, 0) / studentsDisplay.length) : 0}%` },
        ].map((stat, i) => (
          <m.div
            key={stat.labelEn}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-extrabold text-[#0F172A]">{stat.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{locale === "ar" ? stat.labelAr : stat.labelEn}</p>
          </m.div>
        ))}
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-[#E2E8F0]/60 flex-1">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder={locale === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none flex-1"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20"
                  : "bg-white text-[#64748B] border border-[#E2E8F0]/60 hover:border-[#8B5CF6]/20"
              }`}
            >
              {status === "all" ? (locale === "ar" ? "الكل" : "All")
                : status === "active" ? (locale === "ar" ? "نشط" : "Active")
                : status === "inactive" ? (locale === "ar" ? "غير نشط" : "Inactive")
                : (locale === "ar" ? "مكتمل" : "Completed")}
            </button>
          ))}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/60">
                <th className="text-start px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {locale === "ar" ? "الطالب" : "Student"}
                </th>
                <th className="text-start px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">
                  {locale === "ar" ? "الدورة / الصف" : "Course / Class"}
                </th>
                <th className="text-start px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">
                  {locale === "ar" ? "التقدم" : "Progress"}
                </th>
                <th className="text-start px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">
                  {locale === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="text-start px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">
                  {locale === "ar" ? "آخر نشاط" : "Last Active"}
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    {locale === "ar" ? "لا يوجد طلاب" : "No students yet"}
                  </td>
                </tr>
              ) : filtered.map((student, i) => (
                <m.tr
                  key={student.id}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="border-b border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl shrink-0">
                        <Image src={student.avatar} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">
                          {locale === "ar" ? student.nameAr : student.nameEn}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#64748B] font-medium">
                      {locale === "ar" ? student.courseAr : student.courseEn}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className="h-2 flex-1 rounded-full bg-[#F1F5F9] overflow-hidden">
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: `${student.progress}%` }}
                          transition={{ delay: 0.4 + i * 0.05, duration: 0.8 }}
                          className={`h-full rounded-full ${
                            student.progress >= 80 ? "bg-emerald-500" : student.progress >= 50 ? "bg-[#8B5CF6]" : "bg-amber-500"
                          }`}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0F172A] w-8">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold ${statusColors[student.status]}`}>
                      {student.status === "active" ? (locale === "ar" ? "نشط" : "Active")
                        : student.status === "inactive" ? (locale === "ar" ? "غير نشط" : "Inactive")
                        : (locale === "ar" ? "مكتمل" : "Completed")}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs text-[#94A3B8]">
                      {locale === "ar" ? student.lastActiveAr : student.lastActiveEn}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors">
                      <Mail className="w-4 h-4 text-[#94A3B8]" />
                    </button>
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
