"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { m, useInView } from "framer-motion"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"

export type TestimonialItem = {
  id: string
  nameAr: string
  nameEn: string
  roleAr: string
  roleEn: string
  avatar: string
  textAr: string
  textEn: string
  rating: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: TestimonialItem
  locale: string
}) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-medex-red/20">
      <div className="absolute top-6 end-6 opacity-10">
        <Quote className="h-10 w-10 text-medex-red" />
      </div>
      <StarRating rating={testimonial.rating} />
      <p className="mt-5 flex-1 text-[15px] leading-relaxed text-gray-500">
        &ldquo;{locale === "ar" ? testimonial.textAr : testimonial.textEn}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-medex-red/20">
          <Image
            src={testimonial.avatar}
            alt={locale === "ar" ? testimonial.nameAr : testimonial.nameEn}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-medex-dark">
            {locale === "ar" ? testimonial.nameAr : testimonial.nameEn}
          </h4>
          <p className="text-sm text-gray-400">
            {locale === "ar" ? testimonial.roleAr : testimonial.roleEn}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const { locale, dir, t } = useI18n()
  const isAr = locale === "ar"
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" })
  const [activeIndex, setActiveIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: apiTestimonials } = useApi(() => api.getFeaturedReviews(6, true))
  const testimonials = (() => {
    if (!apiTestimonials || !Array.isArray(apiTestimonials) || apiTestimonials.length === 0) return []
    return apiTestimonials.map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ""),
      nameAr: (r.nameAr as string) || "",
      nameEn: (r.nameEn as string) || "",
      roleAr: (r.roleAr as string) || "",
      roleEn: (r.roleEn as string) || "",
      avatar: (r.avatar as string) || "/user-avatar.png",
      textAr: (r.textAr as string) || "",
      textEn: (r.textEn as string) || "",
      rating: Number(r.rating ?? 5),
    })) as TestimonialItem[]
  })()

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setItemsPerView(1)
      else if (window.innerWidth < 1024) setItemsPerView(2)
      else setItemsPerView(3)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const maxIndex = Math.max(0, testimonials.length - itemsPerView)

  const scrollNext = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const scrollPrev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  useEffect(() => {
    autoPlayRef.current = setInterval(scrollNext, 5000)
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [scrollNext])

  const pauseAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
  }, [])

  const resumeAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(scrollNext, 5000)
  }, [scrollNext])

  const isRtl = dir === "rtl"

  return (
    <section
      ref={sectionRef}
      dir={dir}
      className="relative overflow-hidden py-14 sm:py-20 lg:py-28 bg-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-0 w-72 h-72 rounded-full bg-red-50/60 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 end-0 w-96 h-96 rounded-full bg-blue-50/40 blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
            {isAr ? "آراء العملاء" : "Testimonials"}
          </span>
          <h2 className="mb-3 text-3xl font-bold text-medex-dark sm:text-4xl font-display">
            {isAr ? "ماذا يقول عملاؤنا" : "What Our Clients Say"}
          </h2>
          <p className="mx-auto max-w-xl text-base text-gray-500">
            {isAr ? "موثوق من فرق وعلامات تعتمد على PDS للمحتوى والنمو الرقمي" : "Trusted by teams and brands that rely on PDS for content and digital growth"}
          </p>
        </m.div>

        <div
          className="relative"
          onMouseEnter={pauseAutoPlay}
          onMouseLeave={resumeAutoPlay}
        >
          <div className="overflow-hidden">
            <m.div
              className="flex gap-6"
              animate={{
                x: isRtl
                  ? `${activeIndex * (100 / itemsPerView + (6 * 4) / itemsPerView)}%`
                  : `-${activeIndex * (100 / itemsPerView + (6 * 4) / itemsPerView)}%`,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            >
              {testimonials.length === 0 ? (
                <div className="w-full py-12 text-center text-gray-400 shrink-0" style={{ width: "100%" }}>
                  {isAr ? "لا توجد آراء بعد" : "No testimonials yet"}
                </div>
              ) : testimonials.map((testimonial: TestimonialItem, index: number) => (
                <m.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={
                    isInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 40 }
                  }
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="shrink-0"
                  style={{
                    width: `calc((100% - ${(itemsPerView - 1) * 24}px) / ${itemsPerView})`,
                  }}
                >
                  <TestimonialCard
                    testimonial={testimonial}
                    locale={locale}
                  />
                </m.div>
              ))}
            </m.div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                isRtl ? scrollNext() : scrollPrev()
              }}
              className="rounded-full w-10 h-10 border-gray-200 hover:border-medex-red/30 hover:bg-red-50 hover:text-medex-red text-gray-400 bg-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-8 bg-medex-red"
                      : "w-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                isRtl ? scrollPrev() : scrollNext()
              }}
              className="rounded-full w-10 h-10 border-gray-200 hover:border-medex-red/30 hover:bg-red-50 hover:text-medex-red text-gray-400 bg-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
