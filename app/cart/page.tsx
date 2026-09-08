"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { m, AnimatePresence } from "framer-motion"
import { Trash2, ShoppingCart, Tag, ArrowRight, ArrowLeft, Star, Clock, Users, ShieldCheck, BadgePercent } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { useApi, api } from "@/hooks/use-api"
import { cn, safeStr } from "@/lib/utils"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AnimatedPageHero } from "@/components/ui/animated-page-hero"

type CourseItem = {
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
  updatedAt: string
  language: string
  descriptionAr: string
  descriptionEn: string
}

function toStringOrName(val: unknown): string {
  if (typeof val === "string") return val
  if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
    return String((val as { name: string }).name)
  return ""
}

function mapApiCourseToItem(c: Record<string, unknown>): CourseItem {
  return {
    id: String(c.id ?? c.slug ?? ""),
    thumbnail: (c.thumbnail as string) || "/course-1.png",
    titleAr: (c.titleAr as string) || (c.title as string) || "",
    titleEn: (c.titleEn as string) || (c.title as string) || "",
    instructorAr: toStringOrName(c.instructorAr) || toStringOrName(c.instructor) || "",
    instructorEn: toStringOrName(c.instructorEn) || toStringOrName(c.instructor) || "",
    instructorAvatar: (c.instructorAvatar as string) || "/user-avatar.png",
    rating: Number(c.rating ?? 4.5),
    students: Number(c.students ?? c.enrollmentCount ?? 0),
    price: Number(c.price ?? 0),
    originalPrice: Number(c.originalPrice ?? c.price ?? 0),
    category: (typeof c.category === "string" ? c.category : toStringOrName(c.category)) || "programming",
    level: (c.level as string) || "beginner",
    hours: Number(c.hours ?? 0),
    lessons: Number(c.lessons ?? 0),
    sections: Number(c.sections ?? 0),
    updatedAt: (c.updatedAt as string) || "",
    language: (c.language as string) || "ar",
    descriptionAr: (c.descriptionAr as string) || "",
    descriptionEn: (c.descriptionEn as string) || "",
  } as CourseItem
}

export default function CartPage() {
  const { locale, dir, t } = useI18n()
  const { cart, removeFromCart, isLoggedIn, showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"

  const { data: apiCart, refetch: refetchCart } = useApi(
    () => (isLoggedIn ? api.getCart() : Promise.resolve({ success: false })),
    { deps: [isLoggedIn], immediate: isLoggedIn }
  )

  useEffect(() => {
    if (!isLoggedIn) return
    const onCartUpdate = () => refetchCart()
    window.addEventListener("cart-update", onCartUpdate)
    return () => window.removeEventListener("cart-update", onCartUpdate)
  }, [isLoggedIn, refetchCart])
  const { data: apiCourses } = useApi(() => api.getCourses({ limit: 200 }), { deps: [] })

  const allCourses = useMemo((): CourseItem[] => {
    const res = apiCourses as { success?: boolean; data?: unknown[] } | unknown[] | undefined
    const raw = res && typeof res === "object" && "data" in res && Array.isArray((res as { data?: unknown[] }).data)
      ? (res as { data: unknown[] }).data
      : Array.isArray(res) ? res : []
    if (raw.length > 0) {
      return raw.map((c) => mapApiCourseToItem(c as Record<string, unknown>))
    }
    return []
  }, [apiCourses])

  type CartItemWithMeta = CourseItem & { cartItemId?: string; productId?: string; isProduct?: boolean }
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
  const cartItems = useMemo((): CartItemWithMeta[] => {
    const cartData = apiCart as { items?: Array<{ id: string; courseId?: string; productId?: string; course?: Record<string, unknown>; product?: { id: string; title: string; titleAr?: string; thumbnail?: string; price: number }; title?: string; calculatedPrice?: number }> } | null
    if (isLoggedIn && cartData?.items) {
      const items = cartData.items
      const courseItems = items
        .filter((i) => i.courseId && i.course)
        .map((i) => {
          const course = i.course as Record<string, unknown>
          return {
            ...mapApiCourseToItem(course),
            id: String(course.id ?? i.courseId),
            cartItemId: i.id,
            price: i.calculatedPrice ?? Number(course.discountPrice ?? course.price ?? 0),
            originalPrice: Number(course.price ?? course.discountPrice ?? 0),
            titleAr: (course.titleAr as string) || (course.title as string) || (i.title as string) || "",
            titleEn: (course.titleEn as string) || (course.title as string) || (i.title as string) || "",
          } as CartItemWithMeta
        })
      const productItems = items
        .filter((i) => i.productId && i.product)
        .map((i) => {
          const prod = i.product!
          const imgSrc = prod.thumbnail
            ? prod.thumbnail.startsWith("http")
              ? prod.thumbnail
              : prod.thumbnail.startsWith("/")
                ? `${API_BASE.replace(/\/api$/, "")}${prod.thumbnail}`
                : prod.thumbnail
            : "/course-1.png"
          return {
            ...mapApiCourseToItem({}),
            id: String(prod.id),
            cartItemId: i.id,
            productId: i.productId,
            isProduct: true,
            thumbnail: imgSrc,
            titleAr: prod.titleAr || prod.title || (i.title as string) || "",
            titleEn: prod.title || (i.title as string) || "",
            instructorAr: "",
            instructorEn: "",
            price: i.calculatedPrice ?? prod.price,
            originalPrice: prod.price,
          } as CartItemWithMeta
        })
      return [...courseItems, ...productItems]
    }
    return cart
      .map((item) => {
        const c = allCourses.find((x) => x.id === item.courseId)
        return c ? ({ ...c, cartItemId: item.id } as CartItemWithMeta) : null
      })
      .filter(Boolean) as CartItemWithMeta[]
  }, [isLoggedIn, apiCart, cart, allCourses])

  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const discount = couponDiscount
  const total = subtotal - discount

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    if (!isLoggedIn) {
      setCouponError(locale === "ar" ? "سجل دخول لتطبيق الكوبون" : "Login to apply coupon")
      setTimeout(() => setCouponError(""), 3000)
      return
    }
    try {
      const res = await api.applyCoupon(couponCode.trim()) as { success?: boolean; data?: { valid?: boolean; message?: string; coupon?: { discount: number }; discountedTotal?: number }; message?: string }
      const data = res?.data
      if (res?.success && data?.valid && data?.coupon) {
        setCouponApplied(true)
        setCouponDiscount(data.coupon.discount ?? 0)
        setCouponError("")
        showToast(locale === "ar" ? "تم تطبيق الكوبون" : "Coupon applied", "success")
      } else {
        setCouponApplied(false)
        setCouponDiscount(0)
        setCouponError(data?.message || res?.message || (locale === "ar" ? "كود خصم غير صالح" : "Invalid coupon"))
        setTimeout(() => setCouponError(""), 4000)
      }
    } catch {
      setCouponApplied(false)
      setCouponDiscount(0)
      setCouponError(locale === "ar" ? "فشل التحقق من الكوبون" : "Failed to verify coupon")
      setTimeout(() => setCouponError(""), 4000)
    }
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Navbar />

      <AnimatedPageHero
        badge={locale === "ar" ? "سلة التسوق" : "Shopping Cart"}
        title={t("cart.title")}
        subtitle={cartItems.length > 0 ? `${cartItems.length} ${t("cart.items")}` : t("cart.empty")}
        compact
        dark
      />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8 pb-24 sm:pb-10">
        <AnimatePresence mode="wait">
          {cartItems.length === 0 ? (
            <m.div
              key="empty-cart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-16 sm:py-24"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-50">
                <ShoppingCart className="h-12 w-12 text-gray-500" />
              </div>
              <h2 className="mb-2 text-xl sm:text-2xl font-bold text-medex-dark">{t("cart.empty")}</h2>
              <p className="mb-8 max-w-md text-center text-gray-500 text-sm sm:text-base px-4">{t("cart.emptyDesc")}</p>
              <Link href="/courses">
                <Button
                  size="lg"
                  className="group gap-2 rounded-xl bg-medex-red text-white px-8 hover:bg-medex-red-dark"
                >
                  {t("cart.browseCourses")}
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:rtl:-translate-x-0.5" />
                </Button>
              </Link>
            </m.div>
          ) : (
            <m.div
              key="cart-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-5">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, idx) => (
                    <m.div
                      key={item.id + (item.cartItemId ?? "")}
                      layout={false}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
                      transition={{ duration: 0.25 }}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <Link href={(item as { isProduct?: boolean }).isProduct ? `/store/${item.id}` : `/courses/${item.id}`} className="relative h-36 sm:h-44 w-full shrink-0 overflow-hidden sm:w-44 block aspect-video sm:aspect-auto">
                          <Image
                            src={item.thumbnail}
                            alt={locale === "ar" ? item.titleAr : item.titleEn}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {item.originalPrice > item.price && (
                            <div className="absolute start-3 top-3 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                              -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                            </div>
                          )}
                        </Link>

                        <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                          <div>
                            <Link href={(item as { isProduct?: boolean }).isProduct ? `/store/${item.id}` : `/courses/${item.id}`}>
                              <h3 className="text-base sm:text-lg font-bold leading-snug text-medex-dark hover:text-medex-dark/80 line-clamp-2">
                                {locale === "ar" ? item.titleAr : item.titleEn}
                              </h3>
                            </Link>
                            <p className="mt-1 text-sm text-gray-500">
                              {safeStr(locale === "ar" ? item.instructorAr : item.instructorEn)}
                            </p>
                            {!(item as { isProduct?: boolean }).isProduct && (
                              <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold text-medex-dark">{item.rating}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {item.students.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {item.hours}h
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-primary">
                                {formatCurrency(item.price)}
                              </span>
                              {item.originalPrice > item.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  {formatCurrency(item.originalPrice)}
                                </span>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removeFromCart(item.id, "cartItemId" in item ? (item as { cartItemId?: string }).cartItemId : undefined)
                                if (isLoggedIn) refetchCart()
                              }}
                              className="gap-1.5 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">{t("cart.remove")}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </AnimatePresence>

                {/* Coupon */}
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-medex-dark">
                    <BadgePercent className="h-5 w-5 text-primary" />
                    {t("cart.coupon")}
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="SAVE20"
                      dir="ltr"
                      className={cn(
                        "h-12 flex-1 rounded-xl border-gray-200 bg-white text-medex-dark font-mono uppercase tracking-wider placeholder:text-gray-400 focus:border-medex-red/30",
                        couponApplied && "border-emerald-500/50 bg-emerald-50",
                        couponError && "border-red-500/50 bg-red-50"
                      )}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      className="h-12 rounded-xl bg-medex-red text-white px-6 hover:bg-medex-red-dark shrink-0"
                    >
                      {t("cart.apply")}
                    </Button>
                  </div>
                      {couponApplied && (
                    <m.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm font-medium text-emerald-600"
                    >
                      {couponCode} — {locale === "ar" ? "تم التطبيق" : "Applied"}
                    </m.p>
                  )}
                  {couponError && (
                    <p className="mt-2 text-sm font-medium text-red-600">{couponError}</p>
                  )}
                </m.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="sticky top-20 lg:top-24"
                >
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
                      <h2 className="text-base sm:text-lg font-bold text-medex-dark">{t("cart.checkout")}</h2>
                      <p className="mt-1 text-sm text-gray-600">{cartItems.length} {t("cart.items")}</p>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                      <div className="space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl">
                              <Image src={item.thumbnail} alt="" fill unoptimized className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs sm:text-sm font-medium text-medex-dark">
                                {locale === "ar" ? item.titleAr : item.titleEn}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs sm:text-sm font-bold text-medex-dark">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{t("cart.subtotal")}</span>
                          <span className="font-semibold text-medex-dark">{formatCurrency(subtotal)}</span>
                        </div>
                        {couponApplied && (
                          <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-emerald-600">{t("cart.discount")}</span>
                            <span className="font-semibold text-emerald-600">-{formatCurrency(discount)}</span>
                          </m.div>
                        )}
                        <Separator className="bg-gray-200" />
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-medex-dark">{t("cart.total")}</span>
                          <span className="text-xl sm:text-2xl font-extrabold text-medex-dark">{formatCurrency(total)}</span>
                        </div>
                      </div>

                      <Link href={isLoggedIn ? "/checkout" : "/login"} className="block">
                        <Button className="group h-12 w-full gap-2 rounded-xl bg-medex-red text-white text-base font-bold hover:bg-medex-red-dark">
                          {isLoggedIn ? t("cart.checkout") : (locale === "ar" ? "سجل دخول للإكمال" : "Login to Checkout")}
                          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:rtl:-translate-x-0.5" />
                        </Button>
                      </Link>

                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{locale === "ar" ? "دفع آمن ومشفّر" : "Secure encrypted payment"}</span>
                      </div>
                    </div>
                  </div>
                </m.div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  )
}
