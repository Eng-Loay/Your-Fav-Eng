"use client"

import { useEffect, useState } from "react"
import { Trophy, Loader2, X } from "lucide-react"
import { api } from "@/hooks/use-api"
import { useI18n } from "@/lib/i18n"

interface LeaderboardRow {
  userId: string
  name: string
  avatar: string | null
  totalScore: number
}

export default function SectionLeaderboard({
  chapterId,
  onClose,
}: {
  chapterId: string
  onClose?: () => void
}) {
  const { locale } = useI18n()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getSectionGameLeaderboard(chapterId)
      .then((res) => {
        if (!cancelled && res.success) setRows(res.data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [chapterId])

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">
            {locale === "ar" ? "الترتيب العام للقسم" : "Section Overall Leaderboard"}
          </h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {locale === "ar" ? "لسه محدش لعب أي لعبة في القسم ده" : "No one has played a game in this section yet"}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={row.userId}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                idx === 0 ? "bg-amber-50" : "bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 border border-slate-200">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-slate-800">{row.name}</span>
              </div>
              <span className="text-sm font-bold text-purple-600">
                {row.totalScore} {locale === "ar" ? "نقطة" : "pts"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
