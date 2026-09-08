// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
﻿"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { m, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Layers,
  DollarSign,
  Settings,
  Loader2,
  Sparkles,
  Plus,
  ChevronLeft,
  Search,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import MediaUploader from "@/components/admin/courses/media-uploader"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { resolveImageUrl } from "@/lib/utils"

const STEPS = [
  { id: 1, title: "المعلومات الأساسية", icon: BookOpen },
  { id: 2, title: "تفاصيل الدورة", icon: Layers },
  { id: 3, title: "التسعير", icon: DollarSign },
  { id: 4, title: "الإعدادات", icon: Settings },
]

const FALLBACK_CATEGORIES = [
  { slug: "programming", name: "البرمجة" },
  { slug: "design", name: "التصميم" },
  { slug: "business", name: "إدارة الأعمال" },
  { slug: "marketing", name: "التسويق" },
  { slug: "mechanics", name: "الميكانيكا" },
  { slug: "engineering", name: "الهندسة" },
  { slug: "other", name: "أخرى" },
]

interface FormData {
  title: string
  titleAr: string
  description: string
  thumbnail: string
  category: string
  instructorId: string
  level: string
  isFree: boolean
  price: number
  allowLessonPurchase: boolean
  status: string
  featured: boolean
  certificateEnabled: boolean
  forceLessonOrder: boolean
  forceQuizPassing: boolean
}

const initialForm: FormData = {
  title: "",
  titleAr: "",
  description: "",
  thumbnail: "",
  category: "",
  instructorId: "",
  level: "beginner",
  isFree: false,
  price: 0,
  allowLessonPurchase: false,
  status: "draft",
  featured: false,
  certificateEnabled: false,
  forceLessonOrder: false,
  forceQuizPassing: false,
}

interface InstructorOption {
  id: string
  name: string
  email?: string
  avatar?: string
  role?: string
}

export default function NewCoursePage() {
  const router = useRouter()
  const { showToast, user } = useStore()
  const { currency, formatCurrency } = usePlatformCurrency()
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [platformCategories, setPlatformCategories] = useState<{ slug: string; name: string }[]>(FALLBACK_CATEGORIES)
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [instructorSearch, setInstructorSearch] = useState("")
  const [loadingInstructors, setLoadingInstructors] = useState(false)

  const isAdmin = user?.role === "admin" || user?.role === "ADMIN"
  const [instructorsEnabled, setInstructorsEnabled] = useState(true)

  useEffect(() => {
    api.getInstructorsStatus().then((r) => {
      if (r.success && r.data) setInstructorsEnabled(r.data.enabled === true)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.request("/settings/categories?service=platform")
        if (res.success) {
          const data = res.data as any
          const items = Array.isArray(data) ? data : data?.data || []
          if (items.length > 0) {
            setPlatformCategories(items.map((c: any) => ({ slug: c.slug, name: c.name })))
          }
        }
      } catch {}
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      if (user?.id) updateForm({ instructorId: user.id })
      return
    }
    if (!instructorsEnabled && user?.id) {
      updateForm({ instructorId: user.id })
      setInstructors([{ id: user.id, name: user.name || "Admin", email: user.email, avatar: user.avatar, role: "ADMIN" }])
      setLoadingInstructors(false)
      return
    }
    setLoadingInstructors(true)
    const fetchInstructors = async () => {
      try {
        const teachRes = await api.request("/admin/users?role=TEACHER&limit=100")
        const list: InstructorOption[] = []
        if (teachRes.success) {
          const data = teachRes.data as any
          const items = Array.isArray(data) ? data : data?.data || data?.users || []
          items.forEach((u: any) => {
            list.push({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: u.role || "TEACHER" })
          })
        }
        setInstructors(list)
        if (list.length > 0 && !form.instructorId) {
          updateForm({ instructorId: list[0].id })
        }
      } catch {
        // fallback: use admin as instructor
      } finally {
        setLoadingInstructors(false)
      }
    }
    fetchInstructors()
  }, [isAdmin, instructorsEnabled, user?.id])

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
    const keys = Object.keys(updates) as (keyof FormData)[]
    setErrors((prev) => {
      const next = { ...prev }
      keys.forEach((k) => delete next[k])
      return next
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 1) {
      if (!form.title.trim() && !form.titleAr.trim())
        newErrors.title = "عنوان الدورة مطلوب"
    }
    if (step === 2) {
      if (!form.category) newErrors.category = "التصنيف مطلوب"
    }
    if (step === 3) {
      if (!form.isFree && (isNaN(form.price) || form.price < 0))
        newErrors.price = "السعر يجب أن يكون رقم صالح"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 4))
    }
  }

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

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
        level: form.level,
        price: form.isFree ? 0 : form.price,
        currency,
        status: form.status,
        featured: form.featured,
      }

      if (isAdmin && form.instructorId) {
        body.instructorId = form.instructorId
      }

      const endpoint = isAdmin ? "/admin/courses" : "/courses"
      const res = await api.request(endpoint, { method: "POST", body })
      if (res.success && res.data) {
        const courseId = (res.data as any).id || (res.data as any).course?.id
        setCreatedCourseId(courseId)
        setShowSuccess(true)
      } else {
        showToast(res.message || "حدث خطأ أثناء إنشاء الدورة", "error")
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
          <m.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">المعلومات الأساسية</h2>
              <p className="text-sm text-slate-500">أدخل عنوان الدورة ووصفها وصورة الغلاف</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  عنوان الدورة (عربي) *
                </label>
                <Input
                  value={form.titleAr}
                  onChange={(e) => updateForm({ titleAr: e.target.value })}
                  placeholder="مثال: أساسيات البرمجة بلغة بايثون"
                  className={`rounded-xl h-11 ${errors.title ? "border-red-300" : ""}`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  عنوان الدورة (إنجليزي)
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="e.g. Python Programming Basics"
                  className="rounded-xl h-11"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  وصف الدورة
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="اكتب وصفاً مفصلاً للدورة يجذب الطلاب..."
                  className="rounded-xl min-h-[120px] resize-none"
                />
              </div>

              <MediaUploader
                value={form.thumbnail}
                onChange={(url) => updateForm({ thumbnail: url })}
                label="صورة الغلاف"
                hint="يفضل صورة بأبعاد 16:9 بدقة 1280×720 على الأقل"
              />
            </div>
          </m.div>
        )

      case 2:
        return (
          <m.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">تفاصيل الدورة</h2>
              <p className="text-sm text-slate-500">حدد التصنيف والمستوى والمدرب</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">
                  التصنيف *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {platformCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => updateForm({ category: cat.slug })}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.category === cat.slug
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">المستوى</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "beginner", label: "مبتدئ", desc: "لا يحتاج خبرة سابقة" },
                    { value: "intermediate", label: "متوسط", desc: "يحتاج معرفة أساسية" },
                    { value: "advanced", label: "متقدم", desc: "للمحترفين" },
                  ].map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateForm({ level: level.value })}
                      className={`p-4 rounded-xl text-center border-2 transition-all ${
                        form.level === level.value
                          ? "border-primary bg-primary/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${
                          form.level === level.value ? "text-primary" : "text-slate-900"
                        }`}
                      >
                        {level.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">
                  المدرب / المعلم *
                </label>
                {isAdmin && !instructorsEnabled ? (
                  <div className="p-4 rounded-xl bg-primary/10 border border-blue-200 text-sm text-primary">
                    المدربون غير مفعلين. الدورة ستُنشأ باسمك (الأدمن).
                  </div>
                ) : isAdmin && instructors.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={instructorSearch}
                        onChange={(e) => setInstructorSearch(e.target.value)}
                        placeholder="ابحث عن مدرب أو معلم..."
                        className="rounded-xl h-10 ps-9"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                      {instructors
                        .filter(
                          (i) =>
                            !instructorSearch ||
                            i.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                            (i.email && i.email.toLowerCase().includes(instructorSearch.toLowerCase()))
                        )
                        .map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => {
                              updateForm({ instructorId: inst.id })
                              setInstructorSearch("")
                            }}
                            className={`w-full flex items-center gap-3 p-3 text-start transition-all hover:bg-slate-50 ${
                              form.instructorId === inst.id ? "bg-primary/10 border-s-4 border-primary" : ""
                            }`}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-primary shrink-0">
                              {inst.avatar ? (
                                <img src={resolveImageUrl(inst.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{inst.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {inst.email} · {inst.role === "TEACHER" ? "معلم" : "مدرب"}
                              </p>
                            </div>
                            {form.instructorId === inst.id && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      {instructors.filter(
                        (i) =>
                          !instructorSearch ||
                          i.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                          (i.email && i.email.toLowerCase().includes(instructorSearch.toLowerCase()))
                      ).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">لا يوجد نتائج</p>
                      )}
                    </div>
                  </div>
                ) : isAdmin && loadingInstructors ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ تحميل المدربين...
                  </div>
                ) : isAdmin ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    لا يوجد مدربين أو معلمين. سيتم تعيينك كمدرب للدورة.
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-primary/10 border border-blue-200 text-sm text-primary">
                    سيتم تعيينك تلقائياً كمدرب لهذه الدورة
                  </div>
                )}
              </div>
            </div>
          </m.div>
        )

      case 3:
        return (
          <m.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">التسعير</h2>
              <p className="text-sm text-slate-500">حدد سعر الدورة وخيارات الشراء</p>
            </div>

            <div className="space-y-5">
              {/* Free Toggle */}
              <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-l from-emerald-50 to-white border-2 border-emerald-200/60">
                <div>
                  <p className="text-sm font-bold text-slate-900">دورة مجانية</p>
                  <p className="text-xs text-slate-500 mt-0.5">الطلاب يمكنهم الوصول بدون دفع</p>
                </div>
                <Switch
                  checked={form.isFree}
                  onCheckedChange={(v) => updateForm({ isFree: v, price: v ? 0 : form.price })}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {!form.isFree && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                      سعر الدورة ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                        {currency}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.price}
                        onChange={(e) => updateForm({ price: Number(e.target.value) })}
                        className={`rounded-xl h-12 ps-10 text-lg font-bold ${
                          errors.price ? "border-red-300" : ""
                        }`}
                        dir="ltr"
                      />
                    </div>
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div>
                      <p className="text-sm font-medium text-slate-800">شراء الدروس بشكل فردي</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        السماح للطلاب بشراء دروس منفردة
                      </p>
                    </div>
                    <Switch
                      checked={form.allowLessonPurchase}
                      onCheckedChange={(v) => updateForm({ allowLessonPurchase: v })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </m.div>
              )}
            </div>
          </m.div>
        )

      case 4:
        return (
          <m.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">الإعدادات</h2>
              <p className="text-sm text-slate-500">ضبط إعدادات النشر والشهادات</p>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-2">
                  حالة الدورة
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "draft",
                      label: "مسودة",
                      desc: "تظهر لك فقط",
                      color: "slate",
                    },
                    {
                      value: "published",
                      label: "منشور",
                      desc: "متاح للجميع",
                      color: "emerald",
                    },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateForm({ status: s.value })}
                      className={`p-4 rounded-xl border-2 text-start transition-all ${
                        form.status === s.value
                          ? s.color === "emerald"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-primary bg-primary/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{s.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Toggles */}
              <div className="space-y-3">
                {[
                  {
                    key: "featured" as const,
                    label: "دورة مميزة",
                    desc: "تظهر في القسم المميز بالصفحة الرئيسية",
                    checked: form.featured,
                  },
                  {
                    key: "certificateEnabled" as const,
                    label: "تفعيل الشهادة",
                    desc: "منح شهادة إتمام عند إنهاء الدورة",
                    checked: form.certificateEnabled,
                  },
                  {
                    key: "forceLessonOrder" as const,
                    label: "ترتيب إجباري للدروس",
                    desc: "يجب إتمام الدرس قبل الانتقال للتالي",
                    checked: form.forceLessonOrder,
                  },
                  {
                    key: "forceQuizPassing" as const,
                    label: "اجتياز الاختبار إجباري",
                    desc: "يجب اجتياز اختبار الدرس قبل المتابعة",
                    checked: form.forceQuizPassing,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={(v) => updateForm({ [item.key]: v } as any)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
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
      {/* Back Link */}
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        العودة للدورات
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
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={`text-xs font-bold ${
                      currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400">خطوة {step.id}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-3">
                  <div
                    className={`h-0.5 rounded-full transition-all ${
                      currentStep > step.id ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
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
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2 rounded-xl h-11"
        >
          <ArrowRight className="w-4 h-4" />
          السابق
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-11 px-6"
          >
            التالي
            <ArrowLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                إنشاء الدورة
              </>
            )}
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
              <h3 className="text-xl font-bold text-slate-900">تم إنشاء الدورة بنجاح!</h3>
              <p className="text-sm text-slate-500 mt-2">
                يمكنك الآن إضافة محتوى الدورة أو العودة لقائمة الدورات
              </p>
              <div className="flex flex-col gap-3 mt-6">
                {createdCourseId && (
                  <Link href={`/admin/courses/${createdCourseId}/content`}>
                    <Button className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-11">
                      <Plus className="w-4 h-4" />
                      إضافة محتوى الآن
                    </Button>
                  </Link>
                )}
                <Link href="/admin/courses">
                  <Button variant="outline" className="w-full rounded-xl h-11">
                    العودة للدورات
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
