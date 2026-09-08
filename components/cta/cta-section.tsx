"use client"

import { useRef } from "react"
import { m, useInView } from "framer-motion"
import { ArrowRight, Shield, Award, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function FloatingShape({
  className,
  delay = 0,
}: {
  className: string
  delay?: number
}) {
  return (
    <m.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ willChange: "transform" }}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useI18n()

  return (
    <section ref={ref} className="py-14 sm:py-20 lg:py-28 px-4 bg-white">
      <m.div
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-mds-primary to-[#0B2F8C]"
        style={{ boxShadow: "0 0 80px rgba(19,69,214,0.15), 0 24px 48px -12px rgba(0,0,0,0.2)" }}
      >
        <FloatingShape className="w-64 h-64 bg-white/[0.06] -top-20 -start-20 blur-xl" delay={0} />
        <FloatingShape className="w-48 h-48 bg-white/[0.04] top-1/2 end-10 blur-lg" delay={1.5} />
        <FloatingShape className="w-32 h-32 bg-white/[0.03] bottom-10 start-1/3 blur-md" delay={3} />

        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center">
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium mb-8 border border-white/20"
          >
            <Shield className="w-4 h-4" />
            {t("marketing.ctaBadge")}
          </m.div>

          <m.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight font-display"
          >
            {t("marketing.ctaTitle")}
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t("marketing.ctaSubtitle")}
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="bg-white text-mds-primary hover:bg-gray-50 font-semibold px-8 shadow-xl group h-13">
              <Link href="/store" className="flex items-center gap-2">
                {t("marketing.ctaBrowseProducts")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 bg-transparent font-semibold px-8 backdrop-blur-sm h-13">
              <Link href="/register">
                {t("marketing.ctaCreateAccount")}
              </Link>
            </Button>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              {t("marketing.ctaTag1")}
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {t("marketing.ctaTag2")}
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {t("marketing.ctaTag3")}
            </span>
          </m.div>
        </div>
      </m.div>
    </section>
  )
}
