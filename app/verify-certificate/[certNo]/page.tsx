"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { m } from "framer-motion"
import { Award, Shield, Loader2, Printer, Download } from "lucide-react"
import { api } from "@/hooks/use-api"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { resolveImageUrl } from "@/lib/utils"

function getShortcodeValue(
  shortcode: string,
  data: { userName: string; courseTitle: string; date: string; grade?: number; certificateNo: string; instructorName?: string }
): string {
  switch (shortcode) {
    case "student_name": return data.userName
    case "course_name": return data.courseTitle
    case "date": return data.date
    case "grade": return data.grade != null ? String(Math.round(data.grade)) : ""
    case "certificate_no": return data.certificateNo
    case "instructor_name": return data.instructorName ?? ""
    default: return ""
  }
}

interface OverlayField {
  id: string
  shortcode: string
  x: number
  y: number
  fontSize: number
  color: string
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const certNo = params.certNo as string
  const { locale } = useI18n()
  const { showToast } = useStore()
  const [downloading, setDownloading] = useState(false)
  const [cert, setCert] = useState<{
    user?: { name?: string } | string
    course?: { title?: string; titleAr?: string; instructor?: { name?: string } | string }
    certificateNo?: string
    issuedAt?: string
    grade?: number
    verified?: boolean
    template?: { imageUrl?: string | null; overlayFields?: string | null } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!certNo) return
    api
      .verifyCertificate(certNo)
      .then((res: any) => {
        const d = res?.data ?? res
        if (d && (d.verified || d.certificateNo)) setCert(d)
        else setError("Certificate not found")
      })
      .catch(() => setError("Failed to verify"))
      .finally(() => setLoading(false))
  }, [certNo])

  const userVal = cert?.user
  const userName = typeof userVal === "string" ? userVal : userVal?.name ?? ""
  const courseTitle = locale === "ar" ? (cert?.course?.titleAr ?? cert?.course?.title) : (cert?.course?.title ?? cert?.course?.titleAr)
  const instructorVal = cert?.course?.instructor
  const instructorName = typeof instructorVal === "string" ? instructorVal : (instructorVal as { name?: string })?.name ?? ""
  const date = cert?.issuedAt ? new Date(cert.issuedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US") : ""

  const certData = useMemo(
    () => ({
      userName,
      courseTitle: courseTitle ?? "",
      date,
      grade: cert?.grade,
      certificateNo: cert?.certificateNo ?? "",
      instructorName,
    }),
    [userName, courseTitle, date, cert?.grade, cert?.certificateNo, instructorName]
  )

  const overlayFields: OverlayField[] = useMemo(() => {
    const raw = cert?.template?.overlayFields
    if (!raw) return []
    try {
      return JSON.parse(raw) as OverlayField[]
    } catch {
      return []
    }
  }, [cert?.template?.overlayFields])

  const templateImageUrl = cert?.template?.imageUrl ? resolveImageUrl(cert.template.imageUrl) : ""

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || "Certificate not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:bg-white print:p-0" dir={locale === "ar" ? "rtl" : "ltr"}>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border bg-white"
      >
        {templateImageUrl ? (
          <div className="relative w-full" style={{ aspectRatio: "210/297" }}>
            <img
              src={templateImageUrl}
              alt="Certificate"
              className="w-full h-full object-contain block"
              crossOrigin="anonymous"
            />
            {overlayFields.map((field) => {
              const text = getShortcodeValue(field.shortcode, certData)
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
                {locale === "ar" ? "شهادة موثقة" : "Verified Certificate"}
              </div>
              <Award className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">
                {locale === "ar" ? "شهادة إتمام الدورة" : "Course Completion Certificate"}
              </h1>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-lg text-slate-700">
                {locale === "ar" ? "هذا يثبت أن" : "This certifies that"}
                <span className="font-bold text-slate-900 mx-1">{userName}</span>
                {locale === "ar" ? "أكمل بنجاح" : "has successfully completed"}
              </p>
              <p className="text-xl font-bold text-primary">{courseTitle}</p>
              {cert.grade != null && (
                <p className="text-slate-600">
                  {locale === "ar" ? "الدرجة:" : "Grade:"} {cert.grade.toFixed(0)}%
                </p>
              )}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{locale === "ar" ? "رقم الشهادة:" : "Certificate #"} {cert.certificateNo}</span>
                <span>{locale === "ar" ? "تاريخ الإصدار:" : "Issued:"} {date}</span>
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
          {locale === "ar" ? "طباعة" : "Print"}
        </button>
        <button
          type="button"
          onClick={async () => {
            setDownloading(true)
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null
              const res = await fetch(`${API_BASE}/certificates/download-by-no/${certNo}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                showToast(err?.message || "Failed to download", "error")
                return
              }
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `certificate-${certNo}.pdf`
              a.click()
              URL.revokeObjectURL(url)
              showToast(locale === "ar" ? "تم التحميل" : "Downloaded", "success")
            } catch {
              showToast(locale === "ar" ? "فشل التحميل" : "Download failed", "error")
            } finally {
              setDownloading(false)
            }
          }}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {locale === "ar" ? "تحميل" : "Download"}
        </button>
        <p className="text-xs text-slate-400 mt-4">
          {locale === "ar" ? "تحقق من صحة هذه الشهادة على" : "Verify at"}{" "}
          {typeof window !== "undefined" ? window.location.origin : ""}/verify-certificate/{certNo}
        </p>
      </div>
    </div>
  )
}
