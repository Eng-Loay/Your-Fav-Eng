"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { ArrowRight, BookOpen, Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { getMembershipPackageImage, MEMBERSHIP_PACKAGE_IMAGES } from "@/lib/membership-package-images"
import { portraitAwareObjectClass } from "@/lib/brand-assets"

interface MembershipPackage {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  price: number
  currency: string
  courseCount: number
  level?: string
  duration: string
  image?: string
}

export function MarketingMembershipPackages() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const { formatCurrency } = usePlatformCurrency()
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getMembershipPackages()
      .then((res) => {
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : []
        setPackages(list)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoaded(true) })
    return () => { mounted = false }
  }, [])

  if (loaded && packages.length === 0) return null

  return (
    <section className="py-12 sm:py-16 lg:py-24 mds-tonal-layering-2" id="packages">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mds-tertiary">
              {t("marketing.packagesTitle")}
            </p>
            <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-mds-on-background md:text-5xl">
              {t("marketing.productTitle")}
            </h2>
            <p className="max-w-xl text-lg text-mds-on-surface-variant">{t("marketing.packagesSubtitle")}</p>
          </m.div>
          <Link
            href="/services"
            className="flex items-center gap-2 text-sm font-semibold text-mds-primary hover:underline"
          >
            {t("marketing.viewAllSystems")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(packages.length > 0 ? packages : [
            {
              id: "1",
              title: "Programming & AI Course",
              titleAr: "دورة البرمجة والذكاء الاصطناعي",
              description: "A Programming & AI course for 2nd-year secondary (baccalaureate) students, taught by Eng. Loay Essam.",
              descriptionAr: "دورة في البرمجة والذكاء الاصطناعي لطلاب الصف الثاني الثانوي (بكالوريا)، مع المهندس لؤي عصام.",
              price: 800,
              currency: "EGP",
              courseCount: 4,
              level: "Full Course",
              duration: "Monthly",
              image: MEMBERSHIP_PACKAGE_IMAGES.Associate,
            },
          ]).map((pkg, i) => {
            const imageSrc = getMembershipPackageImage(pkg)
            const displayTitle = (isAr && pkg.titleAr) || pkg.title
            const displayDescription = (isAr && pkg.descriptionAr) || pkg.description
            return (
            <m.article
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group flex flex-col overflow-hidden rounded-lg border border-mds-outline-variant/30 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={displayTitle}
                  fill
                  unoptimized
                  className={`${portraitAwareObjectClass(imageSrc)} transition-transform duration-300 group-hover:scale-105`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                {pkg.level && (
                  <span className="mb-2 text-xs font-bold uppercase tracking-wider text-mds-tertiary">{pkg.level}</span>
                )}
                <h3 className="mb-2 text-xl font-bold text-mds-on-background">{displayTitle}</h3>
                {displayDescription && (
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-mds-on-surface-variant">{displayDescription}</p>
                )}
                <div className="mb-4 flex flex-wrap gap-3 text-sm text-mds-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-mds-primary" />
                    {pkg.courseCount} {t("marketing.courseCount")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-mds-primary" />
                    {pkg.duration === "Monthly" ? t("marketing.monthly") : pkg.duration === "Annual" ? t("marketing.annual") : pkg.duration || t("marketing.annual")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-mds-outline-variant/20 pt-4">
                  <span className="text-2xl font-bold text-mds-primary">
                    {pkg.price > 0 ? formatCurrency(pkg.price) : "Contact us"}
                  </span>
                  <Link
                    href="/contact"
                    className="rounded-md bg-mds-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {t("marketing.partnerPortal")}
                  </Link>
                </div>
              </div>
            </m.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
