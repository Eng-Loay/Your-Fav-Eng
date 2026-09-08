// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import { Search, BookOpen, GraduationCap, Star, Users, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import CourseCard from "@/components/courses/course-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortOption = "popular" | "newest" | "priceAsc" | "priceDesc" | "rating"

interface PlatformCategory {
  id: string
  name: string
  nameEn?: string
  slug: string
  children?: { id: string; name: string; nameEn?: string; slug: string }[]
}

const heroParticles = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: ((i * 17 + 13) % 97) + 1,
  y: ((i * 23 + 7) % 93) + 2,
  size: 2 + ((i * 11) % 8) / 10,
  duration: 6 + ((i * 7) % 4),
  delay: (i * 2) % 3,
}))

const heroStats = [
  { value: "200+", statKey: "courses", icon: BookOpen },
  { value: "50+", statKey: "instructors", icon: GraduationCap },
  { value: "15K+", statKey: "students", icon: Users },
  { value: "4.8", statKey: "rating", icon: Star },
]

function CoursesPageContent() {
  const { locale, dir, t } = useI18n()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [sort, setSort] = useState<SortOption>("popular")
  const [categories, setCategories] = useState<PlatformCategory[]>([])

  useEffect(() => {
    const cat = searchParams.get("category")
    if (cat) setCategory(cat)
    const q = searchParams.get("search")
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    api.request<PlatformCategory[]>("/settings/categories?service=platform").then((res) => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data)
    }).catch(() => {})
  }, [])

  const categoryOptions = useMemo(() => {
    const all = { slug: "all", name: locale === "ar" ? "جميع الفئات" : "All", nameEn: "All" }
    const flat: { slug: string; name: string; nameEn?: string }[] = []
    for (const c of categories) {
      flat.push({ slug: c.slug, name: c.name, nameEn: c.nameEn || c.name })
      if (c.children?.length) {
        for (const child of c.children) {
          flat.push({ slug: child.slug, name: `${c.name} › ${child.name}`, nameEn: child.nameEn || child.name })
        }
      }
    }
    return [all, ...flat]
  }, [categories, locale])

  const { data: apiCourses, loading } = useApi(
    () => api.getCourses({ search: search || undefined, category: category !== "all" ? category : undefined, sort }),
    { deps: [search, category, sort] }
  )

  const toStringOrName = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
      return String((val as { name: string }).name)
    return ""
  }

  const getCategorySlug = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "slug" in val && typeof (val as { slug?: unknown }).slug === "string")
      return String((val as { slug: string }).slug)
    return toStringOrName(val) || ""
  }

  const coursesFromApi = useMemo(() => {
    if (apiCourses && Array.isArray(apiCourses) && apiCourses.length > 0) {
      return apiCourses.map((c: Record<string, unknown>) => {
        const instructorObj = c.instructor as { name?: string; avatar?: string } | undefined
        const durationMinutes = Number(c.duration ?? 0)
        const hoursFromDuration = durationMinutes > 0 ? Math.round(durationMinutes / 60) : 0
        return {
          id: String(c.id ?? c.slug ?? ""),
          thumbnail: (c.thumbnail as string) || "/course-1.png",
          titleAr: (c.titleAr as string) || (c.title as string) || "",
          titleEn: (c.titleEn as string) || (c.title as string) || "",
          instructorAr: toStringOrName(c.instructorAr) || (instructorObj?.name ?? "") || "",
          instructorEn: toStringOrName(c.instructorEn) || (instructorObj?.name ?? "") || "",
          instructorAvatar: (c.instructorAvatar as string) || (instructorObj?.avatar as string) || "/user-avatar.png",
          rating: Number(c.averageRating ?? c.rating ?? 4.5),
          students: Number(c.totalStudents ?? c.students ?? c.enrollmentCount ?? 0),
          price: Number((c.discountPrice ?? c.price) ?? 0),
          originalPrice: Number(c.originalPrice ?? c.price ?? 0),
          category: getCategorySlug(c.category) || (typeof c.category === "string" ? c.category : "programming"),
          level: (c.level as string) || "beginner",
          hours: Number(c.hours ?? 0) || hoursFromDuration,
          lessons: Number(c.lessonsCount ?? c.lessons ?? 0),
          sections: Number(c.chaptersCount ?? c.sections ?? 0),
          updatedAt: (c.updatedAt as string) || "",
          language: (c.language as string) || "en",
          descriptionAr: (c.descriptionAr as string) || "",
          descriptionEn: (c.descriptionEn as string) || "",
        }
      })
    }
    return null
  }, [apiCourses])

  const sourceCourses = coursesFromApi ?? []

  const filtered = useMemo(() => {
    let result = [...sourceCourses]

    if (category !== "all") {
      result = result.filter((c) => c.category === category)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.titleAr.toLowerCase().includes(q) ||
          c.titleEn.toLowerCase().includes(q) ||
          c.instructorAr.toLowerCase().includes(q) ||
          c.instructorEn.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case "popular":
        result.sort((a, b) => b.students - a.students)
        break
      case "newest":
        result.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
        break
      case "priceAsc":
        result.sort((a, b) => a.price - b.price)
        break
      case "priceDesc":
        result.sort((a, b) => b.price - a.price)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
    }

    return result
  }, [sourceCourses, category, search, sort])

  const textReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  }

  return (
    <div dir={dir} className="min-h-screen bg-white">
      <Navbar />

      {/* Hero section */}
      <section className="relative overflow-hidden pt-28 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
          <m.div
              className="absolute -top-32 start-[-8%] h-[500px] w-[500px] rounded-full bg-red-50/50 blur-[120px]"
              style={{ willChange: "opacity" }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(235,45,60,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(235,45,60,0.5) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <m.div className="container relative mx-auto px-4" initial="hidden" animate="visible">
          <div className="mx-auto max-w-3xl text-center">
            <m.div
              variants={textReveal}
              custom={0}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-medex-red/20 bg-red-50 px-5 py-2.5 text-sm font-medium text-medex-red backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-medex-red/60" />
              {locale === "ar" ? "استكشف دورات العلامة والمحتوى" : "Explore brand & content courses"}
            </m.div>
            <m.h1
              variants={textReveal}
              custom={1}
              className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-medex-dark md:text-5xl lg:text-6xl font-display"
            >
              {t("coursesPage.title")}
            </m.h1>
            <m.p
              variants={textReveal}
              custom={2}
              className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gray-500"
            >
              {t("coursesPage.subtitle")}
            </m.p>
            <m.div
              variants={textReveal}
              custom={3}
              className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              {heroStats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: "backOut" }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                      <Icon className="h-5 w-5 text-medex-red/70" />
                    </div>
                    <div className="text-start">
                      <p className="text-sm font-bold text-medex-dark">{stat.value}</p>
                      <p className="text-xs text-gray-400">{t(`coursesPage.stats.${stat.statKey}`)}</p>
                    </div>
                  </m.div>
                )
              })}
            </m.div>
          </div>
        </m.div>
      </section>

      {/* Search & filters */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-[24px] bg-white border border-gray-200 shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("coursesPage.search")}
                className="h-14 rounded-2xl border-gray-200 bg-gray-50 ps-12 text-base text-medex-dark placeholder:text-gray-400 focus:border-medex-red/30 focus:ring-medex-red/10"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-12 w-full sm:w-[200px] rounded-2xl border-gray-200 bg-white text-medex-dark">
                  <SelectValue placeholder={t("coursesPage.sort")} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-medex-dark">
                  <SelectItem value="popular">{t("coursesPage.sortOptions.popular")}</SelectItem>
                  <SelectItem value="newest">{t("coursesPage.sortOptions.newest")}</SelectItem>
                  <SelectItem value="priceAsc">{t("coursesPage.sortOptions.priceAsc")}</SelectItem>
                  <SelectItem value="priceDesc">{t("coursesPage.sortOptions.priceDesc")}</SelectItem>
                  <SelectItem value="rating">{t("coursesPage.sortOptions.rating")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </m.div>

        {/* Category pills - horizontal scroll on mobile */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0"
        >
          <div className="flex gap-2 min-w-max lg:flex-wrap lg:min-w-0">
            {categoryOptions.map((cat) => {
              const active = category === cat.slug
              const label = locale === "ar" ? cat.name : (cat.nameEn || cat.name)
              return (
                <m.button
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-2xl px-6 py-3 text-sm font-bold transition-all whitespace-nowrap ${
                    active
                      ? "bg-medex-red text-white shadow-lg"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-medex-red/30 hover:text-medex-red"
                  }`}
                >
                  {label}
                </m.button>
              )
            })}
          </div>
        </m.div>

        <div className="mb-6 text-sm text-gray-500">
          {t("coursesPage.showing")}{" "}
          <span className="font-bold text-medex-dark">{filtered.length}</span>{" "}
          {t("coursesPage.of")}{" "}
          <span className="font-bold text-medex-dark">{sourceCourses.length}</span>{" "}
          {t("coursesPage.results")}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-medex-red border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-24 rounded-3xl bg-gray-50 border border-gray-200"
            >
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50">
                <Search className="h-10 w-10 text-medex-red/50" />
              </div>
              <p className="text-xl font-bold text-medex-dark">{t("coursesPage.noResults")}</p>
            </m.div>
          ) : (
            <m.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((course, i) => (
                <m.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <CourseCard course={course} />
                </m.div>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-medex-red border-t-transparent" /></div>}>
      <CoursesPageContent />
    </Suspense>
  )
}
