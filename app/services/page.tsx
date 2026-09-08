"use client"

import { MarketingMembershipPackages } from "@/components/marketing/marketing-membership-packages"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { useI18n } from "@/lib/i18n"
import { m } from "framer-motion"

export default function ServicesPage() {
  const { t } = useI18n()

  return (
    <main>
      <Navbar />
      <section className="mds-tonal-layering-1 pt-28 pb-8">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mds-tertiary">Services</p>
            <h1 className="mb-4 font-display text-4xl font-bold text-mds-on-background md:text-5xl">
              {t("nav.services")}
            </h1>
            <p className="max-w-2xl text-lg text-mds-on-surface-variant">{t("marketing.packagesSubtitle")}</p>
          </m.div>
        </div>
      </section>
      <MarketingMembershipPackages />
      <Footer />
    </main>
  )
}
