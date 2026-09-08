"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { m, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Users,
  Flame,
  Trophy,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { startHypeMusic, stopHypeMusic, resumeHypeMusicOnInteraction } from "@/lib/hype-sound"

type Phase = "loading" | "no-game" | "lobby" | "playing" | "feedback" | "waiting" | "ended" | "error"

interface QuestionOption {
  id: string
  text: string
}
interface QuestionItem {
  id: string
  text: string
}
interface QuestionBlank {
  key: string
  label: string
}
interface SanitizedQuestion {
  id: string
  type: "mc" | "ms" | "tf" | "di" | "cat" | "match" | "fill"
  question: string
  questionAr: string | null
  points: number
  order: number
  config: {
    options?: QuestionOption[]
    categories?: { id: string; label: string }[]
    choices?: { id: string; label: string }[]
    items?: QuestionItem[]
    passage?: string
    blanks?: QuestionBlank[]
  }
}
interface LeaderboardRow {
  userId: string
  name: string
  avatar: string | null
  score: number
  maxStreak: number
  completed: boolean
}

export default function LiveGamePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string
  const lessonId = params?.lessonId as string
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const isRTL = dir === "rtl"
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const [phase, setPhase] = useState<Phase>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [lobbyCount, setLobbyCount] = useState(0)
  const [question, setQuestion] = useState<SanitizedQuestion | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lastResult, setLastResult] = useState<{ correct: boolean; pointsEarned: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const locked = useRef(false)
  const gameEndedRef = useRef(false)
  const [musicOn, setMusicOn] = useState(true)

  // Hype background music: play while in the lobby / actively playing so
  // the game feels energetic; stop once results/end screens show.
  useEffect(() => {
    if (!musicOn) {
      stopHypeMusic()
      return
    }
    if (phase === "lobby" || phase === "playing" || phase === "feedback") {
      startHypeMusic()
      const cleanupInteraction = resumeHypeMusicOnInteraction()
      return cleanupInteraction
    }
    stopHypeMusic()
  }, [phase, musicOn])

  useEffect(() => stopHypeMusic, [])

  const submitAnswer = useCallback((answer: any) => {
    if (locked.current || !question) return
    locked.current = true
    wsRef.current?.send(JSON.stringify({ type: "player:submit-answer", questionId: question.id, answer }))
  }, [question])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const gameRes = await api.getLessonGame(lessonId)
        if (!gameRes.success || !gameRes.data) {
          if (!cancelled) setPhase("no-game")
          return
        }

        let sessionId: string | null = null
        const activeRes = await api.getActiveGameSession(lessonId)
        if (activeRes.success && activeRes.data) sessionId = activeRes.data.id

        if (!sessionId) {
          if (!cancelled) {
            setErrorMessage(locale === "ar" ? "لسه المعلم مبدأش اللعبة" : "The teacher hasn't started a session yet")
            setPhase("error")
          }
          return
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null
        if (!token) return
        const url = `${api.getGameWebSocketBase()}?token=${encodeURIComponent(token)}&sessionId=${sessionId}`
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (cancelled) return
          setPhase((p) => (p === "loading" ? "lobby" : p))
        }
        ws.onclose = (ev) => {
          if (cancelled) return
          if (ev.code === 4409) {
            if (ev.reason === "already_played") {
              setErrorMessage(locale === "ar" ? "أنت لعبت اللعبة دي قبل كده — مش هتقدر تلعبها تاني" : "You've already played this game — you can't play it again")
            } else {
              setErrorMessage(locale === "ar" ? "اللعبة بدأت قبل ما تنضم" : "The game already started before you joined")
            }
            setPhase("error")
          }
        }
        ws.onerror = () => {
          if (!cancelled) {
            setErrorMessage(locale === "ar" ? "تعذر الاتصال باللعبة" : "Could not connect to the game")
            setPhase("error")
          }
        }
        ws.onmessage = (event) => {
          if (cancelled) return
          try {
            const msg = JSON.parse(event.data)
            handleMessage(msg)
          } catch {
            // ignore malformed messages
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(locale === "ar" ? "حدث خطأ" : "Something went wrong")
          setPhase("error")
        }
      }
    })()
    return () => {
      cancelled = true
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  function handleMessage(msg: any) {
    if (msg.type === "lobby:update") {
      setLobbyCount((msg.participants ?? []).length)
    } else if (msg.type === "question:show") {
      locked.current = false
      setLastResult(null)
      setQuestion(msg.question)
      setTimerSeconds(msg.timerSeconds)
      setTimeLeft(msg.timerSeconds)
      setPhase("playing")
    } else if (msg.type === "answer:result") {
      setScore(msg.newScore)
      setStreak(msg.newStreak)
      setLastResult({ correct: msg.correct, pointsEarned: msg.pointsEarned })
      setPhase("feedback")
      setTimeout(() => {
        // game:ended may already have arrived and moved us past this — never downgrade back.
        if (gameEndedRef.current) return
        if (msg.completed) {
          setPhase("waiting")
        } else if (msg.nextQuestion) {
          locked.current = false
          setLastResult(null)
          setQuestion(msg.nextQuestion)
          setTimeLeft(timerSeconds)
          setPhase("playing")
        }
      }, 1800)
    } else if (msg.type === "game:resume") {
      setScore(msg.score)
      setStreak(msg.streak)
      if (msg.completed) {
        setPhase("waiting")
      } else if (msg.question) {
        setQuestion(msg.question)
        setTimerSeconds(msg.timerSeconds)
        setTimeLeft(msg.timerSeconds)
        setPhase("playing")
      }
    } else if (msg.type === "game:ended") {
      gameEndedRef.current = true
      setLeaderboard(msg.leaderboard ?? [])
      setPhase("ended")
    } else if (msg.type === "error") {
      showToast(msg.message || "حدث خطأ", "error")
    }
  }

  // Cosmetic client-side countdown ring (server is authoritative on actual timing)
  useEffect(() => {
    if (phase !== "playing") return
    setTimeLeft(timerSeconds)
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, question?.id, timerSeconds])

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b0b1f]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="text-sm text-white/60">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    )
  }

  if (phase === "no-game" || phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0b1f] px-6 text-center">
        <Gamepad2 className="h-12 w-12 text-white/30" />
        <p className="text-sm text-white/70">
          {phase === "no-game"
            ? locale === "ar"
              ? "مفيش لعبة متاحة على هذا الدرس"
              : "No game is available for this lesson"
            : errorMessage}
        </p>
        <Link href={`/learning/${courseId}`}>
          <Button variant="outline" className="gap-2 rounded-xl border-white/20 text-white hover:bg-white/10">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع للدرس" : "Back to lesson"}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0b1f] text-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={`/learning/${courseId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80"
        >
          <BackIcon className="h-3.5 w-3.5" />
          {locale === "ar" ? "رجوع للدرس" : "Back to lesson"}
        </Link>

        {(phase === "lobby" || phase === "playing" || phase === "feedback") && (
          <button
            type="button"
            onClick={() => setMusicOn((v) => !v)}
            className="fixed end-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 backdrop-blur hover:text-white"
            aria-label={locale === "ar" ? "كتم/تشغيل الموسيقى" : "Toggle music"}
          >
            {musicOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}

        {phase === "lobby" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-lg font-bold">
              {locale === "ar" ? "في انتظار المعلم يبدأ اللعبة" : "Waiting for the teacher to start"}
            </h2>
            <p className="text-sm text-white/50">
              {locale === "ar"
                ? `أنت جوه الانتظار — عدد الطلاب: ${lobbyCount}`
                : `You're in the lobby — students waiting: ${lobbyCount}`}
            </p>
          </div>
        )}

        {(phase === "playing" || phase === "feedback") && question && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-400">
                <Flame className="h-4 w-4" /> {streak}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Timer className="h-4 w-4 text-cyan-400" />
                <span className={cn(timeLeft <= 5 && "text-red-400")}>{timeLeft}s</span>
              </div>
              <div className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                {score} {locale === "ar" ? "نقطة" : "pts"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-2.5 py-1 text-xs font-bold">
                  #{question.order + 1}
                </span>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                  +{question.points} {locale === "ar" ? "نقطة" : "pts"}
                </span>
              </div>
              <p className="mb-5 text-lg font-bold leading-relaxed">
                {locale === "ar" && question.questionAr ? question.questionAr : question.question}
              </p>

              {phase === "playing" && (
                <QuestionInput question={question} onSubmit={submitAnswer} locale={locale} />
              )}

              {phase === "feedback" && lastResult && (
                <div
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-6 text-center",
                    lastResult.correct ? "bg-emerald-500/15" : "bg-red-500/15"
                  )}
                >
                  {lastResult.correct ? (
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-400" />
                  )}
                  <p className="text-lg font-black">
                    {lastResult.correct
                      ? locale === "ar"
                        ? "إجابة صحيحة!"
                        : "Correct!"
                      : locale === "ar"
                        ? "إجابة غير صحيحة"
                        : "Not quite"}
                  </p>
                  {lastResult.pointsEarned > 0 && (
                    <p className="text-amber-300 font-bold">+{lastResult.pointsEarned}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {phase === "waiting" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-400" />
            <h2 className="mb-2 text-lg font-bold">
              {locale === "ar" ? "خلصت الأسئلة! في انتظار الباقيين" : "You're done! Waiting for others"}
            </h2>
            <p className="text-sm text-white/50">
              {locale === "ar" ? `نقاطك: ${score}` : `Your score: ${score}`}
            </p>
          </div>
        )}

        {phase === "ended" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold">{locale === "ar" ? "النتيجة النهائية" : "Final Results"}</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map((row, idx) => (
                <div
                  key={row.userId}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3",
                    idx === 0 ? "bg-amber-400/15" : "bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{row.name}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-300">{row.score} {locale === "ar" ? "نقطة" : "pts"}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => router.push(`/learning/${courseId}`)}
              className="mt-5 w-full gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
            >
              {locale === "ar" ? "رجوع للدرس" : "Back to lesson"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function QuestionInput({
  question,
  onSubmit,
  locale,
}: {
  question: SanitizedQuestion
  onSubmit: (answer: any) => void
  locale: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [multiSelected, setMultiSelected] = useState<string[]>([])
  const [textAnswer, setTextAnswer] = useState("")
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [blankValues, setBlankValues] = useState<Record<string, string>>({})

  const tileColors = [
    "bg-red-500 hover:bg-red-600",
    "bg-blue-500 hover:bg-blue-600",
    "bg-amber-500 hover:bg-amber-600",
    "bg-emerald-500 hover:bg-emerald-600",
    "bg-purple-500 hover:bg-purple-600",
    "bg-cyan-500 hover:bg-cyan-600",
  ]

  if (question.type === "mc") {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(question.config.options ?? []).map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => onSubmit({ selected: opt.id })}
            className={cn(
              "rounded-xl px-4 py-4 text-start text-sm font-bold text-white transition-transform hover:scale-[1.02]",
              tileColors[i % tileColors.length]
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === "ms") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(question.config.options ?? []).map((opt, i) => {
            const isChecked = multiSelected.includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() =>
                  setMultiSelected((prev) =>
                    isChecked ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                  )
                }
                className={cn(
                  "rounded-xl px-4 py-4 text-start text-sm font-bold text-white transition-all",
                  tileColors[i % tileColors.length],
                  isChecked ? "ring-4 ring-white" : "opacity-90"
                )}
              >
                {opt.text}
              </button>
            )
          })}
        </div>
        <Button
          onClick={() => onSubmit({ selected: multiSelected })}
          disabled={multiSelected.length === 0}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
        >
          {locale === "ar" ? "تأكيد الإجابة" : "Submit Answer"}
        </Button>
      </div>
    )
  }

  if (question.type === "tf") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSubmit({ selected: true })}
          className="rounded-xl bg-emerald-500 py-8 text-2xl font-black text-white hover:bg-emerald-600"
        >
          {locale === "ar" ? "صح" : "TRUE"}
        </button>
        <button
          onClick={() => onSubmit({ selected: false })}
          className="rounded-xl bg-red-500 py-8 text-2xl font-black text-white hover:bg-red-600"
        >
          {locale === "ar" ? "خطأ" : "FALSE"}
        </button>
      </div>
    )
  }

  if (question.type === "di") {
    return (
      <div className="space-y-3">
        <Input
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={locale === "ar" ? "اكتب إجابتك..." : "Type your answer..."}
          className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && textAnswer.trim()) onSubmit({ text: textAnswer })
          }}
        />
        <Button
          onClick={() => onSubmit({ text: textAnswer })}
          disabled={!textAnswer.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
        >
          {locale === "ar" ? "تأكيد الإجابة" : "Submit Answer"}
        </Button>
      </div>
    )
  }

  if (question.type === "cat" || question.type === "match") {
    const labelList = question.type === "cat" ? question.config.categories ?? [] : question.config.choices ?? []
    const items = question.config.items ?? []
    const allAssigned = items.length > 0 && items.every((it) => !!assignments[it.id])
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium">{item.text}</span>
            <select
              value={assignments[item.id] ?? ""}
              onChange={(e) => setAssignments((prev) => ({ ...prev, [item.id]: e.target.value }))}
              className="rounded-lg border border-white/20 bg-[#1a1a35] px-3 py-2 text-sm text-white"
            >
              <option value="">-- {locale === "ar" ? "اختر" : "Choose"} --</option>
              {labelList.map((l: { id: string; label: string }) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <Button
          onClick={() => onSubmit({ assignments })}
          disabled={!allAssigned}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
        >
          {locale === "ar" ? "تأكيد الإجابة" : "Submit Answer"}
        </Button>
      </div>
    )
  }

  if (question.type === "fill") {
    const passage = question.config.passage ?? ""
    const blanks = question.config.blanks ?? []
    const parts = passage.split(/(\{\{blank:[a-zA-Z0-9_]+\}\})/g)
    const allFilled = blanks.length > 0 && blanks.every((b) => (blankValues[b.key] ?? "").trim() !== "")
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-white/5 p-4 leading-loose">
          {parts.map((part, i) => {
            const match = part.match(/^\{\{blank:([a-zA-Z0-9_]+)\}\}$/)
            if (match) {
              const key = match[1]
              const blank = blanks.find((b) => b.key === key)
              return (
                <input
                  key={i}
                  value={blankValues[key] ?? ""}
                  onChange={(e) => setBlankValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={blank?.label || "..."}
                  className="mx-1 w-32 rounded-lg border border-purple-400/50 bg-purple-500/20 px-2 py-1 text-center text-sm text-white"
                />
              )
            }
            return <span key={i}>{part}</span>
          })}
        </p>
        <Button
          onClick={() => onSubmit({ blanks: blankValues })}
          disabled={!allFilled}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
        >
          {locale === "ar" ? "تأكيد الإجابة" : "Submit Answer"}
        </Button>
      </div>
    )
  }

  return null
}
