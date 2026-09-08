"use client"

import { m } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Target, Eye, Heart, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export default function AboutPreviewSection() {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const cards = [
    {
      key: "mission",
      icon: Target,
      titleEn: "Our Mission",
      titleAr: "رسالتنا",
      descEn: "Educational support, digital branding, and social media that meet audiences on TikTok, Instagram, WhatsApp, and Telegram.",
      descAr: "دعم تعليمي وهوية رقمية وسوشيال ميديا تلتقي بالجمهور على تيك توك وإنستغرام وواتساب وتيليغرام.",
      color: "bg-red-50 text-medex-red",
      delay: 0.1,
    },
    {
      key: "vision",
      icon: Eye,
      titleEn: "Our Vision",
      titleAr: "رؤيتنا",
      descEn: "Be the creative partner brands trust for viral reach, visual polish, and real community—not just followers.",
      descAr: "أن نكون الشريك الإبداعي للوصول الفيروسي واللمسة البصرية ومجتمع حقيقي — لا مجرد متابعين.",
      color: "bg-blue-50 text-blue-600",
      delay: 0.2,
    },
    {
      key: "values",
      icon: Heart,
      titleEn: "Our Values",
      titleAr: "قيمنا",
      descEn: "Community first, creative integrity, and a consistent identity across every handle.",
      descAr: "المجتمع أولاً، نزاهة إبداعية، وهوية متسقة عبر كل الحسابات.",
      color: "bg-green-50 text-green-600",
      delay: 0.3,
    },
    {
      key: "goals",
      icon: Gem,
      titleEn: "Our Goals",
      titleAr: "أهدافنا",
      descEn: "Bridge entertainment feeds with utility channels so every touchpoint feels intentional.",
      descAr: "جسر خلاصات الترفيه بقنوات المنفعة لتكون كل نقطة اتصال مقصودة.",
      color: "bg-purple-50 text-purple-600",
      delay: 0.4,
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gray-50 py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-50/50 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <m.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
              {isAr ? "عن PDS Agency" : "About PDS Agency"}
            </span>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl lg:text-[2.5rem] font-display leading-tight">
              {isAr ? "مركز إبداعي بتوجه رقمي أولاً" : "A digital-first creative hub"}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              {isAr
                ? "PDS Agency تجمع بين الدعم التعليمي، وهوية العلامة الرقمية، وإدارة وسائل التواصل — من تيك توك وإنستغرام إلى واتساب وتيليغرام."
                : "PDS Agency blends educational support, digital branding, and social media—from TikTok and Instagram to WhatsApp and Telegram."}
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              {isAr
                ? "نركز على المجتمع والمحتوى الفيروسي والهوية المتسقة لجمهور يفكر تقنياً."
                : "We focus on community, viral-ready content, and a consistent visual identity for tech-savvy audiences."}
            </p>
            <Button
              asChild
              className="group rounded-xl bg-medex-red px-8 h-12 text-white font-semibold shadow-lg shadow-red-500/20 hover:bg-medex-red-dark"
            >
              <Link href="/about" className="flex items-center gap-2">
                {isAr ? "اعرف المزيد عنا" : "Learn More About Us"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </m.div>

          <div className="grid grid-cols-2 gap-4">
            {cards.map((item) => (
              <m.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: item.delay }}
                className="rounded-2xl bg-white border border-gray-200/60 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-medex-red/20"
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-bold text-medex-dark">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
