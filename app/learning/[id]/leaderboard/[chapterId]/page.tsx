"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import SectionLeaderboard from "@/components/games/section-leaderboard"

export default function SectionLeaderboardPage() {
  const params = useParams()
  const courseId = params?.id as string
  const chapterId = params?.chapterId as string
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link
          href={`/learning/${courseId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A]"
        >
          <BackIcon className="h-3.5 w-3.5" />
          {locale === "ar" ? "رجوع للدرس" : "Back to lesson"}
        </Link>
        {chapterId && <SectionLeaderboard chapterId={chapterId} />}
      </div>
    </div>
  )
}
