"use client"

import { useEffect, useMemo, useState } from "react"
import { m } from "framer-motion"
import { Award, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import { MembershipWalletCard, type MembershipWalletItem } from "@/components/dashboard/membership-wallet-card"
import { MembershipAccessGuard } from "@/components/dashboard/membership-access-guard"
import { downloadMembershipPdf } from "@/lib/membership-download"
import { parseMembershipList } from "@/lib/membership-utils"

type CoursePreview = { id: string; title: string; titleAr?: string; thumbnail?: string }

export default function MembershipPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const { user } = useStore()
  const { data: apiMemberships, loading } = useApi<any[]>(() => api.getMyMemberships())
  const [downloading, setDownloading] = useState<string | null>(null)
  const [packageCourses, setPackageCourses] = useState<Record<string, CoursePreview[]>>({})

  const memberships = useMemo((): MembershipWalletItem[] => {
    return parseMembershipList(apiMemberships).map((m) => ({
      id: m.id,
      membershipNo: m.membershipNo,
      pdfUrl: m.pdfUrl,
      status: m.status,
      issuedAt: m.issuedAt,
      expiresAt: m.expiresAt,
      coursesUsed: 0,
      package: m.package as MembershipWalletItem["package"],
      packageId: m.packageId,
    }))
  }, [apiMemberships])

  useEffect(() => {
    memberships.forEach((mem) => {
      const pkgId = (mem as { packageId?: string }).packageId
        || (mem.package as { id?: string } | undefined)?.id
      if (!pkgId || packageCourses[pkgId]) return
      api.getMembershipPackageCourses(pkgId).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setPackageCourses((prev) => ({ ...prev, [pkgId]: res.data }))
        }
      }).catch(() => {})
    })
  }, [memberships])

  const downloadPdf = async (membershipId: string, membershipNo: string) => {
    setDownloading(membershipNo)
    try {
      await downloadMembershipPdf({
        membershipId,
        membershipNo,
        memberName: user?.name || user?.email,
      })
    } catch {
      // ignore — user can retry
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  return (
    <MembershipAccessGuard>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.membership")}</h1>
        <p className="text-sm text-slate-500">
          {isAr ? "محفظة عضويتك — حمّل شهادة PDF وادخل دوراتك" : "Your membership wallet — download PDF and access bundled courses"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-12 text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-primary/30" />
          <p className="text-slate-600">{isAr ? "لا توجد عضوية بعد" : "No membership yet"}</p>
          <p className="mt-1 text-sm text-slate-400">
            {isAr ? "تواصل معنا للانضمام لباقة عضوية" : "Contact us to join a membership package"}
          </p>
          <Button asChild className="mt-4">
            <Link href="/services">{isAr ? "عرض الباقات" : "View packages"}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {memberships.map((mem) => {
            const pkgId = (mem as { packageId?: string }).packageId
              || (mem.package as { id?: string } | undefined)?.id
            const courses = pkgId ? packageCourses[pkgId] || [] : []
            return (
              <m.div key={mem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <MembershipWalletCard membership={mem} downloading={downloading} onDownload={downloadPdf} />

                {courses.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {isAr ? "دورات الباقة" : "Bundle courses"}
                    </h3>
                    <ul className="space-y-2">
                      {courses.map((course) => (
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
                  </div>
                )}
              </m.div>
            )
          })}
        </div>
      )}
    </div>
    </MembershipAccessGuard>
  )
}
