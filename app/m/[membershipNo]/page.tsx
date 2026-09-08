"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { m } from "framer-motion"
import { Award, Shield, Loader2, Printer, Download, Link2 } from "lucide-react"
import { api } from "@/hooks/use-api"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { getMembershipShortcodeValue } from "@/lib/membership-links"
import { downloadMembershipPdf } from "@/lib/membership-download"
import { resolveImageUrl } from "@/lib/utils"

interface OverlayField {
  id: string
  shortcode: string
  x: number
  y: number
  fontSize: number
  color: string
}

export default function VerifyMembershipPage() {
  const params = useParams()
  const membershipNo = params.membershipNo as string
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [membership, setMembership] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membershipNo) return
    api
      .verifyMembership(membershipNo)
      .then((res) => {
        if (res.success && res.data) setMembership(res.data as Record<string, any>)
        else setError(isAr ? "العضوية غير موجودة أو منتهية" : "Membership not found or expired")
      })
      .catch(() => setError(isAr ? "فشل التحقق" : "Verification failed"))
      .finally(() => setLoading(false))
  }, [membershipNo, isAr])

  const memberName = membership?.user?.name ?? ""
  const packageTitle = isAr
    ? membership?.package?.titleAr || membership?.package?.title
    : membership?.package?.title || membership?.package?.titleAr
  const issuedDate = membership?.issuedAt
    ? new Date(membership.issuedAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")
    : ""
  const expiresDate = membership?.expiresAt
    ? new Date(membership.expiresAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")
    : ""

  const certData = useMemo(
    () => ({
      memberName,
      membershipNo: membership?.membershipNo ?? membershipNo,
      packageTitle: packageTitle ?? "",
      level: membership?.package?.level,
      courseCount: membership?.package?.courseCount,
      duration: membership?.package?.duration,
      issuedDate,
      expiresDate,
    }),
    [memberName, membership, membershipNo, packageTitle, issuedDate, expiresDate]
  )

  const overlayFields: OverlayField[] = useMemo(() => {
    const raw = membership?.template?.overlayFields
    if (!raw) return []
    try {
      return JSON.parse(raw) as OverlayField[]
    } catch {
      return []
    }
  }, [membership?.template?.overlayFields])

  const templateImageUrl = membership?.template?.imageUrl
    ? resolveImageUrl(membership.template.imageUrl)
    : ""

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !membership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || (isAr ? "العضوية غير موجودة" : "Membership not found")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:bg-white print:p-0" dir={isAr ? "rtl" : "ltr"}>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border bg-white"
      >
        {templateImageUrl ? (
          <div className="relative w-full" style={{ aspectRatio: "210/297" }}>
            <img src={templateImageUrl} alt="Membership" className="w-full h-full object-contain block" />
            {overlayFields.map((field) => {
              const text = getMembershipShortcodeValue(field.shortcode, certData)
              return (
                <div
                  key={field.id}
                  className="absolute"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    fontSize: field.fontSize,
                    color: field.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {text || "-"}
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-primary to-primary/90 p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                {isAr ? "عضوية موثقة" : "Verified Membership"}
              </div>
              <Award className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">
                {isAr ? "شهادة عضوية" : "Membership Certificate"}
              </h1>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-lg text-slate-700">
                {isAr ? "هذا يثبت أن" : "This certifies that"}
                <span className="font-bold text-slate-900 mx-1">{memberName}</span>
                {isAr ? "عضو معتمد في" : "is a verified member of"}
              </p>
              <p className="text-xl font-bold text-primary">{packageTitle}</p>
              {membership.package?.level && (
                <p className="text-slate-600">{isAr ? "المستوى:" : "Level:"} {membership.package.level}</p>
              )}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{isAr ? "رقم العضوية:" : "Membership #"} {membership.membershipNo}</span>
                <span>{isAr ? "تاريخ الإصدار:" : "Issued:"} {issuedDate}</span>
                {expiresDate && <span>{isAr ? "ينتهي:" : "Expires:"} {expiresDate}</span>}
              </div>
            </div>
          </>
        )}
      </m.div>

      <div className="text-center mt-4 print:hidden flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          <Printer className="w-4 h-4" />
          {isAr ? "طباعة" : "Print"}
        </button>
        {membership && (
          <button
            type="button"
            onClick={() => {
              void downloadMembershipPdf({
                membershipId: membership.id,
                membershipNo,
              }).catch(() => {})
            }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            {isAr ? "تحميل PDF" : "Download PDF"}
          </button>
        )}
        <p className="w-full text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Link2 className="w-3 h-3" />
          {typeof window !== "undefined" ? window.location.origin : ""}/m/{membershipNo}
        </p>
      </div>
    </div>
  )
}
