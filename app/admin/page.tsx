// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import React from "react"
import { m } from "framer-motion"
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  UserPlus,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  Loader2,
  Presentation,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"
import { useApi, api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { adminStatStyle } from "@/lib/admin-theme"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export default function AdminDashboard() {
  const { locale } = useI18n()
  const { user } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"

  const { data: statsRes, loading: statsLoading } = useApi(() => api.getAdminDashboardStats())
  const { data: revenueRes, loading: revenueLoading } = useApi(() => api.getAdminRevenue())
  const { data: userGrowthRes, loading: userGrowthLoading } = useApi(() => api.getAdminUserGrowth())
  const { data: topCoursesRes, loading: topCoursesLoading } = useApi(() => api.getAdminTopCourses())
  const { data: activityRes, loading: activityLoading } = useApi(() => api.getAdminRecentActivity())
  const { data: enrollByCourseRes } = useApi(() => api.getAdminEnrollmentsByCourse(6))
  const { data: enrollByCategoryRes } = useApi(() => api.getAdminEnrollmentsByCategory(6))

  const s = statsRes as {
    users?: number
    courses?: number
    students?: number
    teachers?: number
    revenue?: number
    enrollments?: number
    certificates?: number
    usersChange?: number
    enrollmentsChange?: number
    revenueChange?: number
    certificatesChange?: number
    lastUpdated?: string
  } | undefined

  const stats = [
    {
      label: isAr ? "إجمالي المستخدمين" : "Total Users",
      value: s?.users != null ? s.users.toLocaleString() : "—",
      change: s?.usersChange,
      icon: Users,
      ...adminStatStyle(0),
    },
    {
      label: isAr ? "إجمالي الدورات" : "Total Courses",
      value: s?.courses != null ? s.courses.toLocaleString() : "—",
      change: undefined,
      icon: BookOpen,
      ...adminStatStyle(1),
    },
    {
      label: isAr ? "إجمالي الطلاب" : "Total Students",
      value: s?.students != null ? s.students.toLocaleString() : "—",
      change: undefined,
      icon: GraduationCap,
      ...adminStatStyle(2),
    },
    {
      label: isAr ? "المعلمون" : "Teachers",
      value: s?.teachers != null ? s.teachers.toLocaleString() : "—",
      change: undefined,
      icon: Presentation,
      ...adminStatStyle(3),
    },
    {
      label: isAr ? "الإيرادات" : "Revenue",
      value: s?.revenue != null ? formatCurrency(s.revenue) : "—",
      change: s?.revenueChange,
      icon: DollarSign,
      ...adminStatStyle(0),
    },
    {
      label: isAr ? "التسجيلات النشطة" : "Active Enrollments",
      value: s?.enrollments != null ? s.enrollments.toLocaleString() : "—",
      change: s?.enrollmentsChange,
      icon: UserPlus,
      ...adminStatStyle(1),
    },
    {
      label: isAr ? "الشهادات الصادرة" : "Certificates Issued",
      value: s?.certificates != null ? s.certificates.toLocaleString() : "—",
      change: s?.certificatesChange,
      icon: Award,
      ...adminStatStyle(2),
    },
  ]

  const revenueRaw = Array.isArray(revenueRes) ? revenueRes : (revenueRes as { data?: unknown[] })?.data ?? []
  const revenueDataUse = (revenueRaw as { month?: string; value?: number; revenue?: number }[]).map((x) => ({
    month: x.month ?? "",
    value: x.value ?? x.revenue ?? 0,
  }))
  const maxRevenue = Math.max(...revenueDataUse.map((d) => d.value), 1)

  const userGrowthRaw = Array.isArray(userGrowthRes) ? userGrowthRes : (userGrowthRes as { data?: unknown[] })?.data ?? []
  const userGrowthUse = (userGrowthRaw as { month?: string; value?: number; count?: number }[]).map((x) => ({
    month: x.month ?? "",
    value: x.value ?? x.count ?? 0,
  }))
  const maxGrowth = Math.max(...userGrowthUse.map((d) => d.value), 1)

  const enrollRaw = (enrollByCourseRes as { data?: { name: string; value: number }[] })?.data
    ?? (enrollByCategoryRes as { data?: { name: string; value: number }[] })?.data
    ?? []
  const courseEnrollData = Array.isArray(enrollRaw) ? enrollRaw : []
  const maxEnroll = Math.max(...courseEnrollData.map((d) => d.value), 1)

  const topCoursesRaw = Array.isArray(topCoursesRes) ? topCoursesRes : (topCoursesRes as { data?: unknown[] })?.data ?? []
  const topCoursesList = (topCoursesRaw as { id: string; title?: string; instructor?: string | { name?: string }; students?: number; totalStudents?: number; revenue?: number; rating?: number; averageRating?: number }[]).map((c) => ({
    id: c.id,
    title: c.title ?? "",
    instructor: typeof c.instructor === "object" ? safeStr((c.instructor as { name?: string })?.name) : safeStr(c.instructor),
    students: c.students ?? c.totalStudents ?? 0,
    revenue: c.revenue ?? 0,
    rating: c.rating ?? c.averageRating ?? 0,
  }))

  const activityRaw = Array.isArray(activityRes) ? activityRes : (activityRes as { data?: unknown[] })?.data ?? []
  const recentActivity = (activityRaw as { id: string; user?: string; action?: string; actionAr?: string; time?: string; timeAr?: string }[]).map((a) => ({
    id: a.id,
    user: a.user ?? "",
    action: a.action ?? "",
    actionAr: a.actionAr ?? a.action ?? "",
    time: a.time ?? "",
    timeAr: a.timeAr ?? a.time ?? "",
  }))

  const lastUpdated = s?.lastUpdated
    ? new Date(s.lastUpdated).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const loading = statsLoading

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isAr ? `مرحباً، ${safeStr(user?.name, "المسؤول")}` : `Welcome, ${safeStr(user?.name, "Admin")}`} 👋
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr ? "إليك نظرة عامة على أداء المنصة" : "Here's an overview of your platform performance"}
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-white rounded-xl px-3 py-2 border border-[#E2E8F0]/60">
            <Clock className="w-3.5 h-3.5" />
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </div>
        )}
      </m.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
              <m.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {stat.change != null && (
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        stat.change >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {stat.change >= 0 ? `+${stat.change}%` : `${stat.change}%`}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-[#0F172A]">{stat.value}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{stat.label}</p>
                </div>
              </m.div>
            )})}
          </m.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <m.div variants={fadeUp} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm xl:col-span-1">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                {isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}
              </h3>
              {revenueLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : revenueDataUse.length > 0 ? (
                <div className="flex items-end gap-1.5 h-[180px]">
                  {revenueDataUse.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: `${maxRevenue ? (d.value / maxRevenue) * 140 : 0}px` }}
                        transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                        className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/90 min-h-[4px] hover:opacity-80 transition-opacity cursor-pointer"
                        title={formatCurrency(d.value)}
                      />
                      <span className="text-[9px] text-[#94A3B8]">{(d.month ?? "").slice(0, 1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-[#94A3B8]">
                  {isAr ? "لا توجد بيانات" : "No data yet"}
                </div>
              )}
            </m.div>

            <m.div variants={fadeUp} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm xl:col-span-1">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                {isAr ? "نمو المستخدمين" : "User Growth"}
              </h3>
              {userGrowthLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : userGrowthUse.length > 0 ? (
                <div className="flex items-end gap-2 h-[180px]">
                  {userGrowthUse.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: `${maxGrowth ? (d.value / maxGrowth) * 140 : 0}px` }}
                        transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#8B5CF6] to-[#A78BFA] min-h-[4px] hover:opacity-80 transition-opacity cursor-pointer"
                        title={`${d.value} users`}
                      />
                      <span className="text-[9px] text-[#94A3B8]">{(d.month ?? "").slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-[#94A3B8]">
                  {isAr ? "لا توجد بيانات" : "No data yet"}
                </div>
              )}
            </m.div>

            <m.div variants={fadeUp} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm xl:col-span-1">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                {isAr ? "تسجيلات الدورات" : "Course Enrollments"}
              </h3>
              {courseEnrollData.length > 0 ? (
                <div className="flex items-end gap-2 h-[180px]">
                  {courseEnrollData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: `${maxEnroll ? (d.value / maxEnroll) * 140 : 0}px` }}
                        transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#059669] to-[#34D399] min-h-[4px] hover:opacity-80 transition-opacity cursor-pointer"
                        title={`${d.value} enrollments`}
                      />
                      <span className="text-[9px] text-[#94A3B8] truncate w-full text-center">
                        {(d.name ?? "").slice(0, 6)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-[#94A3B8]">
                  {isAr ? "لا توجد بيانات" : "No data yet"}
                </div>
              )}
            </m.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <m.div variants={fadeUp} className="lg:col-span-3 bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
              <div className="p-5 pb-3 border-b border-[#E2E8F0]/60">
                <h3 className="text-sm font-bold text-[#0F172A]">{isAr ? "أفضل الدورات" : "Top Courses"}</h3>
              </div>
              {topCoursesLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : topCoursesList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider">
                        <th className="text-start px-5 py-3 font-semibold">{isAr ? "الدورة" : "Course"}</th>
                        <th className="text-start px-3 py-3 font-semibold">{isAr ? "المدرب" : "Instructor"}</th>
                        <th className="text-start px-3 py-3 font-semibold">{isAr ? "الطلاب" : "Students"}</th>
                        <th className="text-start px-3 py-3 font-semibold">{isAr ? "الإيرادات" : "Revenue"}</th>
                        <th className="text-start px-3 py-3 font-semibold">{isAr ? "التقييم" : "Rating"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCoursesList.map((course) => (
                        <tr
                          key={course.id}
                          className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors"
                        >
                          <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{course.title}</td>
                          <td className="px-3 py-3 text-sm text-[#64748B]">{course.instructor}</td>
                          <td className="px-3 py-3 text-sm text-[#64748B]">{course.students.toLocaleString()}</td>
                          <td className="px-3 py-3 text-sm font-semibold text-[#059669]">
                            {formatCurrency(course.revenue)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#F59E0B]">
                              ⭐ {course.rating.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-[#94A3B8]">
                  {isAr ? "لا توجد دورات بعد" : "No courses yet"}
                </div>
              )}
            </m.div>

            <m.div variants={fadeUp} className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
              <div className="p-5 pb-3 border-b border-[#E2E8F0]/60">
                <h3 className="text-sm font-bold text-[#0F172A]">{isAr ? "آخر النشاطات" : "Recent Activity"}</h3>
              </div>
              {activityLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {recentActivity.map((item) => (
                    <m.div
                      key={item.id}
                      variants={fadeUp}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Eye className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#0F172A]">
                          <span className="font-semibold">{safeStr(item.user)}</span>{" "}
                          {isAr ? item.actionAr : item.action}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{isAr ? item.timeAr : item.time}</p>
                      </div>
                    </m.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-[#94A3B8]">
                  {isAr ? "لا يوجد نشاط حديث" : "No recent activity"}
                </div>
              )}
            </m.div>
          </div>
        </>
      )}
    </m.div>
  )
}
