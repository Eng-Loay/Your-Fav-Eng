"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, Users, Clock, PlayCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { safeStr, resolveImageUrl } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { portraitAwareObjectClass, isPortraitPosterAsset } from "@/lib/brand-assets"

export interface CourseData {
  id: string
  thumbnail: string
  titleAr: string
  titleEn: string
  instructorAr: string
  instructorEn: string
  instructorAvatar: string
  rating: number
  students: number
  price: number
  originalPrice: number
  category: string
  level: string
  hours: number
  lessons: number
  sections: number
}

interface CourseCardProps {
  course: CourseData
}

export default function CourseCard({ course }: CourseCardProps) {
  const { locale, dir, t } = useI18n()
  const router = useRouter()
  const { addToCart, isInCart, isPurchased, enrollFree, isLoggedIn } = useStore()
  const { formatCurrency } = usePlatformCurrency()

  const title = (locale === "ar" ? course.titleAr : course.titleEn) || course.titleEn || course.titleAr || "Course"
  const instructorRaw = locale === "ar" ? course.instructorAr : course.instructorEn
  const instructor = typeof instructorRaw === "string" ? instructorRaw : (instructorRaw && typeof instructorRaw === "object" && "name" in instructorRaw ? String((instructorRaw as { name: string }).name) : "")
  const isFree = course.price === 0
  const isDiscounted =
    !isFree && course.originalPrice > 0 && course.originalPrice > course.price

  const levelLabels: Record<string, string> = {
    beginner: t("singleCourse.beginner"),
    intermediate: t("singleCourse.intermediate"),
    advanced: t("singleCourse.advanced"),
  }
  const levelLabel = levelLabels[course.level] ?? course.level

  const categoryKey = typeof course.category === "string" ? course.category : safeStr(course.category) || "presentations"
  const categoryLabel = (() => {
    const translated = t(`coursesPage.categories.${categoryKey}`)
    if (translated && !translated.startsWith("coursesPage.")) return translated
    return categoryKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  })()

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:border-medex-red/20 hover:shadow-xl hover:-translate-y-2"
    >
      <Link
        href={`/courses/${course.id}`}
        className={`relative block overflow-hidden bg-gray-100 ${
          isPortraitPosterAsset(course.thumbnail) ? "aspect-[4/5] sm:aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={resolveImageUrl(course.thumbnail, "/course-1.png")}
          alt={title}
          fill
          className={`${portraitAwareObjectClass(course.thumbnail)} transition-transform duration-500 ease-out group-hover:scale-105`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm">
            <PlayCircle className="h-7 w-7 text-medex-red" fill="currentColor" />
          </span>
        </div>

        <div className="absolute start-3 top-3 flex flex-wrap gap-2">
          <Badge className="border-0 bg-medex-red px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            {categoryLabel}
          </Badge>
          <Badge className="border-0 bg-white/90 px-2.5 py-1 text-xs font-medium text-medex-dark backdrop-blur-sm">
            {levelLabel}
          </Badge>
        </div>

        <div className="absolute bottom-3 start-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5" />
          {course.hours > 0 ? `${course.hours}h` : "—"}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/courses/${course.id}`} className="block flex-1">
          <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-snug text-medex-dark transition-colors group-hover:text-medex-red">
            {title}
          </h3>
        </Link>

        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100">
            <Image
              src={course.instructorAvatar}
              alt={instructor}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium text-gray-500 truncate">
            {instructor}
          </span>
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-medex-dark">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-300" />
            <span>{course.students.toLocaleString()}</span>
          </div>
          <span className="text-gray-200">·</span>
          <span className="font-medium">{course.lessons} lessons</span>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isFree ? (
                <Badge className="border-0 bg-emerald-50 px-3 py-1 font-bold text-emerald-600">
                  {t("bestCourses.free")}
                </Badge>
              ) : (
                <>
                  <span className="text-xl font-bold text-medex-red">
                    {formatCurrency(course.price)}
                  </span>
                  {isDiscounted && (
                    <span className="text-sm font-medium text-gray-300 line-through">
                      {formatCurrency(course.originalPrice)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isPurchased(course.id) ? (
              <Link href={`/learning/${course.id}`} className="flex-1">
                <Button className="w-full h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold gap-2">
                  Start Learning
                </Button>
              </Link>
            ) : isInCart(course.id) ? (
              <Button disabled variant="outline" className="flex-1 h-11 rounded-xl font-semibold opacity-60 border-gray-200 text-gray-400 bg-gray-50">
                In Cart ✓
              </Button>
            ) : course.price === 0 ? (
              <Button
                onClick={async () => {
                  if (!isLoggedIn) {
                    router.push("/login")
                    return
                  }
                  const ok = await enrollFree(course.id)
                  if (ok) router.push(`/learning/${course.id}`)
                }}
                className="flex-1 h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold gap-2"
              >
                Enroll Free
              </Button>
            ) : (
              <Link href={`/courses/${course.id}`} className="flex-1">
                <Button className="w-full h-11 rounded-xl bg-mds-primary text-white hover:opacity-90 font-semibold gap-2">
                  {locale === "ar" ? "التفاصيل" : "View Details"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
