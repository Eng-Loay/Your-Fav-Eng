"use client"

import { useState } from "react"
import Image from "next/image"
import { m, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, HelpCircle, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { QuizQuestion, QuizOption, QuizQuestionType } from "@/lib/data"

interface LessonQuizProps {
  questions: QuizQuestion[]
  locale: "ar" | "en"
  dir: "ltr" | "rtl"
  onComplete?: (score: number, total: number) => void
  onSubmitAnswer?: (questionId: string, answer: string) => void
  onBackToCourse?: () => void
}

function getQuestionTypeLabel(type: QuizQuestionType, locale: "ar" | "en") {
  const labels: Record<QuizQuestionType, { ar: string; en: string }> = {
    mcq: { ar: "اختيار من متعدد", en: "Multiple Choice" },
    true_false: { ar: "صح أو غلط", en: "True or False" },
    mcq_image: { ar: "اختيار من متعدد مع صورة", en: "Multiple Choice with Image" },
    image_select: { ar: "اختر الصورة/الإجابة الصحيحة", en: "Select Correct Answer" },
  }
  return locale === "ar" ? labels[type].ar : labels[type].en
}

function QuestionCard({
  question,
  index,
  total,
  locale,
  dir,
  onAnswer,
  userAnswer,
  showResult,
}: {
  question: QuizQuestion
  index: number
  total: number
  locale: "ar" | "en"
  dir: "ltr" | "rtl"
  onAnswer: (optionId: string) => void
  userAnswer: string | null
  showResult: boolean
}) {
  const questionText = locale === "ar" ? question.questionAr : question.questionEn
  const correctOption = question.options.find((o) => o.isCorrect)!
  const selectedOption = question.options.find((o) => o.id === userAnswer)
  const isCorrect = selectedOption?.isCorrect === true

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
          {getQuestionTypeLabel(question.type, locale)}
        </span>
        <span className="text-[10px] font-medium text-[#94A3B8]">
          {locale === "ar" ? `سؤال ${index + 1} من ${total}` : `Question ${index + 1} of ${total}`}
        </span>
      </div>

      {question.image && (
        <div className="mb-4 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="relative aspect-video w-full max-w-md">
            <Image
              src={question.image}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        </div>
      )}

      <h3 className="mb-4 text-base font-bold text-[#0F172A] sm:text-lg">{questionText}</h3>

      <RadioGroup
        value={userAnswer ?? ""}
        onValueChange={onAnswer}
        disabled={showResult}
        className="space-y-2"
      >
        {question.options.map((option) => {
          const optText = locale === "ar" ? option.textAr : option.textEn
          const isSelected = userAnswer === option.id
          const showCorrect = showResult && option.isCorrect
          const showWrong = showResult && isSelected && !option.isCorrect

          return (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer",
                "hover:border-primary/30 hover:bg-primary/[0.02]",
                isSelected && !showResult && "border-primary bg-primary/5",
                showCorrect && "border-emerald-500 bg-emerald-50",
                showWrong && "border-red-400 bg-red-50"
              )}
              onClick={() => !showResult && onAnswer(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-0.5 shrink-0" />
              <label
                htmlFor={option.id}
                className="flex flex-1 cursor-pointer gap-3 items-start"
              >
                {option.image && (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0]">
                    <Image src={option.image} alt="" fill className="object-cover" />
                  </div>
                )}
                <span className="text-sm font-medium text-[#334155]">{optText}</span>
              </label>
              {showCorrect && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              )}
              {showWrong && <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
            </div>
          )
        })}
      </RadioGroup>

      {showResult && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={cn(
            "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {locale === "ar" ? "إجابة صحيحة!" : "Correct!"}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              {locale === "ar"
                ? `الإجابة الصحيحة: ${locale === "ar" ? correctOption.textAr : correctOption.textEn}`
                : `Correct answer: ${correctOption.textEn}`}
            </>
          )}
        </m.div>
      )}
    </m.div>
  )
}

export function LessonQuiz({ questions, locale, dir, onComplete, onSubmitAnswer, onBackToCourse }: LessonQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [quizFinished, setQuizFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const userAnswer = currentQuestion ? (answers[currentQuestion.id] ?? null) : null
  const showResult = currentQuestion ? (showResults[currentQuestion.id] ?? false) : false
  const hasAnswered = userAnswer !== null
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswer = (optionId: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }))
    setShowResults((prev) => ({ ...prev, [currentQuestion.id]: true }))
    onSubmitAnswer?.(currentQuestion.id, optionId)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      const correct = questions.filter(
        (q) => answers[q.id] && questions.find((qu) => qu.id === q.id)?.options.find((o) => o.id === answers[q.id])?.isCorrect
      ).length
      setQuizFinished(true)
      onComplete?.(correct, questions.length)
    } else {
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
    }
  }

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  const correctCount = questions.filter(
    (q) => answers[q.id] && q.options.find((o) => o.id === answers[q.id])?.isCorrect
  ).length
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <HelpCircle className="mx-auto mb-3 h-12 w-12 text-[#94A3B8]" />
        <p className="text-sm font-medium text-[#64748B]">
          {locale === "ar" ? "لا يوجد اختبار لهذا الدرس" : "No quiz for this lesson"}
        </p>
      </div>
    )
  }

  if (quizFinished) {
    const isPassed = scorePercent >= 70
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm"
      >
        <div
          className={cn(
            "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full",
            isPassed ? "bg-emerald-100" : "bg-amber-100"
          )}
        >
          {isPassed ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          ) : (
            <XCircle className="h-10 w-10 text-amber-600" />
          )}
        </div>
        <h3 className="mb-2 text-xl font-bold text-[#0F172A]">
          {locale === "ar" ? "انتهى الاختبار!" : "Quiz Complete!"}
        </h3>
        <p className="mb-4 text-4xl font-black text-primary">{scorePercent}%</p>
        <p className="text-sm text-[#64748B]">
          {locale === "ar"
            ? `أجبت بشكل صحيح على ${correctCount} من ${questions.length} سؤال`
            : `You got ${correctCount} out of ${questions.length} questions correct`}
        </p>
        {isPassed ? (
          <p className="mt-2 text-sm font-medium text-emerald-600">
            {locale === "ar" ? "مبروك! لقد نجحت في الاختبار" : "Congratulations! You passed the quiz"}
          </p>
        ) : (
          <p className="mt-2 text-sm font-medium text-amber-600">
            {locale === "ar" ? "جرّب مرة أخرى لتحسين نتيجتك" : "Try again to improve your score"}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button
            onClick={() => {
              setQuizFinished(false)
              setCurrentIndex(0)
              setAnswers({})
              setShowResults({})
            }}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            {locale === "ar" ? "إعادة الاختبار" : "Retake Quiz"}
          </Button>
          {onBackToCourse && (
            <Button
              onClick={onBackToCourse}
              className="gap-2 rounded-xl bg-primary"
            >
              {locale === "ar" ? "العودة للدورة" : "Back to Course"}
            </Button>
          )}
        </div>
      </m.div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          locale={locale}
          dir={dir}
          onAnswer={handleAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
        />
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-2 rounded-xl"
        >
          {dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {locale === "ar" ? "السابق" : "Previous"}
        </Button>

        <div className="flex gap-1">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === currentIndex ? "bg-primary scale-125" : "bg-[#E2E8F0]",
                answers[q.id] && i !== currentIndex && "bg-[#94A3B8]"
              )}
              title={locale === "ar" ? `سؤال ${i + 1}` : `Question ${i + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!hasAnswered}
          className="gap-2 rounded-xl bg-primary"
        >
          {isLastQuestion
            ? locale === "ar"
              ? "عرض النتيجة"
              : "View Result"
            : locale === "ar"
              ? "التالي"
              : "Next"}
          {dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
