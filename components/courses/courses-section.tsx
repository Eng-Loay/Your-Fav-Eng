"use client"

import { m } from "framer-motion"
import { ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import CourseCard from "./course-card"
import { LOCAL_COURSE_THUMBNAILS, resolveLocalCourseThumbnail } from "@/lib/membership-package-images"

function toStringOrName(val: unknown): string {
  if (typeof val === "string") return val
  if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
    return String((val as { name: string }).name)
  return ""
}

export default function CoursesSection() {
  const { t, dir, locale } = useI18n()
  const isAr = locale === "ar"
  const { data: apiCourses, loading } = useApi(() => api.getFeaturedCourses())
  const displayedCourses = (() => {
    if (!apiCourses || !Array.isArray(apiCourses) || apiCourses.length === 0) return []
    return apiCourses.slice(0, 6).map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ""),
      thumbnail: resolveLocalCourseThumbnail(
        c.thumbnail as string,
        LOCAL_COURSE_THUMBNAILS.grcFundamentals,
        c.slug as string
      ),
      titleAr: (c.titleAr as string) || (c.title as string) || "",
      titleEn: (c.titleEn as string) || (c.title as string) || "",
      instructorAr: toStringOrName(c.instructorAr) || toStringOrName(c.instructor) || "",
      instructorEn: toStringOrName(c.instructorEn) || toStringOrName(c.instructor) || "",
      instructorAvatar: (c.instructorAvatar as string) || "/user-avatar.png",
      rating: Number(c.averageRating ?? c.rating ?? 4.5),
      students: Number(c.totalStudents ?? c.students ?? 0),
      price: Number(c.discountPrice ?? c.price ?? 0),
      originalPrice: Number(c.price ?? 0),
      category: (typeof c.category === "string" ? c.category : toStringOrName(c.category)) || "presentations",
      level: (c.level as string) || "beginner",
      hours: Number(c.duration ?? c.hours ?? 0),
      lessons: Number((c as { chaptersCount?: number; lessonsCount?: number }).lessonsCount ?? (c as { chaptersCount?: number }).chaptersCount ?? 0) * 3,
      sections: Number((c as { chaptersCount?: number }).chaptersCount ?? 0),
      updatedAt: (c.updatedAt as string) || "",
      language: (c.language as string) || "en",
      descriptionAr: (c.descriptionAr as string) || "",
      descriptionEn: (c.descriptionEn as string) || "",
    }))
  })()

  return (
    <section className="relative overflow-hidden bg-gray-50 py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-red-50/40 blur-[100px]" />
      </div>

      <m.div
        className="pointer-events-none absolute end-[6%] top-[8%] hidden h-14 w-14 rounded-2xl border border-gray-200 bg-white shadow-md lg:flex items-center justify-center"
        style={{ willChange: "transform" }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <GraduationCap className="h-6 w-6 text-medex-red/50" />
      </m.div>

      <div className="container relative mx-auto px-4">
        <div className="mb-14 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end lg:mb-16">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
              {isAr ? "أحدث الدورات" : "Latest Courses"}
            </span>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl lg:text-5xl font-display">
              {isAr ? "التدريب المهني في طب الأسنان" : "Professional Dental Training"}
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
              {isAr ? "دورات بقيادة خبراء وورش عمل وأيام علمية لتعزيز مهاراتك ومعرفتك في طب الأسنان" : "Expert-led courses, workshops, and scientific days to enhance your dental skills and knowledge"}
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              asChild
              className="group h-12 rounded-xl bg-medex-red px-7 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-medex-red-dark"
            >
              <Link href="/courses" className="flex items-center gap-2">
                {isAr ? "عرض جميع الدورات" : "View All Courses"}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </m.div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-medex-red border-t-transparent" />
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {isAr ? "لا توجد دورات متاحة حالياً" : "No courses available yet"}
            </div>
          ) : displayedCourses.map((course, i) => (
            <m.div
              key={course.id}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <CourseCard course={course} />
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-14 text-center lg:mt-16"
        >
          <p className="mb-5 text-sm text-gray-400">
            {isAr ? `عرض ${displayedCourses.length} دورة متاحة` : `Showing ${displayedCourses.length} available courses`}
          </p>
          <Button
            asChild
            variant="outline"
            className="group h-12 rounded-xl border border-gray-200 px-8 text-sm font-semibold text-medex-dark transition-all hover:border-medex-red/30 hover:bg-red-50 hover:text-medex-red bg-white"
          >
            <Link href="/courses" className="flex items-center gap-2">
              {isAr ? "استكشف جميع الدورات" : "Explore All Courses"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </m.div>
      </div>
    </section>
  )
}
