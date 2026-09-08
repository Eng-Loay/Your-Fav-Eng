"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  GraduationCap,
  Globe,
  Github,
  Chrome,
  User,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  School,
  Baby,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformBranding } from "@/hooks/use-platform-branding"
import { getDashboardPath } from "@/lib/utils"
import type { UserRole } from "@/lib/store"

const orbs = [
  { x: "15%", y: "20%", size: 350, color: "rgba(29, 40, 86, 0.22)", delay: 0, duration: 13 },
  { x: "70%", y: "65%", size: 300, color: "rgba(246, 84, 4, 0.20)", delay: 2, duration: 15 },
  { x: "45%", y: "10%", size: 220, color: "rgba(29, 40, 86, 0.14)", delay: 5, duration: 11 },
  { x: "90%", y: "40%", size: 180, color: "rgba(246, 84, 4, 0.12)", delay: 3, duration: 17 },
]

const floatingParticles = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 5,
}))

const features = [
  { icon: BookOpen, labelAr: "500+ دورة متاحة", labelEn: "500+ Courses" },
  { icon: Users, labelAr: "مجتمع 10K+ طالب", labelEn: "10K+ Community" },
  { icon: Award, labelAr: "شهادات معتمدة", labelEn: "Certified Diplomas" },
  { icon: TrendingUp, labelAr: "98% نسبة نجاح", labelEn: "98% Success Rate" },
]

const roleOptions: { value: UserRole; icon: typeof User; labelAr: string; labelEn: string; descAr: string; descEn: string; color: string; gradient: string }[] = [
  {
    value: "student",
    icon: GraduationCap,
    labelAr: "طالب",
    labelEn: "Student",
    descAr: "سجّل في الدورات وتعلّم مهارات جديدة",
    descEn: "Enroll in courses and learn new skills",
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    value: "parent",
    icon: Baby,
    labelAr: "ولي أمر",
    labelEn: "Parent",
    descAr: "تابع تقدم أطفالك ودرجاتهم",
    descEn: "Track your children's progress and grades",
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    value: "teacher",
    icon: School,
    labelAr: "مدرس",
    labelEn: "Teacher",
    descAr: "أنشئ محتوى تعليمي وتفاعل مع الطلاب",
    descEn: "Create educational content and interact with students",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
]

export default function RegisterPage() {
  const { t, locale, dir, setLocale } = useI18n()
  const { isLoggedIn, user, hydrated } = useStore()
  const { branding } = usePlatformBranding()
  const router = useRouter()
  const isRTL = dir === "rtl"

  useEffect(() => {
    if (hydrated && isLoggedIn && user) router.push(getDashboardPath(user.role))
  }, [hydrated, isLoggedIn, user, router])

  // Only student registration is enabled - parent, teacher are hidden
  const visibleRoleOptions = roleOptions.filter((r) => r.value === "student")

  return (
    <div className="relative flex min-h-screen" dir={dir}>
      {/* Full-screen animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0a0a12]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 80% 50%, rgba(29, 40, 86, 0.24) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 20% 30%, rgba(246, 84, 4, 0.18) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 80%, rgba(29, 40, 86, 0.12) 0%, transparent 45%)",
          }}
        />
        {orbs.map((orb, i) => (
          <m.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
              x: [0, i % 2 === 0 ? -40 : 40, 0],
              y: [0, i % 2 === 0 ? 30 : -30, 0],
            }}
            transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          />
        ))}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {floatingParticles.map((p) => (
          <m.div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
        <m.div
          className="absolute -top-[20%] end-[25%] h-[140%] w-px rotate-[-25deg] bg-gradient-to-b from-transparent via-[#1a1a2e]/15 to-transparent"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute -top-[20%] end-[55%] h-[140%] w-px rotate-[-25deg] bg-gradient-to-b from-transparent via-[#EB2D3C]/12 to-transparent"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      {/* Language Toggle */}
      <m.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className="fixed top-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        style={isRTL ? { left: 24 } : { right: 24 }}
      >
        <Globe className="h-4 w-4" />
        {locale === "ar" ? "English" : "العربية"}
      </m.button>

      {/* Left side - Branding */}
      <div className="relative hidden w-1/2 items-center justify-center lg:flex">
        <div className="relative z-10 px-14 text-center">
          <m.div className="relative mx-auto mb-10" style={{ width: 180, height: 180 }}>
            <m.div
              className="absolute inset-0 rounded-full border border-[#1a1a2e]/35"
              animate={{ rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute inset-4 rounded-full border border-dashed border-[#EB2D3C]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute inset-8 rounded-full border border-white/12"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logo} alt={branding.platformName} className="h-16 w-16 object-contain" />
              </div>
            </m.div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white">
              {locale === "ar" ? "انضم إلينا اليوم" : "Join Us Today"}
            </h1>
            <p className="mx-auto max-w-sm text-lg leading-relaxed text-white/50">
              {locale === "ar"
                ? "ابدأ رحلتك التعليمية مع آلاف الطلاب حول العالم"
                : "Start your learning journey with thousands of students worldwide"}
            </p>
          </m.div>

          <div className="mt-12 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {features.map((feat, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.12, duration: 0.5, ease: "backOut" }}
                whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.15)" }}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 backdrop-blur-sm transition-all"
              >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                  <feat.icon className="h-4.5 w-4.5 text-[#EB2D3C]" />
                </div>
                <span className="text-xs font-medium text-white/50">
                  {locale === "ar" ? feat.labelAr : feat.labelEn}
                </span>
              </m.div>
            ))}
          </div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-10 flex items-center justify-center gap-6"
          >
            {[
              { labelAr: "تسجيل مجاني", labelEn: "Free to Join" },
              { labelAr: "بدون بطاقة", labelEn: "No Card Required" },
              { labelAr: "إلغاء أي وقت", labelEn: "Cancel Anytime" },
            ].map((badge, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + i * 0.1 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                <span className="text-xs text-white/30">
                  {locale === "ar" ? badge.labelAr : badge.labelEn}
                </span>
              </m.div>
            ))}
          </m.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="relative z-10 flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
            <div className="pointer-events-none absolute -top-24 start-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#1a1a2e]/15 blur-[80px]" />
            <m.div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EB2D3C]/40 to-transparent"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Header */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-7 text-center"
            >
              <m.div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e]/25 to-[#EB2D3C]/25 lg:hidden"
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </m.div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                {locale === "ar" ? "اختر نوع الحساب" : "Choose Account Type"}
              </h1>
              <p className="text-sm text-white/40">
                {locale === "ar" ? "حدد دورك في المنصة للبدء" : "Select your role on the platform to get started"}
              </p>
            </m.div>

            <AnimatePresence mode="wait">
              {true && (
                <m.div
                  key="step1"
                  initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {visibleRoleOptions.map((role, i) => (
                    <Link key={role.value} href={`/register/${role.value}`}>
                      <m.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="group relative flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-start transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                      >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a2e]/30 to-[#EB2D3C]/20 transition-all group-hover:scale-105">
                        <role.icon className={`h-5 w-5 ${role.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white group-hover:text-white">
                          {locale === "ar" ? role.labelAr : role.labelEn}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {locale === "ar" ? role.descAr : role.descEn}
                        </p>
                      </div>
                      <ArrowRight className={`h-5 w-5 text-white/40 group-hover:text-[#EB2D3C] ${isRTL ? "rotate-180" : ""}`} />
                    </m.div>
                    </Link>
                  ))}

                </m.div>
              )}
            </AnimatePresence>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center text-sm text-white/35"
            >
              {t("auth.register.hasAccount")}{" "}
              <Link href="/login" className="font-semibold text-[#EB2D3C] transition-colors hover:text-[#ff4757]">
                {t("auth.register.login")}
              </Link>
            </m.p>
          </div>

          <m.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#1a1a2e] to-[#EB2D3C] opacity-60"
          />
        </m.div>
      </div>
    </div>
  )
}
