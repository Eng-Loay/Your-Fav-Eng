"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/hooks/use-api"
import { m, AnimatePresence } from "framer-motion"
import {
  GraduationCap,
  Mail,
  Lock,
  Globe,
  ArrowLeft,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const { t, locale, dir, setLocale } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRTL = dir === "rtl"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await api.forgotPassword(email.trim())
      if (res.success) {
        setSent(true)
      } else {
        setError(res.message || (locale === "ar" ? "حدث خطأ" : "Something went wrong"))
      }
    } catch {
      setError(locale === "ar" ? "خطأ في الشبكة" : "Network error")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden"
      dir={dir}
    >
      {/* Rich Animated Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 75% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 55%), linear-gradient(180deg, #FAFBFC 0%, #F0F4FA 100%)" }} />
        <m.div
          className="absolute -top-32 -right-20 h-[500px] w-[500px] rounded-full bg-primary/[0.08] blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4], x: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute -bottom-20 -left-20 h-[450px] w-[450px] rounded-full bg-primary/[0.07] blur-[100px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {Array.from({ length: 10 }).map((_, i) => (
          <m.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{ left: `${10 + i * 9}%`, top: `${5 + (i * 11) % 90}%`, width: 2 + (i % 3), height: 2 + (i % 3) }}
            animate={{ y: [0, -25, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(37, 99, 235, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        <svg className="absolute inset-0 hidden h-full w-full lg:block" style={{ opacity: 0.05 }}>
          <m.line x1="8%" y1="25%" x2="92%" y2="75%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="8 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }} />
          <m.line x1="88%" y1="20%" x2="12%" y2="80%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="8 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: 1, ease: "easeInOut" }} />
        </svg>
      </div>

      {/* Language Toggle */}
      <button
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className="fixed top-6 z-50 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
        style={isRTL ? { left: 24 } : { right: 24 }}
      >
        <Globe className="h-4 w-4" />
        {locale === "ar" ? "English" : "العربية"}
      </button>

      {/* Card */}
      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm sm:p-10"
      >
        <AnimatePresence mode="wait">
          {!sent ? (
            <m.div
              key="form"
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Brand */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/25">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {locale === "ar" ? "المهندس لؤي عصام" : "Eng. Loay Essam"}
                </span>
              </div>

              {/* Lock Icon */}
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {t("auth.forgot.title")}
                </h1>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {t("auth.forgot.subtitle")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.forgot.email")}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 start-3" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.forgot.email")}
                      className="ps-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
                >
                  {sending ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") : t("auth.forgot.button")}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
                >
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  {t("auth.forgot.backToLogin")}
                </Link>
              </div>
            </m.div>
          ) : (
            <m.div
              key="success"
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Brand */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/25">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
              </div>

              {/* Success Icon */}
              <div className="flex justify-center">
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50"
                >
                  <Mail className="h-10 w-10 text-green-500" />
                </m.div>
              </div>

              {/* Success Message */}
              <div className="text-center space-y-2">
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-lg font-semibold text-gray-900">
                    {t("auth.forgot.sent")}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {email}
                  </p>
                </m.div>
              </div>

              {/* Actions */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setSent(false)}
                >
                  {t("auth.forgot.button")}
                </Button>

                <div className="flex justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
                  >
                    <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                    {t("auth.forgot.backToLogin")}
                  </Link>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </div>
  )
}
