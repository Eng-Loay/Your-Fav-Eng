"use client"

import { useSearchParams } from "next/navigation"
import { m } from "framer-motion"
import Link from "next/link"
import { ClipboardList, Loader2, CheckCircle, XCircle, Award } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { safeStr } from "@/lib/utils"

export default function ExamResultsPage() {
  const searchParams = useSearchParams()
  const justCompleted = searchParams.get("justCompleted") === "1"
  const scoreParam = searchParams.get("score")
  const passedParam = searchParams.get("passed")
  const certificateId = searchParams.get("certificateId")

  const { locale, dir, t } = useI18n()
  const isRTL = dir === "rtl"
  const isAr = locale === "ar"

  const { data, loading } = useApi(() => api.getMyComprehensiveExamResults())
  const results = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []
  const list = results as Array<{
    id: string
    score: number
    passed: boolean
    attempts: number
    createdAt: string
    comprehensiveExam?: { id: string; title?: string; titleAr?: string; course?: { title?: string; titleAr?: string } }
  }>

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const showJustCompleted = justCompleted && scoreParam && passedParam
  const scoreNum = parseFloat(scoreParam ?? "0")
  const passed = passedParam === "true"
  const hasCertificate = !!certificateId

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            {t("dashboard.examResults")}
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {isAr ? `نتائج ${list.length} امتحان` : `${list.length} exam result(s)`}
          </p>
        </div>
        <Link href="/dashboard/comprehensive-exams">
          <span className="text-sm font-semibold text-primary hover:underline">
            ← {t("dashboard.comprehensiveExams")}
          </span>
        </Link>
      </m.div>

      {showJustCompleted && (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={`rounded-2xl border-2 p-6 overflow-hidden ${
            passed
              ? "border-emerald-300 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
              : "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
          }`}
        >
          {passed && (
            <m.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <m.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </m.div>
            </m.div>
          )}
          <div className="flex flex-col items-center text-center">
            <m.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-2xl font-bold mb-2 ${passed ? "text-emerald-700" : "text-[#0F172A]"}`}
            >
              {passed
                ? (isAr ? "مبروك! نجحت في الامتحان 🎉" : "Congratulations! You passed! 🎉")
                : (isAr ? "تم تسليم الامتحان" : "Exam submitted")}
            </m.h3>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-extrabold text-primary mb-1"
            >
              {scoreNum.toFixed(0)}%
            </m.p>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-[#64748B] mb-4"
            >
              {passed
                ? (isAr ? "لقد حصلت على الشهادة بنجاح." : "You've earned your certificate.")
                : (isAr ? "للأسف لم تنجح. يمكنك المحاولة مرة أخرى إن توفرت محاولات." : "Unfortunately you didn't pass. You can retry if attempts are available.")}
            </m.p>
            {hasCertificate && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/dashboard/certificates"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Award className="w-5 h-5" />
                  {isAr ? "مشاهدة الشهادة" : "View Certificate"}
                </Link>
              </m.div>
            )}
          </div>
        </m.div>
      )}

      {list.length === 0 && !showJustCompleted ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center"
        >
          <ClipboardList className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">
            {isAr ? "لا توجد نتائج امتحانات بعد. أدِ امتحاناً شاملاً أولاً." : "No exam results yet. Take a comprehensive exam first."}
          </p>
          <Link href="/dashboard/comprehensive-exams">
            <span className="inline-block mt-4 text-primary font-semibold hover:underline">
              {isAr ? "الذهاب للامتحانات" : "Go to exams"} {isRTL ? "←" : "→"}
            </span>
          </Link>
        </m.div>
      ) : (
        <div className="space-y-4">
          {list.map((r, i) => {
            const examTitle = locale === "ar" ? (r.comprehensiveExam?.titleAr ?? r.comprehensiveExam?.title) : (r.comprehensiveExam?.title ?? r.comprehensiveExam?.titleAr)
            const courseTitle = locale === "ar" ? (r.comprehensiveExam?.course?.titleAr ?? r.comprehensiveExam?.course?.title) : (r.comprehensiveExam?.course?.title ?? r.comprehensiveExam?.course?.titleAr)
            const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US") : ""

            return (
              <m.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0F172A]">{safeStr(examTitle)}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{safeStr(courseTitle)}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">{date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {r.passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                    </span>
                    <span className="text-lg font-bold text-primary">{r.score?.toFixed(0)}%</span>
                    {r.attempts > 1 && (
                      <span className="text-xs text-[#94A3B8]">({r.attempts} {isAr ? "محاولات" : "attempts"})</span>
                    )}
                  </div>
                </div>
              </m.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
