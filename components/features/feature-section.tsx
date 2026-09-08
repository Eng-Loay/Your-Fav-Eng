"use client"

import { m } from "framer-motion"
import { Award, HeartHandshake, Headphones, Shield, Zap, GraduationCap } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const featuresData = [
  {
    key: "premium",
    icon: Award,
    titleEn: "Multi-channel reach",
    titleAr: "وصول متعدد القنوات",
    descEn: "TikTok & Instagram for discovery; WhatsApp & Telegram for depth, files, and community announcements.",
    descAr: "تيك توك وإنستغرام للاكتشاف؛ واتساب وتيليغرام للعمق والملفات وإعلانات المجتمع.",
    color: "bg-red-50 text-medex-red",
  },
  {
    key: "quality",
    icon: Shield,
    titleEn: "Professional branding",
    titleAr: "هوية احترافية",
    descEn: "A unified visual language so every post, story, and thumbnail feels unmistakably yours.",
    descAr: "لغة بصرية موحدة بحيث تبدو كل منشور وقصة وصورة مصغرة واضحة الانتماء لعلامتك.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "training",
    icon: GraduationCap,
    titleEn: "Educational support",
    titleAr: "دعم تعليمي",
    descEn: "Courses and resources that help your audience grow alongside your brand.",
    descAr: "دورات وموارد تساعد جمهورك على النمو مع علامتك.",
    color: "bg-green-50 text-green-600",
  },
  {
    key: "support",
    icon: Headphones,
    titleEn: "Direct engagement",
    titleAr: "تفاعل مباشر",
    descEn: "Real-time updates and two-way energy on the channels your followers already use daily.",
    descAr: "تحديثات فورية وتفاعل على القنوات التي يستخدمها متابعوك يومياً.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "prices",
    icon: Zap,
    titleEn: "Viral-ready content",
    titleAr: "محتوى جاهز للترند",
    descEn: "Short-form creative tuned for younger, scroll-first audiences.",
    descAr: "إبداع قصير الشكل مضبوط لجمهور يفضل التمرير والجوال.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "client",
    icon: HeartHandshake,
    titleEn: "Community first",
    titleAr: "المجتمع أولاً",
    descEn: "We build loyal audiences—not just one-time transactions.",
    descAr: "نبني جمهوراً وفيّاً — لا معاملات لحظية فقط.",
    color: "bg-teal-50 text-teal-600",
  },
]

export default function FeatureSection() {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-red-50/50 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-blue-50/50 blur-[80px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center lg:mb-20"
        >
          <m.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red"
          >
            {isAr ? "لماذا PDS؟" : "Why PDS?"}
          </m.span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl lg:text-5xl font-display">
            {isAr ? "شريكك في النمو الرقمي والتعلم" : "Your partner for digital growth & learning"}
          </h2>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
            {isAr ? "محتوى مرئي، تعليم عملي، ومجتمع نشط عبر المنصات التي يحبها جمهورك" : "Striking visuals, practical education, and active community on the platforms your audience loves"}
          </p>
        </m.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, i) => {
            const Icon = feature.icon
            return (
              <m.div
                key={feature.key}
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-medex-red/20"
              >
                <m.div
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "backOut" }}
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7" />
                </m.div>

                <m.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.04 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="pointer-events-none absolute end-4 top-4 select-none text-6xl sm:text-7xl font-black text-medex-dark"
                >
                  0{i + 1}
                </m.span>

                <h3 className="mb-2 text-lg font-bold text-medex-dark sm:text-xl">{isAr ? feature.titleAr : feature.titleEn}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{isAr ? feature.descAr : feature.descEn}</p>

                <m.div
                  className="absolute bottom-0 start-0 h-[2px] bg-gradient-to-r from-medex-red/40 via-medex-red/20 to-transparent"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                />
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
