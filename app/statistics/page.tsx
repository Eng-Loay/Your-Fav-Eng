"use client"

import { m } from "framer-motion"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { useI18n } from "@/lib/i18n"
import { Users, Globe, BookOpen, Award, TrendingUp, Building2 } from "lucide-react"

const stats = [
  { icon: Users, value: "2,500+", label: "Active Members" },
  { icon: Globe, value: "45+", label: "Countries" },
  { icon: BookOpen, value: "120+", label: "Courses Delivered" },
  { icon: Award, value: "8,000+", label: "Certificates Issued" },
  { icon: TrendingUp, value: "95%", label: "Member Satisfaction" },
  { icon: Building2, value: "200+", label: "Corporate Partners" },
]

export default function StatisticsPage() {
  const { t } = useI18n()

  return (
    <main>
      <Navbar />
      <section className="mds-tonal-layering-1 pt-28 pb-16">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mds-tertiary">Statistics</p>
            <h1 className="mb-4 font-display text-4xl font-bold text-mds-on-background md:text-5xl">
              {t("marketing.statisticsTitle")}
            </h1>
            <p className="max-w-2xl text-lg text-mds-on-surface-variant">{t("marketing.statisticsSubtitle")}</p>
          </m.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, i) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border border-mds-outline-variant/30 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-mds-primary/10">
                  <stat.icon className="h-6 w-6 text-mds-primary" />
                </div>
                <p className="mb-1 font-display text-4xl font-bold text-mds-primary">{stat.value}</p>
                <p className="text-sm font-medium text-mds-on-surface-variant">{stat.label}</p>
              </m.div>
            ))}
          </div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 rounded-lg bg-mds-primary p-10 text-white md:p-14"
          >
            <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">Global GRC Leadership</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-white/85">
              The International Association for GRC Professionals is committed to raising standards in governance,
              risk management, and regulatory compliance. Our members lead organisations across financial services,
              healthcare, technology, and the public sector — equipped with the knowledge and credentials to navigate
              an increasingly complex regulatory environment.
            </p>
          </m.div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
