"use client"

import { useState, useMemo } from "react"
import { m, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Clock, BookOpen, Star, Play, Search, ArrowRight, ArrowLeft, Trophy } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

type TabFilter = "all" | "inProgress" | "completed"

export default function MyCoursesPage() {
  const { locale, dir, t } = useI18n()
  const { purchasedCourses } = useStore()
  const isRTL = dir === "rtl"
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { data: apiCourses } = useApi<any[]>(() => api.getEnrolledCourses())

  const toStringOrName = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
      return String((val as { name: string }).name)
    return ""
  }

  const myCourses = useMemo(() => {
    if (!apiCourses || !Array.isArray(apiCourses)) return []
    return apiCourses.map((enrollment: Record<string, unknown>) => {
      const c = enrollment.course as Record<string, unknown> | undefined
      const instructor = c?.instructor
      const instructorName = toStringOrName(instructor) || toStringOrName(c?.instructorAr) || toStringOrName(c?.instructorEn) || ""
      const progress = Number(enrollment.progress ?? 0)
      return {
        id: (c?.id ?? enrollment.courseId) as string,
        thumbnail: (c?.thumbnail as string) ?? "/course-1.png",
        titleAr: (c?.titleAr as string) ?? (c?.title as string) ?? "",
        titleEn: (c?.titleEn as string) ?? (c?.title as string) ?? "",
        instructorAr: instructorName,
        instructorEn: instructorName,
        progress,
        completedLessons: Math.round((progress / 100) * 50),
        lessons: 50,
        hours: Number(c?.duration ?? 20),
        rating: Number(c?.averageRating ?? 4.5),
      }
    })
  }, [apiCourses])

  const filteredCourses = useMemo(() => {
    let result = myCourses
    if (activeTab === "inProgress") result = result.filter((c) => c.progress < 100)
    if (activeTab === "completed") result = result.filter((c) => c.progress >= 100)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.titleAr.includes(q) ||
          c.titleEn.toLowerCase().includes(q) ||
          c.instructorAr.includes(q) ||
          c.instructorEn.toLowerCase().includes(q)
      )
    }
    return result
  }, [myCourses, activeTab, searchQuery])

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: locale === "ar" ? "الكل" : "All", count: myCourses.length },
    { key: "inProgress", label: locale === "ar" ? "قيد التعلم" : "In Progress", count: myCourses.filter((c) => c.progress < 100).length },
    { key: "completed", label: locale === "ar" ? "مكتملة" : "Completed", count: myCourses.filter((c) => c.progress >= 100).length },
  ]

  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "دوراتي" : "My Courses"}
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar"
              ? `${myCourses.length} دورات مسجلة`
              : `${myCourses.length} courses enrolled`}
          </p>
        </div>
        <Link href="/courses">
          <Button className="rounded-xl bg-primary text-white gap-2 shadow-lg shadow-primary/25 hover:bg-primary-hover">
            {locale === "ar" ? "تصفح المزيد" : "Browse More"}
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </Link>
      </m.div>

      {/* Tabs + Search */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-1 rounded-2xl border border-[#E2E8F0]/60 bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {tab.label}
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "ar" ? "ابحث في دوراتك..." : "Search courses..."}
            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white ps-10 pe-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </m.div>

      {/* Course grid */}
      <AnimatePresence mode="wait">
        {filteredCourses.length === 0 ? (
          <m.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-20"
          >
            <BookOpen className="h-12 w-12 text-[#E2E8F0] mb-4" />
            <p className="text-sm font-medium text-[#94A3B8]">
              {searchQuery
                ? (locale === "ar" ? "لا توجد نتائج" : "No results found")
                : (locale === "ar" ? "لم تسجل في أي دورة بعد" : "No courses enrolled yet")}
            </p>
          </m.div>
        ) : (
          <m.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {filteredCourses.map((course, i) => {
              const isComplete = course.progress >= 100
              return (
                <m.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm transition-all hover:border-primary/15 hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-[#F1F5F9]">
                    <Image
                      src={course.thumbnail}
                      alt={locale === "ar" ? course.titleAr : course.titleEn}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Progress overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-bold text-base truncate pe-4">
                          {locale === "ar" ? course.titleAr : course.titleEn}
                        </h3>
                        <span className={`shrink-0 text-sm font-extrabold ${isComplete ? "text-emerald-400" : "text-white"}`}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                          className={`h-full rounded-full ${isComplete ? "bg-emerald-400" : "bg-gradient-to-r from-primary to-primary/90"}`}
                        />
                      </div>
                    </div>

                    {/* Status badge */}
                    {isComplete && (
                      <div className="absolute top-3 end-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
                        <Trophy className="w-3 h-3" />
                        {locale === "ar" ? "مكتمل" : "Complete"}
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <m.div
                        whileHover={{ scale: 1.1 }}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30"
                      >
                        <Play className="h-6 w-6 text-white ms-0.5" />
                      </m.div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-xs text-[#94A3B8] mb-3">{safeStr(locale === "ar" ? course.instructorAr : course.instructorEn)}</p>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-[#0F172A]">{course.completedLessons}</span>
                        <span>/ {course.lessons}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{course.hours} {locale === "ar" ? "ساعة" : "hrs"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-[#0F172A]">{course.rating}</span>
                      </div>
                    </div>

                    <Link href={`/learning/${course.id}`} className="block">
                      <Button
                        className={`w-full h-11 rounded-xl gap-2 font-semibold shadow-md transition-all ${
                          isComplete
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                            : "bg-primary hover:bg-primary-hover text-white shadow-primary/25"
                        }`}
                      >
                        {isComplete
                          ? (locale === "ar" ? "مراجعة الدورة" : "Review Course")
                          : (locale === "ar" ? "متابعة التعلم" : "Continue Learning")}
                        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </Link>
                  </div>
                </m.div>
              )
            })}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
