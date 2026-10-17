"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { SubmissionsView, type SubmissionsAssignment } from "@/components/assignments/submissions-view"

type AdminAssignmentDetail = SubmissionsAssignment & {
  titleAr?: string | null
  course?: { title?: string; titleAr?: string | null } | null
}

export default function AdminAssignmentSubmissionsPage() {
  const params = useParams()
  const id = params?.id as string
  const { locale, dir } = useI18n()
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft
  const { data, loading } = useApi(() => api.getAdminCourseAssignmentSubmissions(id), { deps: [id], immediate: !!id })
  const assignment = data as AdminAssignmentDetail | null

  if (loading || !assignment) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <p className="text-[#64748B]">{locale === "ar" ? "الواجب غير موجود" : "Assignment not found"}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/assignments" className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#64748B] transition-colors hover:text-[#0F172A]">
          <BackIcon className="h-4 w-4" />
          {locale === "ar" ? "العودة للواجبات" : "Back to Assignments"}
        </Link>
        <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" && assignment.titleAr ? assignment.titleAr : assignment.title}</h2>
        <p className="mt-1 text-sm text-[#64748B]">{locale === "ar" && assignment.course?.titleAr ? assignment.course.titleAr : assignment.course?.title}</p>
      </div>
      <SubmissionsView assignment={assignment} />
    </div>
  )
}
