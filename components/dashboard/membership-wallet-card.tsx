"use client"

import Link from "next/link"
import { Award, Download, BookOpen, Calendar, Loader2, Wallet, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { getMembershipDashboardUrl, getMembershipShortUrl } from "@/lib/membership-links"
import { useState } from "react"

export type MembershipWalletItem = {
  id: string
  membershipNo: string
  pdfUrl?: string
  status: string
  issuedAt?: string
  expiresAt?: string
  coursesUsed?: number
  package?: {
    title?: string
    titleAr?: string
    courseCount?: number
    level?: string
    duration?: string
    courseIds?: string[]
  }
}

interface MembershipWalletCardProps {
  membership: MembershipWalletItem
  compact?: boolean
  downloading?: string | null
  onDownload?: (membershipId: string, membershipNo: string) => void | Promise<void>
}

export function MembershipWalletCard({
  membership: mem,
  compact = false,
  downloading,
  onDownload,
}: MembershipWalletCardProps) {
  const { locale, t } = useI18n()
  const isAr = locale === "ar"
  const [shared, setShared] = useState(false)

  const handleDownload = () => {
    if (!onDownload) return
    void onDownload(mem.id, mem.membershipNo)
  }

  const packageTitle = isAr
    ? mem.package?.titleAr || mem.package?.title || (isAr ? "العضوية" : "Membership")
    : mem.package?.title || (isAr ? "العضوية" : "Membership")

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(getMembershipShortUrl(mem.membershipNo))
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {}
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#081A4D] via-[#0B2F8C] to-[#1345D6] p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 -start-6 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">
              {isAr ? "عضوية" : "Membership"}
            </p>
            <p className="text-xs font-semibold text-white/80">{mem.package?.level || (isAr ? "عضو" : "Member")}</p>
            <h3 className="text-lg font-bold leading-tight">{packageTitle}</h3>
            <p className="mt-1 font-mono text-xs text-white/60">#{mem.membershipNo}</p>

            {!compact && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {mem.package?.courseCount ?? 0} {isAr ? "دورات" : "courses"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {mem.expiresAt
                    ? `${isAr ? "ينتهي" : "Expires"} ${new Date(mem.expiresAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}`
                    : mem.package?.duration}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onDownload && (
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading === mem.membershipNo}
              className="gap-2 bg-white text-[#0B2F8C] hover:bg-white/90"
            >
              {downloading === mem.membershipNo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("marketing.downloadMembership")}
            </Button>
          )}
          {!compact && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 gap-2"
              >
                {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {shared ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "مشاركة" : "Share")}
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href={getMembershipDashboardUrl(mem.id)}>
                  <Award className="h-4 w-4 me-1.5" />
                  {isAr ? "التفاصيل" : "Details"}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
