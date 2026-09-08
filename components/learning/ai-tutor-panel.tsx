"use client"

import { useEffect, useRef, useState } from "react"
import { m } from "framer-motion"
import { Send, Sparkles, Loader2, RotateCcw, CheckCircle2, XCircle, MessageCircle, ClipboardList } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatMsg {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export default function AiTutorPanel({ lessonId }: { lessonId: string }) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [mode, setMode] = useState<"chat" | "quiz">("chat")

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState("")

  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [quizError, setQuizError] = useState("")

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([])
    setQuiz(null)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setChatError("")
    setQuizError("")
    setLoadingHistory(true)
    api.getLessonAiChat(lessonId).then((res: any) => {
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data.filter((m: ChatMsg) => !m.content.startsWith("[quiz:")))
      }
    }).finally(() => setLoadingHistory(false))
  }, [lessonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setChatError("")
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() }])
    setSending(true)
    try {
      const res: any = await api.sendLessonAiChat(lessonId, text)
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data])
      } else {
        setChatError(res.message || (isAr ? "حصل خطأ، جرب تاني" : "Something went wrong, try again"))
      }
    } catch {
      setChatError(isAr ? "حصل خطأ، جرب تاني" : "Something went wrong, try again")
    } finally {
      setSending(false)
    }
  }

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true)
    setQuizError("")
    setQuiz(null)
    setQuizAnswers({})
    setQuizSubmitted(false)
    try {
      const res: any = await api.generateLessonAiQuiz(lessonId, 5)
      if (res.success && Array.isArray(res.data)) {
        setQuiz(res.data)
      } else {
        setQuizError(res.message || (isAr ? "معرفناش نولّد الاختبار، جرب تاني" : "Couldn't generate the quiz, try again"))
      }
    } catch {
      setQuizError(isAr ? "معرفناش نولّد الاختبار، جرب تاني" : "Couldn't generate the quiz, try again")
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const score = quiz ? quiz.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correctIndex ? 1 : 0), 0) : 0

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-gradient-to-l from-primary/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[#0F172A]">{isAr ? "المساعد الذكي" : "AI Study Assistant"}</span>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-[#F1F5F9] p-1">
          <button
            onClick={() => setMode("chat")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "chat" ? "bg-white text-primary shadow-sm" : "text-[#64748B]"
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {isAr ? "اسأل" : "Ask"}
          </button>
          <button
            onClick={() => setMode("quiz")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "quiz" ? "bg-white text-primary shadow-sm" : "text-[#64748B]"
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {isAr ? "اختبرني" : "Quiz me"}
          </button>
        </div>
      </div>

      {mode === "chat" ? (
        <div className="flex flex-col">
          <div className="max-h-[420px] min-h-[180px] overflow-y-auto p-4 space-y-3">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />
                <p className="text-sm text-[#94A3B8]">
                  {isAr ? "اسأل المساعد أي حاجة عن الدرس ده وهو هيجاوبك" : "Ask the assistant anything about this lesson"}
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                      m.role === "user" ? "bg-primary text-white" : "bg-[#F1F5F9] text-[#0F172A]"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#F1F5F9] px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#94A3B8] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#94A3B8] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#94A3B8]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {chatError && <p className="px-4 pb-1 text-xs text-red-500">{chatError}</p>}

          <div className="flex items-center gap-2 border-t border-[#E2E8F0] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isAr ? "اكتب سؤالك هنا..." : "Type your question..."}
              className="flex-1 rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm outline-none focus:border-primary/40"
            />
            <Button onClick={handleSend} disabled={sending || !input.trim()} className="rounded-xl bg-primary hover:bg-primary-hover text-white shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {!quiz && !generatingQuiz && (
            <div className="py-6 text-center">
              <ClipboardList className="mx-auto mb-3 h-9 w-9 text-[#CBD5E1]" />
              <p className="mb-4 text-sm text-[#64748B]">
                {isAr ? "هنولّدلك أسئلة اختيارات من محتوى الدرس ده عشان تختبر فهمك" : "We'll generate multiple-choice questions from this lesson's content to test your understanding"}
              </p>
              <Button onClick={handleGenerateQuiz} className="rounded-xl bg-primary hover:bg-primary-hover text-white gap-2">
                <Sparkles className="h-4 w-4" />
                {isAr ? "ولّد اختبار" : "Generate Quiz"}
              </Button>
              {quizError && <p className="mt-3 text-xs text-red-500">{quizError}</p>}
            </div>
          )}

          {generatingQuiz && (
            <div className="flex flex-col items-center gap-2 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-[#94A3B8]">{isAr ? "بنولّد الأسئلة..." : "Generating questions..."}</p>
            </div>
          )}

          {quiz && (
            <div className="space-y-5">
              {quiz.map((q, qi) => {
                const selected = quizAnswers[qi]
                return (
                  <div key={qi} className="space-y-2">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isSelected = selected === oi
                        const isCorrect = oi === q.correctIndex
                        const showResult = quizSubmitted
                        return (
                          <button
                            key={oi}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-start text-sm transition-colors",
                              showResult && isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-700",
                              showResult && isSelected && !isCorrect && "border-red-300 bg-red-50 text-red-700",
                              !showResult && isSelected && "border-primary bg-primary/5",
                              !showResult && !isSelected && "border-[#E2E8F0] hover:bg-slate-50"
                            )}
                          >
                            <span>{opt}</span>
                            {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && (
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-[#64748B]">{q.explanation}</p>
                    )}
                  </div>
                )
              })}

              {!quizSubmitted ? (
                <Button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                  className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white"
                >
                  {isAr ? "سلّم الإجابات" : "Submit Answers"}
                </Button>
              ) : (
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary/5 p-4 text-center">
                  <p className="text-lg font-extrabold text-primary">
                    {score} / {quiz.length}
                  </p>
                  <p className="mb-3 text-xs text-[#64748B]">{isAr ? "درجتك في الاختبار" : "Your score"}</p>
                  <Button onClick={handleGenerateQuiz} variant="outline" className="gap-2 rounded-xl">
                    <RotateCcw className="h-3.5 w-3.5" />
                    {isAr ? "اختبار جديد" : "New Quiz"}
                  </Button>
                </m.div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
