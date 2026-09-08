"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Gamepad2 } from "lucide-react"
import GameHostConsole from "@/components/games/game-host-console"

export default function TeacherGameHostPage() {
  const params = useParams()
  const lessonId = params?.lessonId as string

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/teacher-dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          العودة للدورات
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-pink-500" />
          استضافة اللعبة الحية
        </h1>
      </div>

      {lessonId && <GameHostConsole lessonId={lessonId} />}
    </div>
  )
}
