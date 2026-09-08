"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ChevronLeft,
  DollarSign,
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  Award,
  PlayCircle,
  FileText,
  Edit,
  Layers,
  Eye,
  Clock,
  Star,
  Download,
  Search,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useApi, api } from "@/hooks/use-api"
import CourseImage from "@/components/admin/courses/course-image"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

export default function CourseAnalyticsPage() {
  const params = useParams()
  const courseId = params.id as string
  const [studentSearch, setStudentSearch] = useState("")

  const { data: analyticsRes, loading } = useApi(() => api.getCourseAnalytics(courseId))

  const analytics = analyticsRes as {
    course?: { id: string; title: string; titleAr?: string; thumbnail?: string; category?: string; instructor?: string; hours?: number }
    stats?: { revenue: number; students: number; completionRate: number; lessonsCount: number; quizzesCount: number; rating: number; reviewsCount: number }
    monthlyData?: { month: string; monthAr: string; revenue: number; students: number }[]
    students?: { id: string; name: string; email: string; progress: number; date: string }[]
  } | null

  const course = analytics?.course
  const stats = analytics?.stats ?? {
    revenue: 0,
    students: 0,
    completionRate: 0,
    lessonsCount: 0,
    quizzesCount: 0,
    rating: 0,
    reviewsCount: 0,
  }
  const monthlyData = analytics?.monthlyData ?? []
  const studentsList = analytics?.students ?? []

  const filteredStudents = studentsList.filter(
    (s) =>
      s.name.includes(studentSearch) || s.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const maxRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.revenue), 1) : 1

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-slate-400">جاري تحميل البيانات...</p>
      </div>
    )
  }

  if (!analytics?.course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <p className="text-sm text-slate-500">الدورة غير موجودة</p>
        <Link href="/admin/courses" className="text-primary hover:underline">
          العودة للدورات
        </Link>
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <m.div variants={fadeUp}>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          العودة للدورات
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100">
            <CourseImage src={course?.thumbnail} alt={course?.titleAr || course?.title || ""} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 line-clamp-1">
              {course?.titleAr || course?.title || "تحليلات الدورة"}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {course?.category && (
                <Badge variant="secondary" className="text-xs">
                  {course.category}
                </Badge>
              )}
              {stats.rating > 0 && (
                <span className="flex items-center gap-1 text-sm text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" /> {stats.rating}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {course?.instructor ?? ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/courses/${courseId}/edit`}>
              <Button variant="outline" className="gap-2 rounded-xl h-10">
                <Edit className="w-4 h-4" /> تعديل
              </Button>
            </Link>
            <Link href={`/admin/courses/${courseId}/content`}>
              <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-10">
                <Layers className="w-4 h-4" /> المحتوى
              </Button>
            </Link>
          </div>
        </div>
      </m.div>

      {/* Stats Cards */}
      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "إجمالي الإيرادات",
            value: `$${stats.revenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "الطلاب المسجلين",
            value: stats.students.toLocaleString(),
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "معدل الإتمام",
            value: `${stats.completionRate}%`,
            icon: Award,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "عدد الدروس",
            value: stats.lessonsCount,
            icon: PlayCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <m.div
            key={i}
            variants={fadeUp}
            className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </m.div>
        ))}
      </m.div>

      {/* Charts Section */}
      <m.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              الإيرادات الشهرية
            </h3>
          </div>
          <div className="space-y-3">
            {monthlyData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-14 shrink-0">{item.monthAr || item.month}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="h-full bg-gradient-to-l from-primary to-primary/80 rounded-full flex items-center justify-end px-2"
                  >
                    <span className="text-[10px] font-bold text-white">${item.revenue}</span>
                  </m.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              التسجيلات الشهرية
            </h3>
          </div>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((item, idx) => {
              const maxStudents = Math.max(...monthlyData.map((d) => d.students))
              const heightPct = (item.students / maxStudents) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-600">{item.students}</span>
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg min-h-[8px]"
                  />
                  <span className="text-[10px] text-slate-400">{(item.monthAr || item.month).slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </m.div>

      {/* Quick Stats Row */}
      <m.div variants={fadeUp} className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm text-center">
          <FileText className="w-5 h-5 text-slate-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-slate-900">{stats.quizzesCount}</p>
          <p className="text-xs text-slate-400">اختبار</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm text-center">
          <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-slate-900">{stats.reviewsCount}</p>
          <p className="text-xs text-slate-400">تقييم</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm text-center">
          <Clock className="w-5 h-5 text-slate-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-slate-900">{course?.hours ?? "—"}</p>
          <p className="text-xs text-slate-400">ساعة</p>
        </div>
      </m.div>

      {/* Students Table */}
      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            الطلاب المسجلين
            <Badge variant="secondary" className="text-[10px]">
              {stats.students}
            </Badge>
          </h3>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 max-w-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="بحث عن طالب..."
              className="bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="text-start px-5 py-3 font-semibold">الطالب</th>
                <th className="text-start px-3 py-3 font-semibold">البريد</th>
                <th className="text-start px-3 py-3 font-semibold">التقدم</th>
                <th className="text-start px-3 py-3 font-semibold">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500" dir="ltr">
                    {student.email}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Progress
                        value={student.progress}
                        className="h-2 flex-1"
                      />
                      <span
                        className={`text-xs font-bold ${
                          student.progress === 100
                            ? "text-emerald-600"
                            : student.progress >= 50
                              ? "text-primary"
                              : "text-slate-500"
                        }`}
                      >
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500" dir="ltr">
                    {student.date}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-sm text-slate-400">
                    لا يوجد طلاب مسجلين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </m.div>
    </m.div>
  )
}
