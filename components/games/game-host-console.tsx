"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Square, Trophy, Users, Loader2, Wifi, WifiOff, Flame, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import { startHypeMusic, stopHypeMusic, resumeHypeMusicOnInteraction } from "@/lib/hype-sound"

const TIMER_OPTIONS = [15, 25, 40, 60, 90, 120]

interface LobbyParticipant {
  userId: string
  name: string
  avatar: string | null
  joinedAt: string
}

interface ProgressRow {
  userId: string
  name: string
  score: number
  streak: number
  completed: boolean
}

interface LeaderboardRow {
  userId: string
  name: string
  avatar: string | null
  score: number
  maxStreak: number
  completed: boolean
}

type Phase = "loading" | "lobby" | "live" | "ended" | "error"

export default function GameHostConsole({ lessonId }: { lessonId: string }) {
  const { showToast } = useStore()
  const [phase, setPhase] = useState<Phase>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<LobbyParticipant[]>([])
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({})
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const [musicOn, setMusicOn] = useState(true)

  useEffect(() => {
    if (!musicOn || (phase !== "lobby" && phase !== "live")) {
      stopHypeMusic()
      return
    }
    startHypeMusic()
    return resumeHypeMusicOnInteraction()
  }, [phase, musicOn])

  useEffect(() => stopHypeMusic, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const gameRes = await api.getLessonGame(lessonId)
        if (!gameRes.success || !gameRes.data) {
          if (!cancelled) {
            setErrorMessage("لازم تضيف أسئلة للعبة الأول")
            setPhase("error")
          }
          return
        }
        setTimerSeconds(gameRes.data.defaultTimerSeconds ?? 30)

        const activeRes = await api.getActiveGameSession(lessonId)
        let sid: string | null = activeRes.success ? activeRes.data?.id ?? null : null

        if (!sid) {
          const createRes = await api.createGameSession(lessonId)
          if (!createRes.success || !createRes.data) {
            if (!cancelled) {
              setErrorMessage(createRes.message || "تعذر إنشاء جلسة اللعبة")
              setPhase("error")
            }
            return
          }
          sid = createRes.data.id
        }

        if (!cancelled) setSessionId(sid)
      } catch {
        if (!cancelled) {
          setErrorMessage("حدث خطأ أثناء تجهيز اللعبة")
          setPhase("error")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  useEffect(() => {
    if (!sessionId) return
    const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null
    if (!token) return

    const url = `${api.getGameWebSocketBase()}?token=${encodeURIComponent(token)}&sessionId=${sessionId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setPhase("lobby")
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === "lobby:update") {
          setParticipants(msg.participants ?? [])
        } else if (msg.type === "game:started") {
          setTimerSeconds(msg.timerSeconds)
          setTotalQuestions(msg.totalQuestions)
          setProgress(
            Object.fromEntries(
              participants.map((p) => [p.userId, { userId: p.userId, name: p.name, score: 0, streak: 0, completed: false }])
            )
          )
          setPhase("live")
        } else if (msg.type === "host:progress") {
          setProgress((prev) => {
            const existing = participants.find((p) => p.userId === msg.userId)
            return {
              ...prev,
              [msg.userId]: {
                userId: msg.userId,
                name: prev[msg.userId]?.name ?? existing?.name ?? "طالب",
                score: msg.score,
                streak: msg.streak,
                completed: msg.completed,
              },
            }
          })
        } else if (msg.type === "game:ended") {
          setLeaderboard(msg.leaderboard ?? [])
          setPhase("ended")
        } else if (msg.type === "error") {
          showToast(msg.message || "حدث خطأ", "error")
        }
      } catch {
        // ignore malformed messages
      }
    }

    return () => {
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleStart = useCallback(() => {
    if (participants.length === 0) {
      showToast("لازم طالب واحد على الأقل يدخل الانتظار الأول", "error")
      return
    }
    wsRef.current?.send(JSON.stringify({ type: "host:start", timerSeconds }))
  }, [participants.length, timerSeconds, showToast])

  const handleEnd = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "host:end" }))
  }, [])

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm text-slate-400">جاري تجهيز اللعبة...</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <p className="text-sm text-red-500">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200/60">
        <span className="text-sm font-medium text-slate-600">حالة الاتصال</span>
        <div className="flex items-center gap-3">
          {(phase === "lobby" || phase === "live") && (
            <button
              type="button"
              onClick={() => setMusicOn((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
              aria-label="كتم/تشغيل الموسيقى"
            >
              {musicOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}
          <span className={`flex items-center gap-1.5 text-xs font-bold ${connected ? "text-emerald-600" : "text-red-500"}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "متصل" : "غير متصل"}
          </span>
        </div>
      </div>

      {phase === "lobby" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900">الطلاب في الانتظار ({participants.length})</h3>
            </div>
            {participants.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">لسه محدش دخل... استنى الطلاب يضغطوا "انضم"</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <span
                    key={p.userId}
                    className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full px-3 py-1.5"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
            <label className="text-xs font-medium text-slate-600 block">الوقت لكل سؤال</label>
            <select
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              className="w-full sm:w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TIMER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s} ثانية
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleStart}
            disabled={!connected}
            className="w-full gap-2 rounded-xl h-12 text-base font-bold bg-emerald-500 hover:bg-emerald-600"
          >
            <Play className="w-5 h-5" />
            ابدأ اللعبة
          </Button>
        </div>
      )}

      {phase === "live" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">متابعة حية</h3>
            {participants.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">لا يوجد طلاب</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => {
                  const row = progress[p.userId]
                  return (
                    <div
                      key={p.userId}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                        row?.completed ? "bg-emerald-50" : "bg-slate-50"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      <div className="flex items-center gap-3">
                        {!!row?.streak && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Flame className="w-3.5 h-3.5" /> {row.streak}
                          </span>
                        )}
                        <span className="text-sm font-bold text-purple-600">{row?.score ?? 0} نقطة</span>
                        {row?.completed && <span className="text-xs text-emerald-600 font-medium">انتهى</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <Button
            onClick={handleEnd}
            variant="outline"
            className="w-full gap-2 rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Square className="w-4 h-4" />
            إنهاء اللعبة
          </Button>
        </div>
      )}

      {phase === "ended" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">النتيجة النهائية</h3>
          </div>
          <div className="space-y-2">
            {leaderboard.map((row, idx) => (
              <div
                key={row.userId}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold text-slate-500 border border-slate-200">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{row.name}</span>
                </div>
                <span className="text-sm font-bold text-purple-600">{row.score} نقطة</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
