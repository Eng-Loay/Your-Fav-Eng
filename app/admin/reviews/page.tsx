"use client"

import React, { useState, useMemo } from "react"
import { m } from "framer-motion"
import {
  Star,
  Search,
  CheckCircle,
  XCircle,
  Home,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const PAGE_SIZE = 10

export default function AdminReviewsPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [actingId, setActingId] = useState<string | null>(null)

  const { data: reviewsRes, loading, error, refetch } = useApi(
    () => api.getAdminReviews({ status: statusFilter, page, limit: 50 }),
    { deps: [statusFilter, page] }
  )

  const reviewsList = useMemo(() => {
    const raw = reviewsRes as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []
    return list.map((r: any) => {
      const userVal = r.user
      const userName = typeof userVal === "string" ? userVal : userVal?.name ?? ""
      const courseVal = r.course
      const courseTitle = typeof courseVal === "object" ? (courseVal?.titleAr ?? courseVal?.title ?? "") : (courseVal ?? "")
      return {
        id: r.id,
        userName,
        courseTitle,
        rating: r.rating ?? 5,
        comment: r.comment ?? "",
        status: r.status ?? "PENDING",
        showOnHomepage: !!r.showOnHomepage,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US") : "",
      }
    })
  }, [reviewsRes, isAr])

  const filtered = useMemo(() => {
    if (!search.trim()) return reviewsList
    const s = search.toLowerCase()
    return reviewsList.filter(
      (r) =>
        r.userName?.toLowerCase().includes(s) ||
        r.courseTitle?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s)
    )
  }, [reviewsList, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleApprove = async (id: string) => {
    setActingId(id)
    try {
      const res = await api.approveAdminReview(id)
      if (res?.success) {
        showToast(isAr ? "تم قبول التقييم" : "Review approved", "success")
        refetch()
      } else {
        showToast(isAr ? "فشل في القبول" : "Failed to approve", "error")
      }
    } catch {
      showToast(isAr ? "فشل في القبول" : "Failed to approve", "error")
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setActingId(id)
    try {
      const res = await api.rejectAdminReview(id)
      if (res?.success) {
        showToast(isAr ? "تم رفض التقييم" : "Review rejected", "success")
        refetch()
      } else {
        showToast(isAr ? "فشل في الرفض" : "Failed to reject", "error")
      }
    } catch {
      showToast(isAr ? "فشل في الرفض" : "Failed to reject", "error")
    } finally {
      setActingId(null)
    }
  }

  const handleToggleHomepage = async (id: string, show: boolean) => {
    setActingId(id)
    try {
      const res = await api.setAdminReviewShowOnHomepage(id, show)
      if (res?.success) {
        showToast(
          show ? (isAr ? "سيظهر في الصفحة الرئيسية" : "Will show on homepage") : (isAr ? "تم إخفاؤه من الرئيسية" : "Hidden from homepage"),
          "success"
        )
        refetch()
      } else {
        showToast(isAr ? "فشل التحديث" : "Update failed", "error")
      }
    } catch {
      showToast(isAr ? "فشل التحديث" : "Update failed", "error")
    } finally {
      setActingId(null)
    }
  }

  if (loading && !reviewsList.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={refetch} variant="outline">
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    )
  }

  return (
    <m.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {isAr ? "مراجعة التقييمات" : "Review Management"}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr ? "قبول أو رفض التقييمات وعرضها في الصفحة الرئيسية" : "Approve or reject reviews and show them on homepage"}
        </p>
      </m.div>

      <m.div variants={fadeUp} className="flex flex-wrap gap-3">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-primary/50"
            }`}
          >
            {s === "PENDING" && (isAr ? "قيد المراجعة" : "Pending")}
            {s === "APPROVED" && (isAr ? "مقبولة" : "Approved")}
            {s === "REJECTED" && (isAr ? "مرفوضة" : "Rejected")}
          </button>
        ))}
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={isAr ? "بحث..." : "Search..."}
              className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Star className="w-12 h-12 text-[#94A3B8] mb-4" />
            <p className="text-sm font-semibold text-[#0F172A]">
              {isAr ? "لا توجد تقييمات" : "No reviews"}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              {statusFilter === "PENDING"
                ? (isAr ? "لا توجد تقييمات بانتظار المراجعة" : "No reviews pending approval")
                : (isAr ? "لا توجد تقييمات بهذه الحالة" : "No reviews with this status")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطالب" : "Student"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدورة" : "Course"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "التقييم" : "Rating"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "التعليق" : "Comment"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="text-start px-3 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{r.userName}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{r.courseTitle}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold">{r.rating}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B] max-w-[200px] truncate">{r.comment}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{r.createdAt}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {statusFilter === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                disabled={actingId === r.id}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50"
                              >
                                {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                disabled={actingId === r.id}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {statusFilter === "APPROVED" && (
                            <button
                              onClick={() => handleToggleHomepage(r.id, !r.showOnHomepage)}
                              disabled={actingId === r.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                r.showOnHomepage ? "bg-primary text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                              }`}
                            >
                              {actingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Home className="w-3 h-3" />}
                              {r.showOnHomepage ? (isAr ? "في الرئيسية" : "On Home") : (isAr ? "عرض في الرئيسية" : "Show on Home")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between px-5 py-3 border-t border-[#E2E8F0]/40">
                <p className="text-xs text-[#94A3B8]">
                  {isAr ? `عرض ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} من ${filtered.length}` : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium flex items-center px-2">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </m.div>
    </m.div>
  )
}
