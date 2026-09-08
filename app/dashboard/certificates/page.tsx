"use client"

import { useMemo, useState } from "react"
import { m } from "framer-motion"
import { Award, Download, Calendar, Share2, Printer, Loader2, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

export default function CertificatesPage() {
  const { locale, dir, t } = useI18n()
  const { data: apiCertificates } = useApi<any[]>(() => api.getMyCertificates())
  const [downloading, setDownloading] = useState<string | null>(null)
  const [shared, setShared] = useState<string | null>(null)

  const toStringOrName = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
      return String((val as { name: string }).name)
    return ""
  }

  const certificates = useMemo(() => {
    const raw = Array.isArray(apiCertificates) ? apiCertificates : (apiCertificates as { data?: unknown[] })?.data
    if (!raw || !Array.isArray(raw)) return []
    return raw.map((cert: Record<string, unknown>) => {
      const course = cert.course as Record<string, unknown> | undefined
      const instAr = toStringOrName(cert.instructorAr) || toStringOrName(cert.instructor) || toStringOrName(course?.instructor) || ""
      const instEn = toStringOrName(cert.instructorEn) || toStringOrName(cert.instructor) || toStringOrName(course?.instructor) || ""
      return {
        id: (cert.id as string) ?? "",
        course: {
          titleAr: (course?.titleAr as string) ?? (cert.courseTitle as string) ?? (course?.title as string) ?? "",
          titleEn: (course?.titleEn as string) ?? (cert.courseTitle as string) ?? (course?.title as string) ?? "",
          instructorAr: instAr,
          instructorEn: instEn,
        },
        date: (cert.issuedAt as string) ?? (cert.date as string) ?? (cert.createdAt as string) ?? "",
        certNumber: (cert.certificateNo as string) ?? (cert.certificateNumber as string) ?? (cert.certNumber as string) ?? (cert.id as string) ?? "",
      }
    })
  }, [apiCertificates])

  const formatDate = (d: string) => {
    if (!d) return ""
    try {
      return new Date(d).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
    } catch {
      return d
    }
  }

  const handleDownload = async (id: string, certNo: string) => {
    if (!id) return
    setDownloading(id)
    try {
      await api.downloadCertificate(id, `certificate-${certNo}.pdf`)
    } catch {
      window.open(`${typeof window !== "undefined" ? window.location.origin : ""}/verify-certificate/${certNo}`, "_blank")
    } finally {
      setDownloading(null)
    }
  }

  const handleShare = async (certNo: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/verify-certificate/${certNo}` : ""
    try {
      await navigator.clipboard.writeText(url)
      setShared(certNo)
      setTimeout(() => setShared(null), 2000)
    } catch {}
  }

  const handlePrint = (certNo: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/verify-certificate/${certNo}` : ""
    window.open(url, "_blank", "width=800,height=600")
  }

  return (
    <div dir={dir}>
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.certificates")}</h2>

      <div className="space-y-6">
        {certificates.map((cert, i) => (
          <m.div
            key={cert.id || cert.certNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="bg-white rounded-[20px] border border-border overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-primary to-primary/90 p-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {locale === "ar" ? cert.course.titleAr : cert.course.titleEn}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {safeStr(locale === "ar" ? cert.course.instructorAr : cert.course.instructorEn)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{locale === "ar" ? "تاريخ الإصدار:" : "Issued:"} {formatDate(cert.date)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "رقم الشهادة:" : "Certificate #"} {cert.certNumber}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleShare(cert.certNumber)}
                  disabled={!!shared}
                >
                  {shared === cert.certNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  {shared === cert.certNumber ? (locale === "ar" ? "تم النسخ" : "Copied!") : (locale === "ar" ? "مشاركة" : "Share")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handlePrint(cert.certNumber)}
                >
                  <Printer className="w-4 h-4" />
                  {locale === "ar" ? "طباعة" : "Print"}
                </Button>
                <Button
                  className="bg-gradient-to-r from-primary to-primary/90 text-white gap-2"
                  size="sm"
                  onClick={() => handleDownload(cert.id, cert.certNumber)}
                  disabled={!cert.id || !!downloading}
                >
                  {downloading === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t("dashboard.download")}
                </Button>
              </div>
            </div>
          </m.div>
        ))}
      </div>

      {certificates.length === 0 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-muted/50 rounded-[20px] border border-dashed border-border p-8 text-center"
        >
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("dashboard.completeCourse")}</p>
        </m.div>
      )}
    </div>
  )
}
