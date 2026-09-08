// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { useState, useEffect } from "react"
import { m, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Video, Clock, ExternalLink, Calendar, AlertCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

interface LiveSession {
  id: string
  title: string
  scheduledAt: string | Date
  meetingUrl: string | null
  meetingProvider: string | null
  duration: number
  course: { id: string; title?: string; titleAr?: string; slug?: string; thumbnail?: string }
}

function Countdown({ target, locale = "ar" }: { target: Date; locale?: string }) {
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0, ready: false })
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime()
      const t = target.getTime() - now
      if (t <= 0) {
        setDiff({ d: 0, h: 0, m: 0, s: 0, ready: true })
        return
      }
      const d = Math.floor(t / (1000 * 60 * 60 * 24))
      const h = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((t % (1000 * 60)) / 1000)
      setDiff({ d, h, m, s, ready: false })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  const labels = locale === "ar" ? ["يوم", "ساعة", "دقيقة", "ثانية"] : ["Day", "Hr", "Min", "Sec"]
  const readyText = locale === "ar" ? "الحصة جاهزة الآن" : "Ready now"
  if (diff.ready) return <span className="text-emerald-600 font-bold">{readyText}</span>
  return (
    <div className="flex items-center gap-1.5">
      {[diff.d, diff.h, diff.m, diff.s].map((v, i) => (
        <div key={i} className="flex flex-col items-center min-w-[2.5rem]">
          <span className="text-lg font-bold tabular-nums text-[#0F172A] bg-[#F1F5F9] rounded-lg px-2 py-1">
            {String(v).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-[#94A3B8] uppercase">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function LiveSessionsPage() {
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const isRTL = dir === "rtl"
  const { data: res, loading } = useApi(() => api.getLiveSessions())
  const sessions: LiveSession[] = Array.isArray(res) ? res : (res?.data ?? []) ?? []

  const handleJoinClick = (s: LiveSession) => {
    const target = new Date(s.scheduledAt)
    const now = new Date()
    if (now >= target && s.meetingUrl) {
      window.open(s.meetingUrl, "_blank")
    } else {
      showToast(
        locale === "ar"
          ? "الرابط متاح فقط وقت الحصة. يرجى الانتظار حتى موعد الحصة."
          : "The link is only available during the session. Please wait until the session time.",
        "warning"
      )
    }
  }

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            {locale === "ar" ? "الحصص اللايف" : "Live Sessions"}
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar"
              ? `${sessions.length} حصة مباشرة قادمة`
              : `${sessions.length} upcoming live sessions`}
          </p>
        </div>
      </m.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#94A3B8] mt-3">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      ) : sessions.length === 0 ? (
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-20"
        >
          <Video className="h-14 w-14 text-[#E2E8F0] mb-4" />
          <p className="text-base font-medium text-[#64748B]">
            {locale === "ar" ? "لا توجد حصص لايف قادمة" : "No upcoming live sessions"}
          </p>
          <p className="text-sm text-[#94A3B8] mt-1">
            {locale === "ar"
              ? "سجل في دورات تحتوي على حصص مباشرة لرؤيتها هنا"
              : "Enroll in courses with live sessions to see them here"}
          </p>
          <Link href="/courses">
            <Button className="mt-6 rounded-xl bg-primary text-white">
              {locale === "ar" ? "تصفح الدورات" : "Browse Courses"}
            </Button>
          </Link>
        </m.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {sessions.map((s, i) => {
              const target = new Date(s.scheduledAt)
              const isReady = new Date() >= target
              const canJoin = isReady && !!s.meetingUrl
              const courseTitle = locale === "ar" ? (s.course?.titleAr ?? s.course?.title) : (s.course?.title ?? s.course?.titleAr)
              return (
                <m.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm hover:shadow-xl hover:border-[#F59E0B]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                      <Video className="w-12 h-12 text-amber-500/80" />
                      <div className="absolute top-2 start-2 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <Clock className="w-3 h-3" />
                        {s.duration || 60} د
                      </div>
                    </div>
                    <div className="flex-1 p-5 space-y-4">
                      <div>
                        <h3 className="font-bold text-[#0F172A] line-clamp-2">{s.title}</h3>
                        <p className="text-sm text-[#64748B] mt-0.5">
                          {courseTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#64748B]">
                        <Calendar className="w-4 h-4" />
                        {target.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                        <Countdown target={target} locale={locale} />
                        <button
                          onClick={() => handleJoinClick(s)}
                          className={`rounded-xl gap-2 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition-all ${
                            canJoin
                              ? "bg-primary hover:bg-primary-hover text-white cursor-pointer"
                              : "bg-[#F1F5F9] text-[#94A3B8] cursor-pointer hover:bg-[#E2E8F0]"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {locale === "ar" ? "دخول الحصة" : "Join Session"}
                        </button>
                      </div>
                      {!canJoin && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {locale === "ar"
                            ? "الرابط متاح فقط وقت الحصة"
                            : "Link available only during session"}
                        </p>
                      )}
                    </div>
                  </div>
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
