"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { ChevronLeft, Loader2, Clock, Send, AlertCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { safeStr } from "@/lib/utils"

type Question = {
  id: string
  question: string
  questionAr?: string | null
  type: string
  options?: string | null
  correctAnswer?: string | null
  points: number
}

type Option = { id?: string; text?: string; textAr?: string; isCorrect?: boolean }

function parseOptions(o: string | null | undefined): Option[] {
  if (!o) return []
  try {
    const arr = JSON.parse(o) as Option[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export default function TakeComprehensiveExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const { locale, dir } = useI18n()
  const isAr = locale === "ar"
  const isRTL = dir === "rtl"

  const { data, loading } = useApi(() => api.getComprehensiveExam(examId), { deps: [examId] })
  const exam = data && typeof data === "object" && "id" in data
    ? (data as {
        id: string
        title: string
        titleAr?: string
        duration?: number
        passingScore?: number
        questions?: Question[]
        existingResult?: { score: number; passed: boolean } | null
        course?: { title?: string; titleAr?: string }
      })
    : null

  const questions = exam?.questions ?? []
  const durationMinutes = exam?.duration ?? 60
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const answersRef = useRef(answers)
  answersRef.current = answers
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!exam || exam.existingResult) return
    setSecondsLeft(durationMinutes * 60)
    setStarted(true)
  }, [exam, durationMinutes])

  const handleSubmit = useCallback(async () => {
    if (!examId || submitting) return
    setSubmitting(true)
    try {
      const answerList = Object.entries(answersRef.current).map(([questionId, answer]) => ({ questionId, answer }))
      const res = await api.completeComprehensiveExam(examId, answerList)
      const d = res?.data ?? res
      const score = (d as { score?: number })?.score ?? 0
      const passed = (d as { passed?: boolean })?.passed ?? false
      const certId = (d as { certificateId?: string | null })?.certificateId ?? null
      const q = new URLSearchParams({ justCompleted: "1", score: String(score), passed: String(passed) })
      if (certId) q.set("certificateId", certId)
      router.push(`/dashboard/exam-results?${q.toString()}`)
    } catch {
      router.push("/dashboard/comprehensive-exams")
    } finally {
      setSubmitting(false)
    }
  }, [examId, router])

  useEffect(() => {
    if (!started || submitting || !exam || exam.existingResult) return
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [started, submitting, exam, handleSubmit])


  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (exam.existingResult) {
    return (
      <div dir={dir} className="max-w-2xl mx-auto text-center py-12">
        <p className="text-[#64748B] mb-4">
          {isAr ? "لقد أديت هذا الامتحان مسبقاً." : "You have already taken this exam."}
        </p>
        <p className="text-xl font-bold text-primary mb-2">
          {exam.existingResult.score?.toFixed(0)}% - {exam.existingResult.passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
        </p>
        <Link href="/dashboard/comprehensive-exams">
          <span className="text-primary hover:underline font-semibold">
            {isAr ? "← العودة للامتحانات" : "← Back to exams"}
          </span>
        </Link>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const opts = currentQ ? parseOptions(currentQ.options) : []

  return (
    <div dir={dir} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/comprehensive-exams" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> {isAr ? "العودة" : "Back"}
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className={`font-mono font-bold ${secondsLeft <= 300 ? "text-red-600" : "text-amber-700"}`}>
            {formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-all ${
                i === currentIndex
                  ? "bg-primary text-white"
                  : answers[questions[i]?.id]
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQ && (
          <m.div
            key={currentQ.id}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-[#0F172A]">
              {locale === "ar" ? (currentQ.questionAr ?? currentQ.question) : (currentQ.question ?? currentQ.questionAr)}
            </h3>

            {currentQ.type === "multiple_choice" && opts.length > 0 ? (
              <div className="space-y-2">
                {opts.map((opt) => {
                  const optId = String(opt.id ?? "")
                  const optText = locale === "ar" ? (opt.textAr ?? opt.text) : (opt.text ?? opt.textAr)
                  const isSelected = answers[currentQ.id] === optId
                  return (
                    <button
                      key={optId}
                      onClick={() => setAnswers((a) => ({ ...a, [currentQ.id]: optId }))}
                      className={`w-full text-start rounded-xl border-2 px-4 py-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-[#E2E8F0] hover:border-[#94A3B8]"
                      }`}
                    >
                      <span className="font-medium">{optId.toUpperCase()}.</span> {safeStr(optText)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea
                value={answers[currentQ.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [currentQ.id]: e.target.value }))}
                placeholder={isAr ? "اكتب إجابتك..." : "Type your answer..."}
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
          </m.div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-xl px-4 py-2 text-sm font-semibold border border-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F1F5F9]"
        >
          {isAr ? "السابق" : "Previous"}
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-hover"
          >
            {isAr ? "التالي" : "Next"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isAr ? "إنهاء وتسليم" : "Submit Exam"}
          </button>
        )}
      </div>

      {secondsLeft <= 300 && secondsLeft > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">
            {isAr ? "انتبه! أقل من 5 دقائق متبقية." : "Warning! Less than 5 minutes remaining."}
          </span>
        </div>
      )}
    </div>
  )
}
