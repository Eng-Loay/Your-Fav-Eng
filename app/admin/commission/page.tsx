"use client"

import React, { useState, useEffect } from "react"
import { m } from "framer-motion"
import Link from "next/link"
import {
  Percent,
  Users,
  Layers,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  Calculator,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

type CommissionType = "percentage" | "per_student" | "tiered"

interface Tier {
  from: number
  to: number | null
  amount: number
}

export default function AdminCommissionPage() {
  const { locale, dir } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const [type, setType] = useState<CommissionType>("percentage")
  const [percentage, setPercentage] = useState(30)
  const [amountPerStudent, setAmountPerStudent] = useState(0)
  const [tiers, setTiers] = useState<Tier[]>([{ from: 1, to: 10, amount: 100 }, { from: 11, to: 30, amount: 125 }])
  const [exampleRevenue, setExampleRevenue] = useState(10000)
  const [exampleStudents, setExampleStudents] = useState(50)
  const [preview, setPreview] = useState<{ platformFee: number; instructorEarnings: number; detail: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: configRes, loading: loadingConfig } = useApi(() => api.getCommissionConfig())

  useEffect(() => {
    const c = configRes as { type?: string; percentage?: number; amountPerStudent?: number; tiers?: Tier[] } | undefined
    if (!c) return
    setType((c.type as CommissionType) || "percentage")
    setPercentage(c.percentage ?? 30)
    setAmountPerStudent(c.amountPerStudent ?? 0)
    setTiers(Array.isArray(c.tiers) && c.tiers.length > 0 ? c.tiers : [{ from: 1, to: 10, amount: 100 }])
  }, [configRes])

  useEffect(() => {
    const run = async () => {
      const config = { type, percentage, amountPerStudent, tiers }
      const res = await api.previewCommission(config, exampleRevenue, exampleStudents)
      if (res?.data) setPreview(res.data)
    }
    run()
  }, [type, percentage, amountPerStudent, tiers, exampleRevenue, exampleStudents])

  const addTier = () => {
    const lastTo = tiers.length > 0 ? (tiers[tiers.length - 1].to ?? tiers[tiers.length - 1].from) : 0
    setTiers([...tiers, { from: lastTo + 1, to: lastTo + 20, amount: 150 }])
  }

  const removeTier = (i: number) => {
    setTiers(tiers.filter((_, idx) => idx !== i))
  }

  const updateTier = (i: number, field: keyof Tier, value: number | null) => {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const config = { type, percentage, amountPerStudent, tiers }
      const res = await api.updateCommissionConfig(config)
      if (res?.success) {
        showToast(isAr ? "تم حفظ إعدادات العمولة بنجاح" : "Commission settings saved successfully", "success")
      } else {
        showToast(res?.message || (isAr ? "فشل الحفظ" : "Failed to save"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ أثناء الحفظ" : "An error occurred", "error")
    } finally {
      setSaving(false)
    }
  }

  const typeOptions: { value: CommissionType; icon: React.ElementType; labelAr: string; labelEn: string }[] = [
    { value: "percentage", icon: Percent, labelAr: "نسبة مئوية", labelEn: "Percentage" },
    { value: "per_student", icon: Users, labelAr: "قيمة ثابتة لكل طالب", labelEn: "Fixed per student" },
    { value: "tiered", icon: Layers, labelAr: "شرائح", labelEn: "Tiers" },
  ]

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div dir={dir} className="max-w-3xl mx-auto space-y-6">
      <m.div {...fadeUp}>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </Link>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {isAr ? "حساب عمولات المدربين والمدرسين" : "Instructor & Teacher Commission"}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr
            ? "اختر طريقة حساب عمولة المنصة: نسبة مئوية، قيمة ثابتة لكل طالب، أو شرائح متدرجة"
            : "Choose how platform commission is calculated: percentage, fixed per student, or tiered"}
        </p>
      </m.div>

      <m.div {...fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6 space-y-6">
        <div>
          <label className="text-sm font-semibold text-[#0F172A] block mb-3">
            {isAr ? "نوع العمولة" : "Commission Type"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                  type === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-[#E2E8F0] hover:border-[#94A3B8]"
                }`}
              >
                <opt.icon className={`w-6 h-6 ${type === opt.value ? "text-primary" : "text-[#64748B]"}`} />
                <span className="font-medium text-[#0F172A]">{isAr ? opt.labelAr : opt.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {type === "percentage" && (
          <div>
            <label className="text-sm font-semibold text-[#0F172A] block mb-2">
              {isAr ? "النسبة المئوية (%)" : "Percentage (%)"}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value) || 0)}
              className="w-32 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
            <p className="text-xs text-[#64748B] mt-1">
              {isAr ? "عمولة المنصة من إيرادات المدرب/المدرس" : "Platform commission from instructor/teacher revenue"}
            </p>
          </div>
        )}

        {type === "per_student" && (
          <div>
            <label className="text-sm font-semibold text-[#0F172A] block mb-2">
              {isAr ? "القيمة لكل طالب" : "Amount per student"}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amountPerStudent}
              onChange={(e) => setAmountPerStudent(Number(e.target.value) || 0)}
              className="w-40 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-[#64748B] mt-1">
              {isAr ? "مبلغ ثابت يُخصم عن كل طالب مسجل" : "Fixed amount deducted per enrolled student"}
            </p>
          </div>
        )}

        {type === "tiered" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#0F172A]">
                {isAr ? "الشرائح" : "Tiers"}
              </label>
              <Button variant="outline" size="sm" onClick={addTier} className="gap-1.5 rounded-lg">
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة شريحة" : "Add tier"}
              </Button>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              {isAr
                ? "مثال: أول 10 طلاب ب 100 جنيه، الطلاب 11-30 ب 125 جنيه"
                : "E.g. first 10 students at 100, students 11-30 at 125"}
            </p>
            <div className="space-y-3">
              {tiers.map((t, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                  <input
                    type="number"
                    min={1}
                    value={t.from}
                    onChange={(e) => updateTier(i, "from", Number(e.target.value) || 1)}
                    className="w-20 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm"
                    placeholder={isAr ? "من" : "From"}
                  />
                  <span className="text-[#64748B]">–</span>
                  <input
                    type="number"
                    min={t.from}
                    value={t.to ?? ""}
                    onChange={(e) => updateTier(i, "to", e.target.value ? Number(e.target.value) : null)}
                    className="w-20 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm"
                    placeholder={isAr ? "إلى" : "To"}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={t.amount}
                    onChange={(e) => updateTier(i, "amount", Number(e.target.value) || 0)}
                    className="w-24 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm"
                    placeholder={isAr ? "المبلغ" : "Amount"}
                  />
                  <span className="text-xs text-[#64748B]">{isAr ? "لكل طالب" : "/student"}</span>
                  <button
                    onClick={() => removeTier(i)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="font-semibold text-[#0F172A]">{isAr ? "معاينة" : "Preview"}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#64748B] block mb-1">{isAr ? "إيرادات مثال" : "Example revenue"}</label>
              <input
                type="number"
                min={0}
                value={exampleRevenue}
                onChange={(e) => setExampleRevenue(Number(e.target.value) || 0)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748B] block mb-1">{isAr ? "عدد الطلاب مثال" : "Example students"}</label>
              <input
                type="number"
                min={0}
                value={exampleStudents}
                onChange={(e) => setExampleStudents(Number(e.target.value) || 0)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          {preview && (
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-emerald-200 space-y-1">
              <p className="text-sm">
                <span className="text-[#64748B]">{isAr ? "عمولة المنصة:" : "Platform fee:"}</span>{" "}
                <span className="font-bold text-emerald-700">{preview.platformFee}</span>
              </p>
              <p className="text-sm">
                <span className="text-[#64748B]">{isAr ? "صافي المدرب:" : "Instructor net:"}</span>{" "}
                <span className="font-bold text-emerald-700">{preview.instructorEarnings}</span>
              </p>
              <p className="text-xs text-[#64748B] mt-2">{preview.detail}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isAr ? "حفظ الإعدادات" : "Save Settings"}
          </Button>
        </div>
      </m.div>
    </div>
  )
}
