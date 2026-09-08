"use client"

import { lazy, Suspense } from "react"
import { Navbar } from "@/components/navbar/navbar"
import { MarketingPrecisionHero } from "@/components/marketing/marketing-precision-hero"
import { MarketingFeaturedProducts } from "@/components/marketing/marketing-featured-products"
import { MarketingMembershipPackages } from "@/components/marketing/marketing-membership-packages"
import { Footer } from "@/components/footer/footer"

const CTASection = lazy(() => import("@/components/cta/cta-section").then((m) => ({ default: m.CTASection })))

const SectionFallback = () => <div className="min-h-[300px] bg-white" aria-hidden />

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <MarketingPrecisionHero />
      <MarketingMembershipPackages />
      <Suspense fallback={<SectionFallback />}>
        <CTASection />
      </Suspense>
      <Footer />
    </main>
  )
}
