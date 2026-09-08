"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"

interface ServiceBundleItem {
  id: string
  kind: "SERVICE" | "BUNDLE"
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  image?: string
  position?: number
  price?: number | null
  ctaUrl?: string | null
}

export function MarketingServicesBundles() {
  const { locale, dir, t } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const [items, setItems] = useState<ServiceBundleItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [bundleIndex, setBundleIndex] = useState(0)
  const [serviceIndex, setServiceIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    api.getServicesBundles()
      .then((res) => {
        if (!mounted) return
        const payload = res.data as any
        const list = Array.isArray(payload) ? payload : payload?.data || []
        setItems(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoaded(true)
      })
    return () => { mounted = false }
  }, [])

  const bundles = items.filter((item) => item.kind === "BUNDLE")
  const services = items.filter((item) => item.kind === "SERVICE")

  const getTitle = (item?: ServiceBundleItem) => (item ? (locale === "ar" ? item.titleAr || item.title : item.title) : "")
  const getDescription = (item?: ServiceBundleItem) =>
    item ? (locale === "ar" ? item.descriptionAr || item.description : item.description) : ""
  const getHref = (item?: ServiceBundleItem) => item?.ctaUrl || "/contact"
  const ctaLabel = locale === "ar" ? "اعرف المزيد" : "Learn more"
  const bundlesTitle = locale === "ar" ? "الباقات" : "Bundles"
  const servicesTitle = locale === "ar" ? "الخدمات" : "Services"
  const formatPrice = (price?: number | null) =>
    typeof price === "number" ? formatCurrency(price) : (locale === "ar" ? "تواصل معنا" : "Contact us")

  useEffect(() => {
    if (bundles.length <= 1) return
    const id = window.setInterval(() => {
      setBundleIndex((prev) => (prev + 1) % bundles.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [bundles.length])

  useEffect(() => {
    if (services.length <= 1) return
    const id = window.setInterval(() => {
      setServiceIndex((prev) => (prev + 1) % services.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [services.length])

  const renderCarousel = (
    source: ServiceBundleItem[],
    activeIndex: number,
    setActiveIndex: (value: number | ((prev: number) => number)) => void,
    sectionTitle: string
  ) => {
    if (source.length === 0) return null
    const activeItem = source[activeIndex % Math.max(source.length, 1)]
    if (!activeItem) return null

    const goPrev = () => {
      if (source.length <= 1) return
      setActiveIndex((prev) => (prev - 1 + source.length) % source.length)
    }

    const goNext = () => {
      if (source.length <= 1) return
      setActiveIndex((prev) => (prev + 1) % source.length)
    }

    return (
      <div>
        <h3 className="mb-4 text-2xl font-bold text-mds-on-background">{sectionTitle}</h3>
        <m.div
          className="group relative min-h-[320px] overflow-hidden rounded-lg border border-mds-outline-variant/10 bg-mds-surface-container-lowest md:min-h-[520px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Image
            key={activeItem.id}
            src={activeItem.image || "/placeholder.png"}
            alt={getTitle(activeItem)}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-r from-mds-on-background/80 via-mds-on-background/40 to-transparent p-8 md:p-12">
            <h4 className="mb-4 text-2xl font-bold text-white md:text-3xl">{getTitle(activeItem)}</h4>
            {getDescription(activeItem) && (
              <p className="mb-3 max-w-sm text-sm text-white/80 md:text-base">{getDescription(activeItem)}</p>
            )}
            <p className="mb-6 text-sm text-white/80">{formatPrice(activeItem.price)}</p>
            <Link
              href={getHref(activeItem)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mds-primary text-white"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>
          {source.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-4 md:px-6">
              <button
                type="button"
                onClick={goPrev}
                aria-label={locale === "ar" ? "السابق" : "Previous"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronLeft className={`h-5 w-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </button>
              <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
                {source.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`${locale === "ar" ? "انتقل إلى" : "Go to"} ${idx + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${idx === activeIndex ? "bg-white" : "bg-white/45"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goNext}
                aria-label={locale === "ar" ? "التالي" : "Next"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronRight className={`h-5 w-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </m.div>
      </div>
    )
  }

  if (loaded && items.length === 0) return null

  return (
    <section className="py-24 mds-tonal-layering-2">
      <div className="mx-auto max-w-screen-2xl px-8">
        <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-mds-on-background md:text-5xl">
              {t("marketing.productTitle")}
            </h2>
            <p className="max-w-lg text-mds-on-surface-variant">{t("marketing.productSubtitle")}</p>
          </m.div>
          <Link
            href="/services"
            className="flex items-center gap-2 text-sm font-bold text-mds-primary transition-transform hover:translate-x-0.5 rtl:hover:-translate-x-0.5"
          >
            {t("marketing.viewAllSystems")}
            <ArrowRight className={`h-5 w-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          {renderCarousel(bundles, bundleIndex, setBundleIndex, bundlesTitle)}
          {renderCarousel(services, serviceIndex, setServiceIndex, servicesTitle)}
        </div>
      </div>
    </section>
  )
}
