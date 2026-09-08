"use client"

import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { ArrowRight, GraduationCap, ShoppingBag } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { MEDEX_MARKETING_IMAGES } from "@/components/marketing/medex-marketing-images"

export function MarketingPrecisionHero() {
  const { locale, t, dir } = useI18n()
  const isAr = locale === "ar"

  return (
    <section className="relative flex min-h-0 items-center overflow-hidden mds-tonal-layering-1 pt-20 pb-12 sm:pt-24 sm:pb-16 lg:min-h-[720px] lg:pt-28 lg:pb-20" aria-labelledby="mds-hero-heading">
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <m.div
          className="relative z-10 lg:col-span-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <span className="mb-6 inline-block rounded-full bg-mds-secondary-container px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-mds-on-secondary-container">
            {t("marketing.heroBadge")}
          </span>
          <h1
            id="mds-hero-heading"
            className="mb-6 text-3xl font-extrabold leading-[1.05] tracking-tight text-mds-on-background sm:mb-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          >
            {isAr ? (
              <>
                <span className="block">{t("marketing.heroTitleBefore")}</span>
                <span className="text-mds-primary">{t("marketing.heroTitleHighlight")}</span>{" "}
                <span className="block">{t("marketing.heroTitleAfter")}</span>
              </>
            ) : (
              <>
                <span className="block">
                  {t("marketing.heroTitleBefore")} <br />
                  <span className="text-mds-primary">{t("marketing.heroTitleHighlight")}</span>{" "}
                  {t("marketing.heroTitleAfter")}
                </span>
              </>
            )}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-mds-on-surface-variant sm:mb-10 sm:text-lg lg:text-xl">
            {t("marketing.heroSubtitle")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/services"
              className="mds-hero-gradient flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-mds-primary/10 transition-transform hover:scale-[1.02] sm:w-auto sm:px-8 sm:py-4"
            >
              <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
              {t("marketing.exploreCatalog")}
              <ArrowRight className={`h-5 w-5 shrink-0 ${dir === "rtl" ? "rotate-180" : ""}`} aria-hidden />
            </Link>
            <Link
              href="/courses"
              className="flex w-full items-center justify-center rounded-md bg-mds-surface-container-lowest px-6 py-3.5 text-sm font-bold text-mds-primary transition-colors hover:bg-mds-surface-container-low sm:w-auto sm:px-8 sm:py-4"
            >
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="h-5 w-5" aria-hidden />
                {t("marketing.educationalPortal")}
              </span>
            </Link>
          </div>
        </m.div>

        <div className="relative lg:col-span-5">
          <div className="mds-hero-gradient absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-20 blur-3xl max-lg:right-0 sm:h-96 sm:w-96" />
          <m.div
            className="relative overflow-hidden rounded-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Image
              src={MEDEX_MARKETING_IMAGES.hero}
              alt=""
              width={800}
              height={960}
              className="aspect-[4/5] w-full max-h-[420px] object-cover object-[center_12%] sm:aspect-auto sm:max-h-none sm:h-[380px] sm:object-[center_18%] md:h-[480px] md:object-[center_22%] lg:h-[560px] lg:object-center xl:h-[600px]"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-mds-on-background/40 to-transparent" />
          </m.div>
        </div>
      </div>
    </section>
  )
}
