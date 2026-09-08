"use client"

import { m } from "framer-motion"
import Link from "next/link"
import { ArrowRight, GraduationCap, ShoppingBag, Users, Shield, Award, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export function MedexHeroSection() {
  const { locale, t, dir } = useI18n()
  const isAr = locale === "ar"
  const isRtl = dir === "rtl"

  const textReveal = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  }
  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  }

  const stats = [
    { value: "13+", label: isAr ? "سنوات الخبرة" : "Years Experience" },
    { value: "500+", label: isAr ? "المنتجات" : "Products" },
    { value: "50+", label: isAr ? "الشركاء" : "Partners" },
    { value: "1000+", label: isAr ? "العملاء السعداء" : "Happy Clients" },
  ]

  const sideCards = [
    { id: "implant", icon: ShoppingBag, label: isAr ? "أنظمة الزراعة" : "Implant Systems", sub: "B&B · Macros · Powerbone" },
    { id: "courses", icon: GraduationCap, label: isAr ? "دورات احترافية" : "Pro Courses", sub: isAr ? "ورش عمل وتدريب" : "Workshops & Training" },
    { id: "community", icon: Users, label: isAr ? "المجتمع" : "Community", sub: isAr ? "تواصل وشارك" : "Connect & Share" },
    { id: "brands", icon: Shield, label: isAr ? "علامات موثوقة" : "Trusted Brands", sub: isAr ? "5+ شركاء دوليين" : "5+ International Partners" },
  ]

  return (
    <section className="relative overflow-hidden bg-white" aria-labelledby="medex-hero-heading">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red-50/60 blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-red-50/40 blur-[80px] translate-y-1/3 -translate-x-1/4" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #EB2D3C 0.5px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative mx-auto flex min-h-[70vh] flex-col px-4 pb-10 pt-6 sm:min-h-[85vh] lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-20 lg:pt-12">
        {/* Left: Content */}
        <m.div
          className="relative z-10 flex-1 text-center lg:max-w-[55%] lg:text-start"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <m.div
            variants={textReveal}
            custom={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-medex-red/20 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-medex-red sm:text-sm"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            {isAr ? "حلول طب الأسنان الرائدة منذ 2011" : "Leading Dental Solutions Since 2011"}
          </m.div>

          <m.h1
            id="medex-hero-heading"
            variants={textReveal}
            custom={1}
            className="font-medex mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-medex-dark sm:text-5xl lg:text-[3.5rem] xl:text-6xl"
          >
            <span className="block">{isAr ? "شريكك الموثوق في " : "Your Trusted Partner in "}</span>
            <span className="block text-medex-red">{isAr ? "التميز في طب الأسنان" : "Dental Excellence"}</span>
          </m.h1>

          <m.p
            variants={textReveal}
            custom={2}
            className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg lg:mx-0"
          >
            {isAr
              ? "ميدكس هي شركة رائدة في مجال طب الأسنان في مصر والشرق الأوسط وأفريقيا — متخصصة في منتجات طب الأسنان المتميزة والدورات المهنية ومجتمع طب الأسنان المزدهر."
              : "MEDEX is a leading dental company in Egypt, the Middle East, and Africa — specializing in premium dental products, professional courses, and a thriving dental community."}
          </m.p>

          <m.div
            variants={textReveal}
            custom={3}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start"
          >
            <Button
              asChild
              size="lg"
              className="group relative h-12 w-full overflow-hidden rounded-xl bg-medex-red px-6 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-medex-red-dark sm:h-14 sm:w-auto sm:px-8 sm:text-base"
            >
              <Link href="/store" className="flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                {isAr ? "تسوق المنتجات" : "Shop Products"}
                <ArrowRight
                  className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:h-5 sm:w-5 ${isRtl ? "rotate-180 group-hover:-translate-x-0.5" : ""}`}
                  aria-hidden
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-6 text-sm font-semibold text-medex-dark transition hover:border-medex-red/30 hover:bg-red-50 sm:h-14 sm:w-auto sm:px-8 sm:text-base"
            >
              <Link href="/courses" className="flex items-center justify-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                {isAr ? "تصفح الدورات" : "Browse Courses"}
              </Link>
            </Button>
            <Link
              href="/dashboard/communities"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-medex-red transition hover:bg-red-50 hover:border-medex-red/20 sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:text-base sm:underline-offset-4 sm:hover:underline sm:hover:bg-transparent"
            >
              <Users className="h-4 w-4 mr-1.5" />
              {isAr ? "انضم للمجتمع" : "Join Community"}
            </Link>
          </m.div>

          {/* Stats */}
          <m.div
            variants={textReveal}
            custom={4}
            className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-100 pt-8 sm:grid-cols-4 lg:gap-8"
          >
            {stats.map((stat, i) => (
              <m.div
                key={`${stat.value}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="text-center lg:text-start"
              >
                <p className="text-2xl font-bold text-medex-red sm:text-3xl font-medex">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-gray-400 sm:text-sm">{stat.label}</p>
              </m.div>
            ))}
          </m.div>
        </m.div>

        {/* Right: Visual */}
        <m.div
          initial={{ opacity: 0, x: isRtl ? -48 : 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative mt-12 hidden flex-1 flex-col items-center justify-center lg:mt-0 lg:flex lg:max-w-[43%]"
        >
          <div className="relative w-full max-w-[480px]">
            {/* Main card */}
            <m.div
              className="relative rounded-3xl bg-gradient-to-br from-medex-red to-red-700 p-8 shadow-2xl shadow-red-500/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="absolute inset-0 rounded-3xl opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)`,
                backgroundSize: "20px 20px",
              }} />
              <div className="relative space-y-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medex text-lg font-bold">{isAr ? "جودة متميزة" : "Premium Quality"}</p>
                    <p className="text-sm text-white/70">{isAr ? "منتجات معتمدة ISO" : "ISO Certified Products"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {sideCards.map((item, i) => (
                    <m.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/10"
                    >
                      <item.icon className="h-5 w-5 mb-2 text-white/80" />
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-[11px] text-white/60 mt-0.5">{item.sub}</p>
                    </m.div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm" />
                    ))}
                  </div>
                  <div className="ml-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">{isAr ? "موثوق من 1000+ طبيب" : "Trusted by 1000+ doctors"}</p>
                  </div>
                </div>
              </div>
            </m.div>

            {/* Floating badges */}
            <m.div
              className="absolute -top-4 -right-4 rounded-2xl bg-white p-3 shadow-xl border border-gray-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-medex-dark">{isAr ? "معتمد الجودة" : "Quality Certified"}</p>
                  <p className="text-[10px] text-gray-400">{isAr ? "معايير ISO" : "ISO Standards"}</p>
                </div>
              </div>
            </m.div>

            <m.div
              className="absolute -bottom-4 -left-4 rounded-2xl bg-white p-3 shadow-xl border border-gray-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-medex-dark">{isAr ? "تدريب مهني" : "Professional Training"}</p>
                  <p className="text-[10px] text-gray-400">{isAr ? "دورات بإشراف خبراء" : "Expert-Led Courses"}</p>
                </div>
              </div>
            </m.div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
