"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { m, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Package,
  Layers,
  DollarSign,
  Settings,
  Loader2,
  Sparkles,
  ChevronLeft,
  Plus,
  FileDown,
  Truck,
  Upload,
  File,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import MediaUploader from "@/components/admin/courses/media-uploader"

const STEPS = [
  { id: 1, title: "المعلومات الأساسية", icon: Package },
  { id: 2, title: "التصنيف والتفاصيل", icon: Layers },
  { id: 3, title: "التسعير والمخزون", icon: DollarSign },
  { id: 4, title: "الإعدادات", icon: Settings },
]

interface Category {
  id: string
  name: string
  nameEn: string
  service: string
}

interface FormData {
  title: string
  titleAr: string
  description: string
  thumbnail: string
  category: string
  type: "DIGITAL" | "PHYSICAL"
  fileUrl: string
  price: number
  stock: number
  status: string
}

const initialForm: FormData = {
  title: "",
  titleAr: "",
  description: "",
  thumbnail: "",
  category: "",
  type: "PHYSICAL",
  fileUrl: "",
  price: 0,
  stock: 0,
  status: "active",
}

export default function NewProductPage() {
  const router = useRouter()
  const { showToast } = useStore()
  const { currency } = usePlatformCurrency()
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [storeCategories, setStoreCategories] = useState<Category[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileName, setFileName] = useState("")

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.request("/settings/categories?service=store")
        if (res.success) {
          const data = res.data as any
          const items = Array.isArray(data) ? data : data?.data || []
          setStoreCategories(items)
        }
      } catch {}
    }
    fetchCategories()
  }, [])

  const update = (updates: Partial<FormData>) => {
    setForm((f) => ({ ...f, ...updates }))
    const keys = Object.keys(updates) as (keyof FormData)[]
    setErrors((prev) => {
      const next = { ...prev }
      keys.forEach((k) => delete next[k])
      return next
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 1 && !form.titleAr.trim() && !form.title.trim()) newErrors.title = "اسم المنتج مطلوب"
    if (step === 3 && (isNaN(form.price) || form.price < 0)) newErrors.price = "السعر يجب أن يكون رقم صالح"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, 4))
  }
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      update({ fileUrl: reader.result as string })
      setUploadingFile(false)
    }
    reader.onerror = () => {
      showToast("خطأ في رفع الملف", "error")
      setUploadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!validateStep(currentStep)) return
    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        title: form.title.trim() || form.titleAr.trim(),
        titleAr: form.titleAr.trim() || form.title.trim(),
        description: form.description.trim(),
        thumbnail: form.thumbnail,
        category: form.category,
        type: form.type,
        price: form.price,
        currency,
        status: form.status,
      }

      if (form.type === "PHYSICAL") {
        body.stock = form.stock
      }
      if (form.type === "DIGITAL" && form.fileUrl) {
        body.fileUrl = form.fileUrl
      }

      const res = await api.request("/admin/products", { method: "POST", body })
      if (res.success) {
        setShowSuccess(true)
      } else {
        showToast(res.message || "حدث خطأ أثناء إنشاء المنتج", "error")
      }
    } catch {
      showToast("حدث خطأ غير متوقع", "error")
    } finally {
      setSaving(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <m.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">المعلومات الأساسية</h2>
              <p className="text-sm text-slate-500">أدخل اسم المنتج ووصفه وصورته</p>
            </div>

            <div className="space-y-4">
              {/* Product Type */}
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">نوع المنتج *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => update({ type: "PHYSICAL" })}
                    className={`p-4 rounded-xl border-2 text-start transition-all ${
                      form.type === "PHYSICAL"
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${form.type === "PHYSICAL" ? "bg-primary/10" : "bg-slate-100"}`}>
                        <Truck className={`w-5 h-5 ${form.type === "PHYSICAL" ? "text-primary" : "text-slate-400"}`} />
                      </div>
                      <p className="text-sm font-bold text-slate-900">منتج مادي</p>
                    </div>
                    <p className="text-[11px] text-slate-400">منتج يتم شحنه للعميل (كتاب، أداة، جهاز...)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ type: "DIGITAL" })}
                    className={`p-4 rounded-xl border-2 text-start transition-all ${
                      form.type === "DIGITAL"
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${form.type === "DIGITAL" ? "bg-violet-100" : "bg-slate-100"}`}>
                        <FileDown className={`w-5 h-5 ${form.type === "DIGITAL" ? "text-violet-600" : "text-slate-400"}`} />
                      </div>
                      <p className="text-sm font-bold text-slate-900">منتج رقمي</p>
                    </div>
                    <p className="text-[11px] text-slate-400">ملف يتم تحميله بعد الدفع (PDF, ZIP, تصميم...)</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">اسم المنتج (عربي) *</label>
                <Input
                  value={form.titleAr}
                  onChange={(e) => update({ titleAr: e.target.value })}
                  placeholder="مثال: كتاب الميكانيكا التطبيقية"
                  className={`rounded-xl h-11 ${errors.title ? "border-red-300" : ""}`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">اسم المنتج (إنجليزي)</label>
                <Input
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g. Applied Mechanics Book"
                  className="rounded-xl h-11"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">وصف المنتج</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="اكتب وصفاً مفصلاً للمنتج..."
                  className="rounded-xl min-h-[120px] resize-none"
                />
              </div>

              <MediaUploader
                value={form.thumbnail}
                onChange={(url) => update({ thumbnail: url })}
                label="صورة المنتج"
                hint="يفضل صورة مربعة بدقة 800×800 على الأقل"
              />
            </div>
          </m.div>
        )

      case 2:
        return (
          <m.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">التصنيف والتفاصيل</h2>
              <p className="text-sm text-slate-500">حدد تصنيف المنتج والتفاصيل</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">التصنيف</label>
                {storeCategories.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {storeCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => update({ category: cat.name })}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          form.category === cat.name
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-700">
                      لا توجد تصنيفات للمتجر.{" "}
                      <Link href="/admin/categories" className="underline font-semibold">
                        أضف تصنيفات أولاً
                      </Link>
                    </p>
                  </div>
                )}
                <Input
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                  placeholder="أو اكتب التصنيف يدوياً"
                  className="rounded-xl h-11 mt-2"
                />
              </div>

              {/* Digital file upload */}
              {form.type === "DIGITAL" && (
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-2">
                    ملف المنتج الرقمي *
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    ارفع الملف الذي سيتم إتاحته للمستخدم بعد الدفع (PDF, ZIP, DOC, PPT...)
                  </p>

                  {form.fileUrl ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 border border-violet-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <File className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{fileName || "ملف مرفوع"}</p>
                        <p className="text-[11px] text-violet-500">جاهز — سيتاح للمستخدم بعد الدفع</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          update({ fileUrl: "" })
                          setFileName("")
                        }}
                        className="p-1.5 rounded-lg hover:bg-violet-100"
                      >
                        <X className="w-4 h-4 text-violet-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 cursor-pointer hover:bg-violet-50 transition-colors">
                      {uploadingFile ? (
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-violet-400" />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700">
                          {uploadingFile ? "جارٍ الرفع..." : "اضغط لرفع الملف"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PDF, ZIP, DOC, PPT, XLSX</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </m.div>
        )

      case 3:
        return (
          <m.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">التسعير{form.type === "PHYSICAL" ? " والمخزون" : ""}</h2>
              <p className="text-sm text-slate-500">
                {form.type === "DIGITAL" ? "حدد سعر المنتج الرقمي" : "حدد سعر المنتج وكمية المخزون"}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">السعر ({currency}) *</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={(e) => update({ price: Number(e.target.value) })}
                    className={`rounded-xl h-12 ps-12 text-lg font-bold ${errors.price ? "border-red-300" : ""}`}
                    dir="ltr"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>

              {form.type === "PHYSICAL" && (
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1.5">الكمية بالمخزون</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => update({ stock: Number(e.target.value) })}
                    className="rounded-xl h-11"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">الكمية تقل تلقائياً عند كل عملية شراء</p>
                </div>
              )}

              {form.type === "DIGITAL" && (
                <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                  <div className="flex items-center gap-3">
                    <FileDown className="w-5 h-5 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">منتج رقمي — بلا حدود للمخزون</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        المنتج الرقمي متاح بشكل غير محدود ويتم تحميله فوراً بعد الدفع
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </m.div>
        )

      case 4:
        return (
          <m.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">الإعدادات</h2>
              <p className="text-sm text-slate-500">ضبط حالة المنتج</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">حالة المنتج</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "inactive", label: "معطل", desc: "غير متاح في المتجر" },
                    { value: "active", label: "نشط", desc: "متاح في المتجر" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update({ status: s.value })}
                      className={`p-4 rounded-xl border-2 text-start transition-all ${
                        form.status === s.value
                          ? s.value === "active"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-primary bg-primary/10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{s.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">ملخص المنتج</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-400">الاسم:</span>
                  <span className="text-slate-900 font-medium">{form.titleAr || form.title || "—"}</span>
                  <span className="text-slate-400">النوع:</span>
                  <span className="text-slate-900 font-medium">{form.type === "DIGITAL" ? "رقمي" : "مادي"}</span>
                  <span className="text-slate-400">التصنيف:</span>
                  <span className="text-slate-900 font-medium">{form.category || "—"}</span>
                  <span className="text-slate-400">السعر:</span>
                  <span className="text-slate-900 font-medium">{form.price} {currency}</span>
                  {form.type === "PHYSICAL" && (
                    <>
                      <span className="text-slate-400">المخزون:</span>
                      <span className="text-slate-900 font-medium">{form.stock}</span>
                    </>
                  )}
                  {form.type === "DIGITAL" && (
                    <>
                      <span className="text-slate-400">ملف مرفق:</span>
                      <span className="text-slate-900 font-medium">{form.fileUrl ? "نعم" : "لا"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </m.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/store"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        العودة للمتجر
      </Link>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : currentStep === step.id
                        ? "bg-primary text-white shadow-lg shadow-primary/25/25"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-bold ${currentStep >= step.id ? "text-slate-900" : "text-slate-400"}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400">خطوة {step.id}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-3">
                  <div className={`h-0.5 rounded-full transition-all ${currentStep > step.id ? "bg-emerald-400" : "bg-slate-200"}`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 mb-6">
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2 rounded-xl h-11">
          <ArrowRight className="w-4 h-4" /> السابق
        </Button>
        {currentStep < 4 ? (
          <Button onClick={nextStep} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-11 px-6">
            التالي <ArrowLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> إنشاء المنتج</>}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">تم إنشاء المنتج بنجاح!</h3>
              <p className="text-sm text-slate-500 mt-2">يمكنك إضافة منتج آخر أو العودة للمتجر</p>
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowSuccess(false)
                    setForm(initialForm)
                    setCurrentStep(1)
                    setFileName("")
                  }}
                  className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-11"
                >
                  <Plus className="w-4 h-4" /> إضافة منتج آخر
                </Button>
                <Link href="/admin/store">
                  <Button variant="outline" className="w-full rounded-xl h-11">
                    العودة للمتجر
                  </Button>
                </Link>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
