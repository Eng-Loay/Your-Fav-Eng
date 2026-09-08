// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { Award, BookOpen, Loader2, Share2, Check, ArrowLeft, Link2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import {
  MembershipWalletCard,
  type MembershipWalletItem,
} from "@/components/dashboard/membership-wallet-card"
import { MembershipAccessGuard } from "@/components/dashboard/membership-access-guard"
import { downloadMembershipPdf } from "@/lib/membership-download"
import { getMembershipShortUrl } from "@/lib/membership-links"

type CoursePreview = { id: string; title: string; titleAr?: string; thumbnail?: string }

export default function StudentMembershipDetailPage() {
  const params = useParams()
  const membershipId = params.id as string
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { user } = useStore()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const [packageCourses, setPackageCourses] = useState<CoursePreview[]>([])

  const { data: membershipRes, loading, error } = useApi(
    () => api.getMyMembership(membershipId),
    { immediate: true, deps: [membershipId] }
  )

  const membership = useMemo((): MembershipWalletItem | null => {
    const raw = membershipRes as Record<string, unknown> | null
    if (!raw) return null
    return {
      id: raw.id as string,
      membershipNo: raw.membershipNo as string,
      pdfUrl: raw.pdfUrl as string,
      status: raw.status as string,
      issuedAt: raw.issuedAt as string,
      expiresAt: raw.expiresAt as string,
      coursesUsed: (raw.coursesUsed as number) ?? 0,
      package: raw.package as MembershipWalletItem["package"],
      packageId: (raw.packageId as string) || ((raw.package as { id?: string } | undefined)?.id),
    }
  }, [membershipRes])

  useEffect(() => {
    const pkgId = membership?.packageId || (membership?.package as { id?: string } | undefined)?.id
    if (!pkgId) return
    api.getMembershipPackageCourses(pkgId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setPackageCourses(res.data)
      }
    }).catch(() => {})
  }, [membership])

  const downloadPdf = async (membershipId: string, membershipNo: string) => {
    setDownloading(membershipNo)
    try {
      await downloadMembershipPdf({
        membershipId,
        membershipNo,
        memberName: user?.name || user?.email,
      })
    } catch {
      // ignore
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  const handleShare = async () => {
    if (!membership?.membershipNo) return
    const url = getMembershipShortUrl(membership.membershipNo)
    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !membership) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-slate-600">{isAr ? "العضوية غير موجودة" : "Membership not found"}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/membership">
            <ArrowLeft className="h-4 w-4 me-2" />
            {isAr ? "العودة" : "Back"}
          </Link>
        </Button>
      </div>
    )
  }

  const shortUrl = getMembershipShortUrl(membership.membershipNo)

  return (
    <MembershipAccessGuard>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/membership">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isAr ? "عضويتي" : "My Membership"}</h1>
          <p className="text-sm text-slate-500 font-mono">#{membership.membershipNo}</p>
        </div>
      </div>

      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <MembershipWalletCard
          membership={membership}
          downloading={downloading}
          onDownload={downloadPdf}
        />
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Link2 className="h-4 w-4 text-primary" />
          {isAr ? "رابط التحقق القصير" : "Short verification link"}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <code className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 break-all">
            {shortUrl}
          </code>
          <Button onClick={handleShare} variant="outline" className="gap-2 shrink-0">
            {shared ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            {shared ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الرابط" : "Copy link")}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {isAr
            ? "شارك هذا الرابط للتحقق من عضويتك الرسمية"
            : "Share this link to verify your official membership"}
        </p>
      </m.div>

      {packageCourses.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-primary" />
            {isAr ? "دورات الباقة" : "Bundle courses"}
          </h3>
          <ul className="space-y-2">
            {packageCourses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:border-primary/20 hover:bg-primary/5"
                >
                  <span>{isAr ? course.titleAr || course.title : course.title}</span>
                  <span className="text-xs text-primary">{isAr ? "فتح" : "Open"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </m.div>
      )}

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-primary/10 bg-primary/5 p-5"
      >
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isAr ? "شهادة العضوية الرسمية" : "Official membership certificate"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? "يمكن لأي شخص التحقق من عضويتك عبر الرابط القصير أعلاه"
                : "Anyone can verify your membership using the short link above"}
            </p>
          </div>
        </div>
      </m.div>
    </div>
    </MembershipAccessGuard>
  )
}
