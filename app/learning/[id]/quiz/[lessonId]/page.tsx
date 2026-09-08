"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { LessonQuiz } from "@/components/learning/lesson-quiz"
import { cn } from "@/lib/utils"

export default function LessonQuizPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  const { locale, dir } = useI18n()
  const { isPurchased, isLoggedIn } = useStore()
  const isRTL = dir === "rtl"
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const { data: quizData } = useApi(
    () => api.getLessonQuiz(lessonId),
    { deps: [lessonId], immediate: !!lessonId }
  )

  const quizQuestions = (() => {
    let raw: Array<Record<string, unknown>> = []
    if (Array.isArray(quizData)) {
      raw = quizData
    } else if (quizData && typeof quizData === "object" && "questions" in quizData && Array.isArray((quizData as { questions?: unknown }).questions)) {
      raw = (quizData as { questions: Array<Record<string, unknown>> }).questions
    }
    return raw.map((qq, idx) => {
      let opts: Array<{ id: string; textAr: string; textEn: string; isCorrect: boolean }> = []
      const optionsRaw = qq.options
      if (Array.isArray(optionsRaw)) {
        opts = optionsRaw.map((o: Record<string, unknown>, i: number) => ({
          id: String((o as { id?: string }).id ?? `opt-${idx}-${i}`),
          textAr: String((o as { textAr?: string }).textAr ?? (o as { text?: string }).text ?? ""),
          textEn: String((o as { textEn?: string }).textEn ?? (o as { text?: string }).text ?? ""),
          isCorrect: Boolean((o as { isCorrect?: boolean }).isCorrect),
        }))
      } else if (typeof optionsRaw === "string") {
        try {
          const parsed = JSON.parse(optionsRaw) as Array<Record<string, unknown>>
          opts = (parsed || []).map((o, i) => ({
            id: String((o as { id?: string }).id ?? `opt-${idx}-${i}`),
            textAr: String((o as { textAr?: string }).textAr ?? (o as { text?: string }).text ?? ""),
            textEn: String((o as { textEn?: string }).textEn ?? (o as { text?: string }).text ?? ""),
            isCorrect: Boolean((o as { isCorrect?: boolean }).isCorrect),
          }))
        } catch {
          opts = []
        }
      }
      return {
        id: String((qq as { id?: string }).id ?? `q-${idx}`),
        type: ((qq as { type?: string }).type ?? "mcq").replace("multiple_choice", "mcq") as "mcq" | "true_false" | "mcq_image" | "image_select",
        questionAr: String((qq as { questionAr?: string }).questionAr ?? (qq as { question?: string }).question ?? ""),
        questionEn: String((qq as { questionEn?: string }).questionEn ?? (qq as { question?: string }).question ?? ""),
        options: opts,
      }
    })
  })()

  const handleComplete = async () => {
    await api.completeLesson(lessonId).catch(() => {})
  }

  const handleBackToCourse = () => {
    router.push(`/learning/${courseId}`)
  }

  if (!isLoggedIn) {
    router.push("/login")
    return null
  }
  if (courseId && !isPurchased(courseId)) {
    router.push(`/courses/${courseId}`)
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/learning/${courseId}`}
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-primary"
          >
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "العودة للدورة" : "Back to Course"}
          </Link>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">
              {locale === "ar" ? "اختبار" : "Quiz"}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {quizQuestions.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center"
          >
            <ClipboardCheck className="mx-auto mb-4 h-16 w-16 text-[#94A3B8]" />
            <p className="text-[#64748B]">
              {locale === "ar" ? "لا توجد أسئلة في هذا الاختبار" : "No questions in this quiz"}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push(`/learning/${courseId}`)}
            >
              {locale === "ar" ? "العودة" : "Go Back"}
            </Button>
          </m.div>
        ) : (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 border-b border-[#E2E8F0] pb-6">
              <h1 className="text-xl font-bold text-[#0F172A] sm:text-2xl">
                {locale === "ar" ? "اختبار الدرس" : "Lesson Quiz"}
              </h1>
              <p className="mt-0.5 text-sm text-[#64748B]">
                {quizQuestions.length} {locale === "ar" ? "أسئلة" : "questions"}
              </p>
            </div>
            <LessonQuiz
              questions={quizQuestions}
              locale={locale}
              dir={dir}
              onSubmitAnswer={(questionId, answer) =>
                api.submitQuizAnswer(lessonId, questionId, answer).catch(() => {})
              }
              onComplete={handleComplete}
              onBackToCourse={handleBackToCourse}
            />
          </m.div>
        )}
      </main>
    </div>
  )
}
