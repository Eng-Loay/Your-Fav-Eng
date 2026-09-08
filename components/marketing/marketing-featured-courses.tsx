"use client"

import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { Calendar, ChevronRight, MapPin, Video } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { FEATURED_COURSE_FALLBACKS, resolveLocalCourseThumbnail } from "@/lib/membership-package-images"
import { portraitAwareObjectClass } from "@/lib/brand-assets"
import { resolveMediaUrl } from "@/lib/utils"

const LEVEL_BADGE_KEYS = ["courseLevelAdvanced", "courseLevelEssentials", "courseLevelHandsOn"] as const
const FALLBACK_IMAGES = FEATURED_COURSE_FALLBACKS

type RowCourse = {
  id: string
  href: string
  title: string
  description: string
  image: string
  badgeKey: (typeof LEVEL_BADGE_KEYS)[number]
  dateLine: string
  locationLine: string
  isWebinar: boolean
  price: number
}

export function MarketingFeaturedCourses() {
  const { locale, t, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const { data: apiCourses, loading } = useApi(() => api.getFeaturedCourses())

  const rows: RowCourse[] = (() => {
    const list = Array.isArray(apiCourses)
      ? (apiCourses as Record<string, unknown>[])
      : apiCourses && typeof apiCourses === "object" && Array.isArray((apiCourses as { data?: unknown[] }).data)
        ? ((apiCourses as { data: Record<string, unknown>[] }).data)
        : []
    const featuredOnly = list.filter((c) => c && typeof c === "object" && c.featured === true)
    const source = featuredOnly.length > 0 ? featuredOnly : list
    if (source.length > 0) {
      return source.slice(0, 3).map((c: Record<string, unknown>, i: number) => {
        const id = String(c.id ?? "")
        const title =
          locale === "ar"
            ? String(c.titleAr ?? c.title ?? "")
            : String(c.titleEn ?? c.title ?? "")
        const description =
          locale === "ar"
            ? String(c.descriptionAr ?? c.description ?? "").slice(0, 160)
            : String(c.descriptionEn ?? c.description ?? "").slice(0, 160)
        const thumb = resolveMediaUrl(
          resolveLocalCourseThumbnail(
            typeof c.thumbnail === "string" ? c.thumbnail : "",
            FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
            typeof c.slug === "string" ? c.slug : undefined
          ),
          FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]
        )
        const start = (c.startDate as string) || (c.updatedAt as string) || ""
        const dateLine = start
          ? new Date(start).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"
        const loc = (c.location as string) || (c.format === "online" ? t("marketing.courseFallback2Meta") : "—")
        const isWebinar = String(c.format ?? "").toLowerCase() === "online" || /webinar/i.test(loc)
        const level = String(c.level ?? "").toLowerCase()
        let badgeKey: (typeof LEVEL_BADGE_KEYS)[number] = LEVEL_BADGE_KEYS[i % 3]
        if (level === "advanced") badgeKey = "courseLevelAdvanced"
        else if (level === "beginner" || level === "intermediate") badgeKey = "courseLevelEssentials"

        return {
          id,
          href: `/courses/${id}`,
          title: title || "Course",
          description: description || "—",
          image: thumb,
          badgeKey,
          dateLine,
          locationLine: loc,
          isWebinar,
          price: Number(c.discountPrice ?? c.price ?? 0),
        }
      })
    }

    return [
      {
        id: "f1",
        href: "/courses",
        title: t("marketing.courseFallback1Title"),
        description: t("marketing.courseFallback1Desc"),
        image: FALLBACK_IMAGES[0],
        badgeKey: "courseLevelAdvanced" as const,
        dateLine: "Oct 12 – 14, 2024",
        locationLine: t("marketing.courseFallback1Meta"),
        isWebinar: false,
        price: 2450,
      },
      {
        id: "f2",
        href: "/courses",
        title: t("marketing.courseFallback2Title"),
        description: t("marketing.courseFallback2Desc"),
        image: FALLBACK_IMAGES[1],
        badgeKey: "courseLevelEssentials" as const,
        dateLine: "Nov 05 – 06, 2024",
        locationLine: t("marketing.courseFallback2Meta"),
        isWebinar: true,
        price: 890,
      },
      {
        id: "f3",
        href: "/courses",
        title: t("marketing.courseFallback3Title"),
        description: t("marketing.courseFallback3Desc"),
        image: FALLBACK_IMAGES[2],
        badgeKey: "courseLevelHandsOn" as const,
        dateLine: "Dec 01, 2024",
        locationLine: t("marketing.courseFallback3Meta"),
        isWebinar: false,
        price: 1150,
      },
    ]
  })()

  return (
    <section className="py-24 mds-tonal-layering-1">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <m.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-mds-primary">
            {t("marketing.ceEyebrow")}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tighter text-mds-on-background md:text-6xl">
            {t("marketing.coursesHeadline")}
          </h2>
        </m.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-mds-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {rows.map((course, i) => (
              <m.article
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-lg bg-mds-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-2xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/2] lg:h-64 lg:aspect-auto">
                  <Image
                    src={course.image}
                    alt=""
                    fill
                    unoptimized
                    className={`${portraitAwareObjectClass(course.image)} transition-transform duration-500 group-hover:scale-110`}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute start-4 top-4 rounded-md bg-white/90 px-3 py-1 text-[10px] font-bold text-mds-primary backdrop-blur">
                    {t(`marketing.${course.badgeKey}`)}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-mds-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {course.dateLine}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="inline-flex items-center gap-1">
                      {course.isWebinar ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                      {course.locationLine}
                    </span>
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-mds-on-background transition-colors group-hover:text-mds-primary">
                    {course.title}
                  </h3>
                  <p className="mb-8 line-clamp-3 text-sm text-mds-on-surface-variant">{course.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-mds-surface-container-low pt-6">
                    <span className="text-lg font-bold text-mds-on-background">
                      {course.price > 0 ? formatCurrency(course.price) : t("bestCourses.free")}
                    </span>
                    <Link
                      href={course.href}
                      className="flex items-center gap-1 text-sm font-bold text-mds-primary"
                    >
                      {t("marketing.courseRegister")}
                      <ChevronRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                </div>
              </m.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
