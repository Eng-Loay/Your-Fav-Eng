"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { m } from "framer-motion"
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Github,
  Chrome,
  Sparkles,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
  Phone,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformBranding } from "@/hooks/use-platform-branding"
import { IAGRCP_BRAND } from "@/lib/brand-assets"
import type { UserRole } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const orbs = [
  { x: "10%", y: "15%", size: 320, color: "rgba(139, 26, 26, 0.15)", delay: 0, duration: 12 },
  { x: "75%", y: "70%", size: 280, color: "rgba(107, 20, 20, 0.12)", delay: 3, duration: 14 },
  { x: "50%", y: "40%", size: 200, color: "rgba(165, 42, 42, 0.08)", delay: 6, duration: 10 },
  { x: "85%", y: "10%", size: 160, color: "rgba(139, 26, 26, 0.06)", delay: 2, duration: 16 },
]

const floatingParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 5,
}))

const formFieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

function LoginPageInner() {
  const { t, locale, dir, setLocale } = useI18n()
  const { login, isLoggedIn, user } = useStore()
  const { branding } = usePlatformBranding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  const [identifier, setIdentifier] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [error, setError] = useState("")

  const getDashboardPath = (role?: UserRole) => {
    switch (role) {
      case "admin": return "/admin"
      case "teacher": return "/teacher-dashboard"
      case "parent": return "/parent-dashboard"
      default: return "/dashboard"
    }
  }

  useEffect(() => {
    if (isLoggedIn && user) {
      const redirectTo = searchParams.get("redirect")
      const allowedRedirects = ["/admin", "/teacher-dashboard", "/parent-dashboard", "/dashboard"]
      if (redirectTo && allowedRedirects.some((p) => redirectTo.startsWith(p))) {
        const valid =
          (user.role === "admin" && redirectTo.startsWith("/admin")) ||
          (user.role === "teacher" && redirectTo.startsWith("/teacher-dashboard")) ||
          (user.role === "parent" && redirectTo.startsWith("/parent-dashboard")) ||
          (user.role === "student" && redirectTo.startsWith("/dashboard"))
        if (valid) {
          router.push(redirectTo)
          return
        }
      }
      router.push(getDashboardPath(user.role))
    }
  }, [isLoggedIn, user, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const loginId = authMethod === "email" ? email : identifier
    if (!loginId) {
      setError(
        authMethod === "email"
          ? (locale === "ar" ? "البريد الإلكتروني مطلوب" : "Email is required")
          : (locale === "ar" ? "رقم الهاتف مطلوب" : "Phone number is required")
      )
      return
    }
    const success = await login(loginId, password)
    if (!success) {
      setError(locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials")
    }
  }

  const isRTL = dir === "rtl"

  return (
    <div className="relative flex min-h-screen" dir={dir}>
      {/* Full-screen animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0a0a12]">
        {/* Gradient mesh */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(37, 99, 235, 0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 30%, rgba(14, 165, 233, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 45%)",
          }}
        />
        {/* Animated orbs */}
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
              x: [0, i % 2 === 0 ? 40 : -40, 0],
              y: [0, i % 2 === 0 ? -30 : 30, 0],
            }}
            transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          />
        ))}
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Floating particles */}
        {floatingParticles.map((p) => (
          <m.div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
        {/* Diagonal beams */}
        <m.div
          className="absolute -top-[20%] start-[30%] h-[140%] w-px rotate-[25deg] bg-gradient-to-b from-transparent via-[#1a1a2e]/15 to-transparent"
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute -top-[20%] start-[60%] h-[140%] w-px rotate-[25deg] bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
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
        <div className="relative z-10 px-16 text-center">
          {/* Animated ring */}
          <m.div
            className="relative mx-auto mb-10"
            style={{ width: 160, height: 160 }}
          >
            {/* Scholigo logo orbit */}
            <m.div
              className="absolute inset-0 rounded-full border border-[#1a1a2e]/35"
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute inset-3 rounded-full border border-dashed border-[#1345D6]/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute inset-6 rounded-full border border-white/12"
              animate={{ rotate: 360 }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            />
            {/* Center logo */}
            <m.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logo} alt={branding.platformName} className="h-16 w-16 object-contain" />
              </div>
            </m.div>
          </m.div>

          {/* Brand text */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
              {branding.platformName}
            </h1>
            <p className="mx-auto max-w-sm text-lg leading-relaxed text-white/50">
              {locale === "ar" ? IAGRCP_BRAND.taglineAr : IAGRCP_BRAND.tagline}
            </p>
          </m.div>

          {/* Features row */}
          <div className="mt-12 flex items-center justify-center gap-8">
            {[
              { icon: BookOpen, labelAr: "دورات برمجة وذكاء اصطناعي", labelEn: "Programming & AI Courses" },
              { icon: Zap, labelAr: "تدريب عملي", labelEn: "Hands-on Training" },
              { icon: Shield, labelAr: "مجتمع متعلمين", labelEn: "Learner Community" },
            ].map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <item.icon className="h-5 w-5 text-[#1345D6]" />
                </div>
                <span className="text-xs font-medium text-white/40">
                  {locale === "ar" ? item.labelAr : item.labelEn}
                </span>
              </m.div>
            ))}
          </div>

          {/* Stats */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-14 flex items-center justify-center gap-10"
          >
            {[
              { value: "500+", labelAr: "أعضاء", labelEn: "Members" },
              { value: "50+", labelAr: "دورات", labelEn: "Courses" },
              { value: "Global", labelAr: "شبكة عالمية", labelEn: "Network" },
            ].map((stat, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/30">
                  {locale === "ar" ? stat.labelAr : stat.labelEn}
                </div>
              </m.div>
            ))}
          </m.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="relative z-10 flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Glass card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
            {/* Card glow */}
            <div className="pointer-events-none absolute -top-24 start-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#1a1a2e]/15 blur-[80px]" />

            {/* Top shimmer */}
            <m.div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1345D6]/40 to-transparent"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Header */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 text-center"
            >
              <m.div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-primary/20 lg:hidden"
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </m.div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                {t("auth.login.title")}
              </h1>
              <p className="text-sm text-white/40">{t("auth.login.subtitle")}</p>
            </m.div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Auth method toggle */}
              <m.div custom={0} variants={formFieldVariants} initial="hidden" animate="visible" className="flex rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authMethod === "email"
                      ? "bg-[#1a1a2e]/20 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authMethod === "phone"
                      ? "bg-[#1a1a2e]/20 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {locale === "ar" ? "رقم الهاتف" : "Phone"}
                </button>
              </m.div>

              {/* Email / Phone field */}
              {authMethod === "email" ? (
                <m.div custom={0.5} variants={formFieldVariants} initial="hidden" animate="visible" className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/60">
                    {t("auth.login.email")}
                  </Label>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
                        focusedField === "email" ? "text-[#1345D6]" : "text-white/25"
                      }`}
                    />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t("auth.login.email")}
                      className="h-12 border-white/[0.08] bg-white/[0.03] ps-11 text-white placeholder:text-white/20 transition-all duration-300 focus:border-[#1345D6]/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#1345D6]/25"
                    />
                    {focusedField === "email" && (
                      <m.div
                        layoutId="field-glow"
                        className="pointer-events-none absolute inset-0 rounded-md border border-[#1345D6]/35"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </div>
                </m.div>
              ) : (
                <m.div custom={0.5} variants={formFieldVariants} initial="hidden" animate="visible" className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-white/60">
                    {locale === "ar" ? "رقم الهاتف" : "Phone Number"}
                  </Label>
                  <div className="relative">
                    <Phone
                      className={`pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
                        focusedField === "phone" ? "text-[#1345D6]" : "text-white/25"
                      }`}
                    />
                    <Input
                      id="phone"
                      type="tel"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={locale === "ar" ? "+966 5XX XXX XXXX" : "+1 (555) 000-0000"}
                      className="h-12 border-white/[0.08] bg-white/[0.03] ps-11 text-white placeholder:text-white/20 transition-all duration-300 focus:border-[#1345D6]/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#1345D6]/25"
                      dir="ltr"
                    />
                    {focusedField === "phone" && (
                      <m.div
                        layoutId="field-glow"
                        className="pointer-events-none absolute inset-0 rounded-md border border-[#1345D6]/35"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </div>
                </m.div>
              )}

              {/* Password */}
              <m.div custom={1} variants={formFieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/60">
                  {t("auth.login.password")}
                </Label>
                <div className="relative">
                  <Lock
                    className={`pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === "password" ? "text-[#1345D6]" : "text-white/25"
                    }`}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t("auth.login.password")}
                    className="h-12 border-white/[0.08] bg-white/[0.03] pe-11 ps-11 text-white placeholder:text-white/20 transition-all duration-300 focus:border-[#1345D6]/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#1345D6]/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </m.div>

              {/* Remember + Forgot */}
              <m.div
                custom={2}
                variants={formFieldVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="border-white/20 data-[state=checked]:bg-[#1a1a2e] data-[state=checked]:border-[#1a1a2e]"
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-white/40">
                    {t("auth.login.remember")}
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[#1345D6] transition-colors hover:text-[#3D74F2]"
                >
                  {t("auth.login.forgot")}
                </Link>
              </m.div>

              {error && (
                <m.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 font-medium text-center bg-red-50 rounded-xl py-2.5 px-4 border border-red-100">
                  {error}
                </m.p>
              )}

              {/* Submit */}
              <m.div custom={3} variants={formFieldVariants} initial="hidden" animate="visible">
                <Button
                  type="submit"
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#1345D6] text-base font-semibold text-white shadow-lg shadow-[#1a1a2e]/35 transition-all hover:shadow-xl hover:shadow-[#1a1a2e]/40"
                >
                  <m.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {t("auth.login.button")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </Button>
              </m.div>
            </form>

            {/* Divider */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative my-7 flex items-center gap-4"
            >
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-xs text-white/35">{t("auth.login.orWith")}</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </m.div>

            {/* Social */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 gap-3"
            >
              <button className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
                <Chrome className="h-5 w-5" />
                Google
              </button>
              <button className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
                <Github className="h-5 w-5" />
                GitHub
              </button>
            </m.div>

            {/* Register link */}
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-7 text-center text-sm text-white/35"
            >
              {t("auth.login.noAccount")}{" "}
              <Link href="/register" className="font-semibold text-[#1345D6] transition-colors hover:text-[#3D74F2]">
                {t("auth.login.register")}
              </Link>
            </m.p>
          </div>

          {/* Bottom accent */}
          <m.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#1a1a2e] to-[#1345D6] opacity-60"
          />
        </m.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">...</div></div>}>
      <LoginPageInner />
    </Suspense>
  )
}
