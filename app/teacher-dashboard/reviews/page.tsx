"use client"

import { m } from "framer-motion"
import Image from "next/image"
import { useApi, api } from "@/hooks/use-api"
import {
  Star,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Flag,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

function formatReviewTime(dateStr: string, locale: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return locale === "ar" ? "اليوم" : "Today"
  if (diffDays === 1) return locale === "ar" ? "منذ يوم" : "1 day ago"
  if (diffDays < 7) return locale === "ar" ? `منذ ${diffDays} أيام` : `${diffDays} days ago`
  if (diffDays < 14) return locale === "ar" ? "منذ أسبوع" : "1 week ago"
  return locale === "ar" ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} weeks ago`
}

export default function TeacherReviewsPage() {
  const { locale, dir } = useI18n()
  const isRTL = dir === "rtl"

  const { data: summaryData } = useApi(() => api.getInstructorReviewsSummary())
  const { data: reviewsRes } = useApi(() => api.getInstructorReviews())

  const summary = summaryData as { average?: number; total?: number; distribution?: Record<number, number> } | null
  const distObj = summary?.distribution ?? {}
  const totalForDist = (summary?.total ?? Object.values(distObj).reduce((a, b) => a + b, 0)) || 1
  const ratingDistributionDisplay = [5, 4, 3, 2, 1].map(stars => {
    const count = distObj[stars] ?? 0
    return {
      stars,
      count,
      percentage: totalForDist > 0 ? Math.round((count / totalForDist) * 100) : 0,
    }
  })
  const reviewsRaw = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes as { data?: any[] })?.data ?? []
  const reviewsDisplay = reviewsRaw.map((r: any, i: number) => {
    const user = r.user ?? {}
    const course = r.course ?? {}
    return {
      id: r.id ?? i + 1,
      nameEn: user.name ?? r.userName ?? "Student",
      nameAr: user.nameAr ?? r.userNameAr ?? "طالب",
      courseEn: course.title ?? r.courseTitle ?? "Course",
      courseAr: course.titleAr ?? r.courseTitleAr ?? "دورة",
      rating: r.rating ?? 5,
      commentEn: r.comment ?? "",
      commentAr: r.commentAr ?? r.comment ?? "",
      timeEn: formatReviewTime(r.createdAt, "en"),
      timeAr: formatReviewTime(r.createdAt, "ar"),
    }
  })

  const totalReviews = summary?.total ?? ratingDistributionDisplay.reduce((a, b) => a + b.count, 0)

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-[#E2E8F0]"}`}
      />
    ))

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          {locale === "ar" ? "التقييمات" : "Reviews"}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {locale === "ar" ? "آراء طلابك حول دوراتك" : "What your students say about your courses"}
        </p>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm text-center"
        >
          <m.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl font-extrabold text-[#0F172A] mb-2"
          >
            {summary?.average ?? 0}
          </m.p>
          <div className="flex items-center justify-center gap-1 mb-2">
            {renderStars(5)}
          </div>
          <p className="text-sm text-[#94A3B8]">
            {locale === "ar" ? `${totalReviews} تقييم` : `${totalReviews} reviews`}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600">
              {locale === "ar" ? "+0.2 من الشهر الماضي" : "+0.2 from last month"}
            </span>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-2xl border border-[#E2E8F0]/60 bg-white p-6 shadow-sm"
        >
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">
            {locale === "ar" ? "توزيع التقييمات" : "Rating Distribution"}
          </h3>
          <div className="space-y-3">
            {ratingDistributionDisplay.map((r, i) => (
              <m.div
                key={r.stars}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1 w-16 shrink-0">
                  <span className="text-sm font-bold text-[#0F172A]">{r.stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-3 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.percentage}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                </div>
                <span className="text-xs font-medium text-[#94A3B8] w-12 text-end">{r.count}</span>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
            <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            {locale === "ar" ? "التقييمات الأخيرة" : "Recent Reviews"}
          </h3>
        </div>

        <m.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {reviewsDisplay.map((review, i) => (
            <m.div
              key={review.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-11 w-11 overflow-hidden rounded-xl shrink-0">
                  <Image src="/user-avatar.png" alt="" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-[#0F172A]">
                      {locale === "ar" ? review.nameAr : review.nameEn}
                    </p>
                    <span className="text-xs text-[#94A3B8]">
                      {locale === "ar" ? review.timeAr : review.timeEn}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B5CF6] font-medium mb-2">
                    {locale === "ar" ? review.courseAr : review.courseEn}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {locale === "ar" ? review.commentAr : review.commentEn}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E2E8F0]/60">
                    <button className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#8B5CF6] transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {locale === "ar" ? "مفيد" : "Helpful"}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#8B5CF6] transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {locale === "ar" ? "رد" : "Reply"}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-red-400 transition-colors">
                      <Flag className="w-3.5 h-3.5" />
                      {locale === "ar" ? "إبلاغ" : "Report"}
                    </button>
                  </div>
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      </m.div>
    </div>
  )
}
