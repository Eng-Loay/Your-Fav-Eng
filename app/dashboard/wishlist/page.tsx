"use client"

import { useMemo } from "react"
import { m, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Heart, Star, ShoppingCart } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

function toStringOrName(val: unknown): string {
  if (typeof val === "string") return val
  if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
    return String((val as { name: string }).name)
  return ""
}

export default function WishlistPage() {
  const { locale, dir, t } = useI18n()
  const { wishlist, toggleWishlist } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const { data: apiWishlist } = useApi(() => api.getWishlist())
  const wishlistCourses = useMemo(() => {
    const raw = apiWishlist as { items?: Array<{ id: string; course?: Record<string, unknown> }> } | undefined
    const items = raw?.items ?? (Array.isArray(apiWishlist) ? apiWishlist : [])
    if (!Array.isArray(items) || items.length === 0) return []
    return items
      .filter((i) => i.course)
      .map((i) => {
        const c = i.course as Record<string, unknown>
        return {
          id: String(c.id ?? i.id),
          thumbnail: (c.thumbnail as string) ?? "/course-1.png",
          titleAr: (c.titleAr as string) ?? (c.title as string) ?? "",
          titleEn: (c.titleEn as string) ?? (c.title as string) ?? "",
          instructorAr: toStringOrName(c.instructorAr) || toStringOrName(c.instructor) || "",
          instructorEn: toStringOrName(c.instructorEn) || toStringOrName(c.instructor) || "",
          rating: Number(c.averageRating ?? c.rating ?? 4.5),
          students: Number(c.totalStudents ?? c.students ?? 0),
          price: Number(c.discountPrice ?? c.price ?? 0),
        }
      })
  }, [apiWishlist])

  return (
    <div dir={dir}>
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.wishlist")}</h2>

      {wishlistCourses.length === 0 ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[20px] border border-border p-12 text-center"
        >
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t("dashboard.emptyWishlist")}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t("dashboard.addToWishlist")}</p>
          <Link href="/courses">
            <Button className="bg-gradient-to-r from-primary to-primary/90 text-white">
              {locale === "ar" ? "تصفح الدورات" : "Browse Courses"}
            </Button>
          </Link>
        </m.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistCourses.map((course) => (
              <m.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[20px] border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-44">
                  <Image
                    src={course.thumbnail}
                    alt={locale === "ar" ? course.titleAr : course.titleEn}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    onClick={() => toggleWishlist(course.id)}
                    className="absolute top-3 end-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-foreground mb-1 line-clamp-1">
                    {locale === "ar" ? course.titleAr : course.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {safeStr(locale === "ar" ? course.instructorAr : course.instructorEn)}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({course.students.toLocaleString()} {locale === "ar" ? "طالب" : "students"})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">
                      {course.price === 0
                        ? locale === "ar" ? "مجاني" : "Free"
                        : formatCurrency(course.price)}
                    </span>
                    <Link href={`/courses/${course.id}`}>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
