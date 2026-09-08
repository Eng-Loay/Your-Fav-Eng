"use client"

import React, { useState, useRef, useEffect } from "react"
import { m } from "framer-motion"
import {
  Tag,
  Plus,
  Loader2,
  Trash2,
  Printer,
  RefreshCw,
  CheckSquare,
  Square,
  X,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi, api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

interface CouponItem {
  id: string
  code: string
  discount: number
  discountType: string
  maxUses?: number
  usedCount: number
  minPurchase?: number
  expiresAt?: string
  isActive: boolean
  createdAt: string
  courseIds?: Array<{ course: { id: string; title: string; titleAr?: string } }>
}

export default function CouponsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [usedFilter, setUsedFilter] = useState<boolean | "all">("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [printCoupons, setPrintCoupons] = useState<CouponItem[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const printRef = useRef<HTMLDivElement>(null)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [form, setForm] = useState({
    code: "",
    discount: 20,
    discountType: "percent",
    maxUses: 1,
    minPurchase: "",
    expiresAt: "",
    courseIds: [] as string[],
  })

  const [bulkForm, setBulkForm] = useState({
    count: 10,
    discount: 20,
    discountType: "percent",
    maxUses: 1,
    minPurchase: "",
    expiresAt: "",
    courseIds: [] as string[],
  })

  const { data: res, loading, refetch } = useApi<{ data: CouponItem[]; total: number }>(
    () =>
      api.getAdminCoupons({
        used: usedFilter === "all" ? undefined : usedFilter,
        limit: 100,
      }),
    { immediate: true, deps: [usedFilter] }
  )

  const { data: coursesRes } = useApi<{ data?: Array<{ id: string; title: string; titleAr?: string }> }>(
    () => api.getAdminCourses({}),
    { immediate: true }
  )

  const couponsRaw = (res as { data?: { data?: CouponItem[] } })?.data
  const coupons = Array.isArray(couponsRaw) ? couponsRaw : couponsRaw?.data ?? []

  const toggleSelectAll = () => {
    if (selectedIds.size === coupons.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(coupons.map((c) => c.id)))
  }

  const selectedCoupons = coupons.filter((c) => selectedIds.has(c.id))
  const coursesRaw = (coursesRes as { data?: { data?: Array<{ id: string; title: string; titleAr?: string }> } })?.data
  const courses = Array.isArray(coursesRaw) ? coursesRaw : coursesRaw?.data ?? []

  const [saving, setSaving] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!form.code.trim()) {
      showToast(isAr ? "أدخل كود الكوبون" : "Enter coupon code", "error")
      return
    }
    setSaving(true)
    try {
      const r = await api.createAdminCoupon({
        code: form.code.trim().toUpperCase(),
        discount: form.discount,
        discountType: form.discountType,
        maxUses: form.maxUses,
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        expiresAt: form.expiresAt || undefined,
        courseIds: form.courseIds.length ? form.courseIds : undefined,
      })
      if (r.success) {
        showToast(isAr ? "تم إنشاء الكوبون" : "Coupon created")
        setShowCreate(false)
        setForm({ code: "", discount: 20, discountType: "percent", maxUses: 1, minPurchase: "", expiresAt: "", courseIds: [] })
        refetch()
      } else {
        showToast(r.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleBulkCreate = async () => {
    if (bulkForm.count < 1 || bulkForm.count > 500) {
      showToast(isAr ? "العدد بين 1 و 500" : "Count between 1 and 500", "error")
      return
    }
    setBulkSaving(true)
    try {
      const r = await api.bulkCreateAdminCoupons({
        count: bulkForm.count,
        discount: bulkForm.discount,
        discountType: bulkForm.discountType,
        maxUses: bulkForm.maxUses,
        minPurchase: bulkForm.minPurchase ? Number(bulkForm.minPurchase) : undefined,
        expiresAt: bulkForm.expiresAt || undefined,
        courseIds: bulkForm.courseIds.length ? bulkForm.courseIds : undefined,
      })
      if (r.success) {
        showToast(isAr ? `تم إنشاء ${bulkForm.count} كوبون` : `${bulkForm.count} coupons created`)
        setShowBulk(false)
        setBulkForm({ ...bulkForm, count: 10 })
        refetch()
      } else {
        showToast(r.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setBulkSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const r = await api.deleteAdminCoupon(id)
      if (r.success) {
        showToast(isAr ? "تم الحذف" : "Deleted")
        refetch()
      } else {
        showToast(r.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setDeleting(null)
    }
  }

  const handlePrint = (items: CouponItem[]) => {
    setPrintCoupons(items)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()
      })
    })
  }

  useEffect(() => {
    const handler = () => setPrintCoupons(null)
    window.addEventListener("afterprint", handler)
    return () => window.removeEventListener("afterprint", handler)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <m.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isAr ? "الكوبونات" : "Coupons"}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {isAr ? "إدارة كوبونات الخصم والطباعة" : "Manage discount coupons and print"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setShowBulk(true)} className="gap-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED]">
            <Tag className="h-4 w-4" />
            {isAr ? "إنشاء بالجملة" : "Bulk Create"}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            {isAr ? "كوبون جديد" : "New Coupon"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl bg-[#F1F5F9] p-1">
        {[
          { v: "all" as const, ar: "الكل", en: "All" },
          { v: false as const, ar: "غير مستخدم", en: "Unused" },
          { v: true as const, ar: "مستخدم", en: "Used" },
        ].map(({ v, ar, en }) => (
          <button
            key={String(v)}
            onClick={() => setUsedFilter(v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              usedFilter === v ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {isAr ? ar : en}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
            <Tag className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm font-medium">{isAr ? "لا توجد كوبونات" : "No coupons"}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]/60">
            {/* Header with select all */}
            <div className="flex items-center gap-4 border-b border-[#E2E8F0]/60 bg-[#F8FAFC]/60 px-4 py-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white hover:text-[#0F172A] transition-colors"
              >
                {selectedIds.size === coupons.length ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                {isAr ? "تحديد الكل" : "Select all"}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-[#64748B]">
                  {selectedIds.size} {isAr ? "محدد" : "selected"}
                </span>
              )}
            </div>
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleSelect(c.id)}
                    className="shrink-0 rounded p-1 hover:bg-[#F1F5F9] transition-colors"
                  >
                    {selectedIds.has(c.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-[#94A3B8]" />
                    )}
                  </button>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
                    <Tag className="h-6 w-6 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-[#0F172A]">{c.code}</p>
                    <p className="text-sm text-[#64748B]">
                      {c.discountType === "percent" || c.discountType === "percentage"
                        ? `${c.discount}%`
                        : c.discount}{" "}
                      {c.usedCount}/{c.maxUses ?? "∞"} {isAr ? "استخدام" : "uses"}
                    </p>
                    {c.courseIds?.length ? (
                      <p className="mt-1 text-xs text-[#94A3B8]">
                        {isAr ? "دورات: " : "Courses: "}
                        {c.courseIds.map((cc) => (locale === "ar" ? cc.course.titleAr ?? cc.course.title : cc.course.title)).join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint([c])}
                    className="gap-1.5 rounded-xl"
                  >
                    <Printer className="h-4 w-4" />
                    {isAr ? "طباعة" : "Print"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(c.id)}
                    disabled={!!deleting}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {coupons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handlePrint(selectedCoupons.length > 0 ? selectedCoupons : coupons)}
            className="gap-2 rounded-xl"
          >
            <Printer className="h-4 w-4" />
            {selectedCoupons.length > 0
              ? isAr
                ? `طباعة ${selectedCoupons.length} كوبون`
                : `Print ${selectedCoupons.length} coupon${selectedCoupons.length > 1 ? "s" : ""}`
              : isAr
                ? "طباعة الكل"
                : "Print all"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedIds(new Set(coupons.filter((c) => c.usedCount === 0).map((c) => c.id)))
            }}
            className="gap-2 rounded-xl"
          >
            {isAr ? "تحديد غير المستخدمة" : "Select unused"}
          </Button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{isAr ? "كوبون جديد" : "New Coupon"}</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-[#F1F5F9]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>{isAr ? "كود الكوبون" : "Code"}</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isAr ? "الخصم" : "Discount"}</Label>
                  <Input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm((p) => ({ ...p, discount: Number(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isAr ? "النوع" : "Type"}</Label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>{isAr ? "الحد الأقصى للاستخدام" : "Max uses"}</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: Number(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isAr ? "الحد الأدنى للشراء (اختياري)" : "Min purchase (optional)"}</Label>
                <Input
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) => setForm((p) => ({ ...p, minPurchase: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isAr ? "صلاحية حتى (اختياري)" : "Expires (optional)"}</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAr ? "إنشاء" : "Create"}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{isAr ? "إنشاء بالجملة" : "Bulk Create"}</h3>
              <button onClick={() => setShowBulk(false)} className="rounded-lg p-1 hover:bg-[#F1F5F9]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>{isAr ? "العدد (مثلاً 100)" : "Count (e.g. 100)"}</Label>
                <Input
                  type="number"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm((p) => ({ ...p, count: Math.min(500, Math.max(1, Number(e.target.value) || 1)) }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isAr ? "الخصم" : "Discount"}</Label>
                  <Input
                    type="number"
                    value={bulkForm.discount}
                    onChange={(e) => setBulkForm((p) => ({ ...p, discount: Number(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isAr ? "النوع" : "Type"}</Label>
                  <select
                    value={bulkForm.discountType}
                    onChange={(e) => setBulkForm((p) => ({ ...p, discountType: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>{isAr ? "الحد الأقصى للاستخدام" : "Max uses"}</Label>
                <Input
                  type="number"
                  value={bulkForm.maxUses}
                  onChange={(e) => setBulkForm((p) => ({ ...p, maxUses: Number(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{isAr ? "صلاحية حتى (اختياري)" : "Expires (optional)"}</Label>
                <Input
                  type="datetime-local"
                  value={bulkForm.expiresAt}
                  onChange={(e) => setBulkForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulk(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleBulkCreate} disabled={bulkSaving} className="gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED]">
                {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAr ? "إنشاء" : "Create"}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Print area - hidden until print */}
      {printCoupons && (
        <div ref={printRef} className="hidden print:block">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .print-coupons, .print-coupons * { visibility: visible !important; }
              .print-coupons { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
              .print-coupon-card { break-inside: avoid; page-break-inside: avoid; }
              @page { size: A4; margin: 12mm; }
            }
          `}</style>
          <div className="print-coupons grid gap-3 p-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", fontSize: "11px" }}>
            {printCoupons.map((c) => (
              <div
                key={c.id}
                className="print-coupon-card flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#334155] p-4"
                style={{ minHeight: "70px" }}
              >
                <img src="/company-logo.jpeg" alt="" className="mb-2 h-8 w-8 object-contain" />
                <span className="font-mono font-bold text-base">{c.code}</span>
                <span className="text-[#475569] font-medium">
                  {c.discountType === "percent" || c.discountType === "percentage" ? `${c.discount}%` : c.discount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </m.div>
  )
}
