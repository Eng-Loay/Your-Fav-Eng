"use client"

import { m } from "framer-motion"
import Image from "next/image"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import {
  Target,
  Eye,
  Heart,
  Gem,
  Shield,
  Award,
  Headphones,
  Zap,
  HeartHandshake,
  GraduationCap,
  Users,
  Globe,
  Building2,
  Calendar,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { MEDEX_MARKETING_IMAGES } from "@/components/marketing/medex-marketing-images"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
}

const partners = [
  { name: "Python", origin: "Programming language", originAr: "لغة برمجة" },
  { name: "AI Basics", origin: "Machine learning intro", originAr: "مقدمة تعلم آلي" },
  { name: "Logic & Algorithms", origin: "Problem solving", originAr: "حل المشكلات" },
  { name: "Projects", origin: "Hands-on practice", originAr: "تطبيق عملي" },
]

export default function AboutPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const stats = [
    { icon: Calendar, value: isAr ? "2026" : "2026", labelEn: "Course launch", labelAr: "بداية الدورة" },
    { icon: GraduationCap, value: isAr ? "الصف الثاني" : "2nd Secondary", labelEn: "Target level", labelAr: "المرحلة المستهدفة" },
    { icon: Building2, value: isAr ? "برمجة وذكاء اصطناعي" : "Programming & AI", labelEn: "Subject", labelAr: "المادة" },
    { icon: Users, value: isAr ? "أونلاين" : "Online", labelEn: "Format", labelAr: "طريقة الدراسة" },
  ]

  const values = [
    {
      key: "mission",
      icon: Target,
      titleEn: "Our Mission",
      titleAr: "رسالتنا",
      descEn: "Make programming and AI concepts simple and practical for secondary students, without watering down the fundamentals.",
      descAr: "تبسيط مفاهيم البرمجة والذكاء الاصطناعي لطلاب المرحلة الثانوية بشكل عملي، من غير ما نفرّط في الأساسيات.",
      color: "bg-blue-50 text-mds-primary",
    },
    {
      key: "vision",
      icon: Eye,
      titleEn: "Our Vision",
      titleAr: "رؤيتنا",
      descEn: "To be the go-to teacher for students starting their journey in programming and artificial intelligence.",
      descAr: "نكون الوجهة الأولى للطلاب اللي بيبدأوا رحلتهم في البرمجة والذكاء الاصطناعي.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      key: "values",
      icon: Heart,
      titleEn: "Our Values",
      titleAr: "قيمنا",
      descEn: "Clarity over jargon, practice over theory, and real support for every student who asks a question.",
      descAr: "الوضوح قبل التعقيد، التطبيق قبل النظري، ودعم حقيقي لكل طالب بيسأل.",
      color: "bg-green-50 text-green-600",
    },
    {
      key: "goals",
      icon: Gem,
      titleEn: "Our Goals",
      titleAr: "أهدافنا",
      descEn: "Help students finish the course able to build real projects — not just pass an exam.",
      descAr: "نخلّي الطالب يخرج من الدورة قادر إنه يعمل مشاريع حقيقية، مش بس ينجح في امتحان.",
      color: "bg-purple-50 text-purple-600",
    },
  ]

  const whyChoose = [
    { key: "practical", icon: Award, titleEn: "Project-based learning", titleAr: "تعلّم بالمشاريع", descEn: "Every concept is tied to a real, hands-on project.", descAr: "كل مفهوم مربوط بمشروع عملي حقيقي." },
    { key: "support", icon: Shield, titleEn: "Direct support", titleAr: "دعم مباشر", descEn: "Questions get answered by the instructor, not a bot.", descAr: "الأسئلة بترد عليها المدرّس نفسه مش بوت." },
    { key: "education", icon: GraduationCap, titleEn: "Built for your level", titleAr: "مناسب لمستواك", descEn: "Content designed specifically for 2nd-year secondary students.", descAr: "محتوى مصمم خصيصًا لطلاب الصف الثاني الثانوي." },
    { key: "certificate", icon: Headphones, titleEn: "Certificate on completion", titleAr: "شهادة إتمام", descEn: "Finish the course with proof of what you learned.", descAr: "اخرج من الدورة بشهادة تثبت اللي اتعلمته." },
    { key: "practice", icon: Zap, titleEn: "Learn by doing", titleAr: "تعلّم بالممارسة", descEn: "Short, focused lessons followed by immediate practice.", descAr: "دروس قصيرة ومركزة يتبعها تطبيق فوري." },
    { key: "growth", icon: HeartHandshake, titleEn: "Long-term foundation", titleAr: "أساس طويل المدى", descEn: "Skills that carry into university and beyond, not just this year.", descAr: "مهارات هتفيدك في الجامعة ومش بس السنة دي." },
  ]

  const divisions = isAr
    ? ["بايثون", "الذكاء الاصطناعي", "المنطق والخوارزميات", "مشاريع عملية"]
    : ["Python", "AI Basics", "Logic & Algorithms", "Projects"]

  return (
    <main className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mds-primary to-[#0B2F8C] py-20 sm:py-28 lg:py-32">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />
        <div className="container relative mx-auto px-4 text-center">
          <m.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-white/70"
          >
            {isAr ? "عن المهندس لؤي عصام" : "About Eng. Loay Essam"}
          </m.span>
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl font-display mb-6"
          >
            {isAr ? "مهندسك المفضل في البرمجة والذكاء الاصطناعي" : "Your fav engineer in Programming & AI"}
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-white/80 leading-relaxed"
          >
            {isAr
              ? "أعلّم طلاب الصف الثاني الثانوي (بكالوريا) البرمجة والذكاء الاصطناعي بطريقة عملية وبسيطة"
              : "Teaching 2nd-year secondary (baccalaureate) students Programming & AI — practical, and kept simple"}
          </m.p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <m.div
                key={stat.labelEn}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-gray-200/60 p-4 sm:p-6 shadow-lg text-center overflow-hidden"
              >
                <stat.icon className="h-6 w-6 text-medex-red mx-auto mb-2" />
                <p className="text-base font-bold text-medex-dark font-medex leading-tight break-words sm:text-2xl lg:text-3xl">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 sm:text-sm">{isAr ? stat.labelAr : stat.labelEn}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Story */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            <m.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
                {isAr ? "القصة الكاملة" : "The Full Story"}
              </span>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl font-display">
                {isAr ? "قصة المهندس لؤي عصام" : "Eng. Loay Essam's story"}
              </h2>
              <div className="space-y-4 text-gray-500 leading-relaxed">
                {isAr ? (
                  <>
                    <p>
                      المهندس لؤي عصام مهندس متخصص في البرمجة والذكاء الاصطناعي، قرر يوجّه خبرته لخدمة طلاب المرحلة الثانوية اللي عايزين يبدأوا في المجال بشكل صح من أول يوم.
                    </p>
                    <p>
                      الدورة موجهة لطلاب الصف الثاني الثانوي (بكالوريا)، وبتغطي أساسيات البرمجة ومقدمة في الذكاء الاصطناعي بأسلوب مبسّط بعيد عن التعقيد الأكاديمي الزائد.
                    </p>
                    <p>
                      كل درس متبوع بتطبيق عملي، عشان الطالب يخرج بمهارة حقيقية مش بس معلومة نظرية.
                    </p>
                    <p>
                      الهدف: طالب يقدر يفكر ويحل مشاكل بالكود، ويكون عنده أساس قوي يبني عليه في الجامعة وبعدها.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Eng. Loay Essam is a programming and AI specialist who decided to put that experience into helping secondary school students start the field the right way from day one.
                    </p>
                    <p>
                      The course is built for 2nd-year secondary (baccalaureate) students, covering programming fundamentals and an introduction to AI — kept simple and free of unnecessary academic complexity.
                    </p>
                    <p>
                      Every lesson is paired with hands-on practice, so students leave with a real skill, not just theory.
                    </p>
                    <p>
                      The goal: students who can think and solve problems with code, and a strong foundation to build on at university and beyond.
                    </p>
                  </>
                )}
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl bg-gradient-to-br from-red-50 to-gray-50 p-8 sm:p-12 border border-gray-200/60">
                <div className="text-center mb-8">
                  <div className="relative mx-auto mb-4 h-48 w-full max-w-sm overflow-hidden rounded-2xl shadow-inner">
                    <Image
                      src={MEDEX_MARKETING_IMAGES.aboutSpotlight}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-medex-dark font-medex">Eng. Loay Essam</h3>
                  <p className="text-sm text-gray-400 mt-1">{isAr ? "برمجة · ذكاء اصطناعي · تعليم" : "Programming · AI · Education"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {divisions.map((div, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="rounded-xl bg-white border border-gray-200/60 p-4 text-center shadow-sm"
                    >
                      <p className="text-sm font-semibold text-medex-dark">{div}</p>
                    </m.div>
                  ))}
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values, Goals */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
              {isAr ? "ما يحركنا" : "What Drives Us"}
            </span>
            <h2 className="text-3xl font-bold text-medex-dark sm:text-4xl font-display">
              {isAr ? "أساسنا" : "Our Foundation"}
            </h2>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {values.map((item, i) => (
              <m.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-gray-200/60 p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-medex-red/20"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-medex-dark">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-mds-primary">
              {isAr ? "المحتوى" : "Curriculum"}
            </span>
            <h2 className="text-3xl font-bold text-medex-dark sm:text-4xl font-display">
              {isAr ? "هتتعلم إيه في الدورة" : "What you'll learn in the course"}
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-gray-500">
              {isAr ? "أساسيات مبنية بعضها على بعض، كل حاجة بتتطبق عمليًا" : "Fundamentals that build on each other, with hands-on practice at every step"}
            </p>
          </m.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {partners.map((partner, i) => (
              <m.div
                key={partner.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl bg-gray-50 border border-gray-200/60 p-5 text-center transition-all hover:shadow-md hover:border-medex-red/20 hover:-translate-y-0.5"
              >
                <p className="text-sm font-bold text-medex-dark">{partner.name}</p>
                <p className="text-xs text-gray-400 mt-1">{isAr ? partner.originAr : partner.origin}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Medex */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
              {isAr ? "مميزاتنا" : "Our Advantages"}
            </span>
            <h2 className="text-3xl font-bold text-medex-dark sm:text-4xl font-display">
              {isAr ? "ليه تختار المهندس لؤي عصام؟" : "Why choose Eng. Loay Essam?"}
            </h2>
          </m.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {whyChoose.map((item, i) => (
              <m.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-start gap-4 rounded-2xl bg-white border border-gray-200/60 p-6 shadow-sm transition-all hover:shadow-lg hover:border-medex-red/20"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-medex-red">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-medex-dark">{isAr ? item.titleAr : item.titleEn}</h3>
                  <p className="text-sm text-gray-500">{isAr ? item.descAr : item.descEn}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
