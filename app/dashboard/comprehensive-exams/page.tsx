"use client"

import { m } from "framer-motion"
import Link from "next/link"
import { FileQuestion, Loader2, ChevronRight, ChevronLeft, Clock, CheckCircle, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { safeStr } from "@/lib/utils"

export default function ComprehensiveExamsPage() {
  const { locale, dir, t } = useI18n()
  const isRTL = dir === "rtl"
  const isAr = locale === "ar"

  const { data, loading } = useApi(() => api.getComprehensiveExams())
  const exams = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []
  const list = exams as Array<{
    id: string
    title: string
    titleAr?: string
    course?: { title?: string; titleAr?: string }
    questionsCount?: number
    duration?: number
    passingScore?: number
    maxAttempts?: number
    myResult?: { score: number; passed: boolean; attempts: number } | null
  }>

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
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
            {t("dashboard.comprehensiveExams")}
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {isAr ? `لديك ${list.length} امتحان شامل متاح` : `${list.length} comprehensive exam(s) available`}
          </p>
        </div>
        <Link href="/dashboard/exam-results">
          <span className="text-sm font-semibold text-primary hover:underline">
            {t("dashboard.examResults")} →
          </span>
        </Link>
      </m.div>

      {list.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center"
        >
          <FileQuestion className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">
            {isAr ? "لا توجد امتحانات شاملة متاحة حالياً. سجّل في دورة لرؤية الامتحانات." : "No comprehensive exams available. Enroll in a course to see exams."}
          </p>
        </m.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((exam, i) => {
            const courseTitle = locale === "ar" ? (exam.course?.titleAr ?? exam.course?.title) : (exam.course?.title ?? exam.course?.titleAr)
            const examTitle = locale === "ar" ? (exam.titleAr ?? exam.title) : (exam.title ?? exam.titleAr)
            const result = exam.myResult
            const canRetake = !result || (exam.maxAttempts ?? 2) > (result.attempts ?? 0)

            return (
              <m.div
                key={exam.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
                    <FileQuestion className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  {result && (
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${result.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {result.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {result.passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#0F172A] mb-1">{safeStr(examTitle)}</h3>
                <p className="text-xs text-[#64748B] mb-3">{safeStr(courseTitle)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-[#94A3B8] mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {exam.duration ?? 60} {isAr ? "دقيقة" : "min"}
                  </span>
                  <span>•</span>
                  <span>{exam.questionsCount ?? 0} {isAr ? "أسئلة" : "questions"}</span>
                  {result && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-primary">{result.score?.toFixed(0)}%</span>
                    </>
                  )}
                </div>
                <Link href={canRetake ? `/dashboard/comprehensive-exams/${exam.id}` : "#"}>
                  <button
                    disabled={!canRetake}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      canRetake
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
                    }`}
                  >
                    {canRetake ? (isAr ? "أداء الامتحان" : "Take Exam") : (isAr ? "انتهت المحاولات" : "No attempts left")}
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </Link>
              </m.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
