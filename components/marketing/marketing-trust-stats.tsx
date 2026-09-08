"use client"

import { m } from "framer-motion"
import { useI18n } from "@/lib/i18n"

const STATS = [
  { value: "4", suffix: "+", labelKey: "trustChannels" as const },
  { value: "15", suffix: "k+", labelKey: "trustCommunity" as const },
  { value: "200", suffix: "+", labelKey: "trustCampaigns" as const },
  { value: "24", suffix: "/7", labelKey: "trustAlwaysOn" as const },
]

export function MarketingTrustStats() {
  const { t } = useI18n()

  return (
    <section className="py-24 mds-tonal-layering-3">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-12 text-center md:grid-cols-4">
          {STATS.map((s, i) => (
            <m.div
              key={s.labelKey}
              className="group"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-2 text-5xl font-extrabold tracking-tighter text-mds-primary md:text-7xl">
                {s.value}
                <span className="text-2xl">{s.suffix}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-mds-on-surface-variant">
                {t(`marketing.${s.labelKey}`)}
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
