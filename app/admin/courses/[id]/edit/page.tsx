"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ChevronLeft,
  Save,
  Loader2,
  Trash2,
  Eye,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import MediaUploader from "@/components/admin/courses/media-uploader"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"

const FALLBACK_CATEGORIES = [
  { slug: "programming", name: "البرمجة" },
  { slug: "design", name: "التصميم" },
  { slug: "business", name: "إدارة الأعمال" },
  { slug: "mechanics", name: "الميكانيكا" },
  { slug: "engineering", name: "الهندسة" },
  { slug: "other", name: "أخرى" },
]

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const { showToast } = useStore()

  const { data: courseRes, loading } = useApi(() => api.getCourse(courseId))
  const { data: templatesRes } = useApi(() => api.getAdminCertificateTemplates())
  const course = courseRes as any
  const { currency } = usePlatformCurrency()
  const templates = Array.isArray(templatesRes) ? templatesRes : (templatesRes as any)?.data ?? []

  const [saving, setSaving] = useState(false)
  const [platformCategories, setPlatformCategories] = useState<{ slug: string; name: string }[]>(FALLBACK_CATEGORIES)

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
  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    thumbnail: "",
    category: "",
    level: "beginner",
    price: 0,
    isFree: false,
    status: "draft",
    featured: false,
    certificateEnabled: false,
    certificateTemplateId: "" as string,
    forceLessonOrder: false,
    forceQuizPassing: false,
    allowLessonPurchase: false,
  })

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        titleAr: course.titleAr || "",
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        category: course.category || "",
        level: course.level || "beginner",
        price: course.price || 0,
        isFree: (course.price || 0) === 0,
        status: (course.status || "draft").toLowerCase(),
        featured: course.featured || false,
        certificateEnabled: course.certificateEnabled || false,
        certificateTemplateId: course.certificateTemplateId || "",
        forceLessonOrder: course.forceLessonOrder || false,
        forceQuizPassing: course.forceQuizPassing || false,
        allowLessonPurchase: course.allowLessonPurchase || false,
      })
    }
  }, [course])

  const update = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }))

  const handleSave = async () => {
    if (!form.title.trim() && !form.titleAr.trim()) {
      showToast("عنوان الدورة مطلوب", "error")
      return
    }

    setSaving(true)
    try {
      const body = {
        title: form.title.trim() || form.titleAr.trim(),
        titleAr: form.titleAr.trim() || form.title.trim(),
        description: form.description.trim(),
        thumbnail: form.thumbnail,
        category: form.category,
        level: form.level,
        price: form.isFree ? 0 : form.price,
        status: form.status,
        featured: form.featured,
        certificateTemplateId: form.certificateEnabled && form.certificateTemplateId ? form.certificateTemplateId : null,
      }

      const res = await api.request(`/admin/courses/${courseId}`, { method: "PUT", body })

      if (res.success) {
        showToast("تم تحديث الدورة بنجاح")
        router.push("/admin/courses")
      } else {
        showToast(res.message || "فشل في تحديث الدورة", "error")
      }
    } catch {
      showToast("حدث خطأ غير متوقع", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-slate-400">جاري تحميل البيانات...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            العودة للدورات
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            تعديل الدورة
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/courses/${courseId}/content`}>
            <Button variant="outline" className="gap-2 rounded-xl h-10">
              <Layers className="w-4 h-4" /> المحتوى
            </Button>
          </Link>
          <Button
            onClick={() => window.open(`/courses/${courseId}`, "_blank")}
            variant="outline"
            className="gap-2 rounded-xl h-10"
          >
            <Eye className="w-4 h-4" /> معاينة
          </Button>
        </div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">المعلومات الأساسية</h2>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-1.5">
              عنوان الدورة (عربي) *
            </label>
            <Input
              value={form.titleAr}
              onChange={(e) => update({ titleAr: e.target.value })}
              className="rounded-xl h-11"
              placeholder="عنوان الدورة بالعربي"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-1.5">
              عنوان الدورة (إنجليزي)
            </label>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="rounded-xl h-11"
              placeholder="Course title in English"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-1.5">وصف الدورة</label>
            <Textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="rounded-xl min-h-[120px] resize-none"
              placeholder="وصف مفصل للدورة..."
            />
          </div>

          <MediaUploader
            value={form.thumbnail}
            onChange={(url) => update({ thumbnail: url })}
            label="صورة الغلاف"
            hint="يفضل صورة بأبعاد 16:9 بدقة 1280×720 على الأقل"
          />
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">تفاصيل الدورة</h2>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">التصنيف</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {platformCategories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => update({ category: cat.slug })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.category === cat.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">المستوى</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "beginner", label: "مبتدئ" },
                { value: "intermediate", label: "متوسط" },
                { value: "advanced", label: "متقدم" },
              ].map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => update({ level: l.value })}
                  className={`p-3 rounded-xl text-center border-2 transition-all ${
                    form.level === l.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="text-sm font-bold">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">التسعير</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
            <div>
              <p className="text-sm font-bold text-slate-900">دورة مجانية</p>
              <p className="text-xs text-slate-500">الطلاب يمكنهم الوصول بدون دفع</p>
            </div>
            <Switch
              checked={form.isFree}
              onCheckedChange={(v) => update({ isFree: v, price: v ? 0 : form.price })}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {!form.isFree && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  سعر الدورة ({currency})
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={(e) => update({ price: Number(e.target.value) })}
                    className="rounded-xl h-12 ps-12 text-lg font-bold"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <p className="text-sm font-medium text-slate-800">شراء الدروس بشكل فردي</p>
                  <p className="text-xs text-slate-400">السماح للطلاب بشراء دروس منفردة</p>
                </div>
                <Switch
                  checked={form.allowLessonPurchase}
                  onCheckedChange={(v) => update({ allowLessonPurchase: v })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">الإعدادات</h2>

          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">حالة الدورة</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "draft", label: "مسودة", desc: "تظهر لك فقط" },
                { value: "published", label: "منشور", desc: "متاح للجميع" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => update({ status: s.value })}
                  className={`p-4 rounded-xl border-2 text-start transition-all ${
                    form.status === s.value
                      ? s.value === "published"
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

          <div className="space-y-3">
            {[
              { key: "featured" as const, label: "دورة مميزة", desc: "تظهر في القسم المميز", checked: form.featured },
              { key: "certificateEnabled" as const, label: "تفعيل الشهادة", desc: "منح شهادة إتمام عند إكمال الدورة", checked: form.certificateEnabled },
              { key: "forceLessonOrder" as const, label: "ترتيب إجباري", desc: "يجب إتمام الدرس قبل الانتقال للتالي", checked: form.forceLessonOrder },
              { key: "forceQuizPassing" as const, label: "اجتياز الاختبار إجباري", desc: "يجب اجتياز اختبار الدرس", checked: form.forceQuizPassing },
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
                  onCheckedChange={(v) => update({ [item.key]: v } as any)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
            {form.certificateEnabled && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-sm font-medium text-slate-800 mb-2">قالب الشهادة</p>
                <select
                  value={form.certificateTemplateId}
                  onChange={(e) => update({ certificateTemplateId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary focus:outline-none"
                >
                  <option value="">اختر قالب الشهادة</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr || t.name || t.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/courses")}
            className="rounded-xl h-10"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-10 px-8"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </m.div>
    </div>
  )
}
