"use client"

import React, { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ChevronLeft,
  PlayCircle,
  FileText,
  ClipboardList,
  Youtube,
  Upload,
  Link2,
  Save,
  Loader2,
  Paperclip,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

type LessonType = "video" | "text" | "quiz" | "pdf"
type VideoType = "youtube" | "upload" | "url"

export default function NewLessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const { showToast } = useStore()

  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "video" as LessonType,
    videoSource: "",
    videoType: "youtube" as VideoType,
    content: "",
    duration: 0,
    isPublished: true,
    isFree: false,
    price: 0,
    attachments: [] as Array<{ id?: string; name: string; url: string; type: string }>,
  })

  const update = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }))

  const lessonTypes = [
    { value: "video" as const, label: "فيديو", icon: PlayCircle, desc: "درس فيديو مع شرح" },
    { value: "text" as const, label: "نصي", icon: FileText, desc: "محتوى نصي تعليمي" },
    { value: "quiz" as const, label: "اختبار", icon: ClipboardList, desc: "اختبار وأسئلة" },
    { value: "pdf" as const, label: "ملف PDF", icon: FileText, desc: "مستند تعليمي" },
  ]

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("عنوان الدرس مطلوب", "error")
      return
    }

    setSaving(true)
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type.toUpperCase(),
        videoUrl: form.type === "video" ? form.videoSource : undefined,
        content: form.type === "text" ? form.content : undefined,
        pdfUrl: form.type === "pdf" ? form.videoSource : undefined,
      }

      const res = await api.request(`/lessons`, { method: "POST", body: { ...body, courseId } })

      if (res.success) {
        showToast("تم إنشاء الدرس بنجاح")
        router.push(`/admin/courses/${courseId}/content`)
      } else {
        showToast(res.message || "فشل في إنشاء الدرس", "error")
      }
    } catch {
      showToast("حدث خطأ غير متوقع", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={form.type === "pdf" ? "application/pdf" : form.type === "video" ? "video/mp4,video/webm,video/quicktime" : "video/*,application/pdf"}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploadingFile(true)
          try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await api.uploadAdminFile(formData)
            if (res.success && (res as any).data?.url) {
              update({ videoSource: (res as any).data.url })
              showToast("تم رفع الملف بنجاح")
            } else {
              showToast((res as any).message || "فشل رفع الملف", "error")
            }
          } catch {
            showToast("فشل رفع الملف", "error")
          } finally {
            setUploadingFile(false)
            e.target.value = ""
          }
        }}
      />
      <Link
        href={`/admin/courses/${courseId}/content`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        العودة للمحتوى
      </Link>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm"
      >
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900">إضافة درس جديد</h1>
          <p className="text-sm text-slate-500 mt-1">أضف درساً جديداً للدورة</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Lesson Type */}
          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">نوع الدرس</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lessonTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update({ type: t.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    form.type === t.value
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <t.icon
                    className={`w-6 h-6 ${form.type === t.value ? "text-primary" : "text-slate-400"}`}
                  />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${form.type === t.value ? "text-primary" : "text-slate-700"}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-1.5">
              عنوان الدرس *
            </label>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="عنوان الدرس"
              className="rounded-xl h-11"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-1.5">وصف الدرس</label>
            <Textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="وصف مختصر..."
              className="rounded-xl min-h-[80px] resize-none"
            />
          </div>

          {/* Video Source */}
          {form.type === "video" && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800 block">مصدر الفيديو</label>
              <div className="flex gap-2">
                {([
                  { value: "youtube" as const, label: "YouTube", icon: Youtube },
                  { value: "upload" as const, label: "رفع", icon: Upload },
                  { value: "url" as const, label: "رابط", icon: Link2 },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ videoType: opt.value })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.videoType === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.videoType === "upload" ? (
                <div
                  onClick={() => !uploadingFile && fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/10/30 cursor-pointer transition-all"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                  <p className="text-sm text-slate-600">
                    {uploadingFile ? "جاري الرفع..." : "اضغط لرفع فيديو (MP4, WebM)"}
                  </p>
                  {form.videoSource && (
                    <p className="text-xs text-emerald-600 truncate max-w-full">{form.videoSource}</p>
                  )}
                </div>
              ) : (
                <Input
                  value={form.videoSource}
                  onChange={(e) => update({ videoSource: e.target.value })}
                  placeholder={
                    form.videoType === "youtube"
                      ? "https://youtube.com/watch?v=..."
                      : "https://example.com/video.mp4"
                  }
                  className="rounded-xl h-11"
                  dir="ltr"
                />
              )}
            </div>
          )}

          {/* Text Content */}
          {form.type === "text" && (
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                محتوى الدرس
              </label>
              <Textarea
                value={form.content}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="اكتب محتوى الدرس..."
                className="rounded-xl min-h-[200px]"
              />
            </div>
          )}

          {/* PDF Source */}
          {form.type === "pdf" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 block">ملف PDF</label>
              <div
                onClick={() => !uploadingFile && fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/10/30 cursor-pointer transition-all"
              >
                {uploadingFile ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <FileText className="w-8 h-8 text-slate-400" />
                )}
                <p className="text-sm text-slate-600">
                  {uploadingFile ? "جاري الرفع..." : "اضغط لرفع ملف PDF"}
                </p>
                {form.videoSource && (
                  <p className="text-xs text-emerald-600 truncate max-w-full">{form.videoSource}</p>
                )}
              </div>
              <Input
                value={form.videoSource}
                onChange={(e) => update({ videoSource: e.target.value })}
                placeholder="أو الصق رابط ملف PDF"
                className="rounded-xl h-11"
                dir="ltr"
              />
            </div>
          )}

          {/* Attachments */}
          <div>
            <label className="text-sm font-semibold text-slate-800 block mb-2">المرفقات</label>
            <input
              ref={attachmentInputRef}
              type="file"
              className="hidden"
              accept="application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingAttachment(true)
                try {
                  const formData = new FormData()
                  formData.append("file", file)
                  const res = await api.uploadAdminFile(formData)
                  if (res.success && (res as any).data?.url) {
                    const url = (res as any).data.url
                    const name = (res as any).data.name ?? file.name
                    const type = (res as any).data.type ?? "OTHER"
                    update({ attachments: [...form.attachments, { name, url, type }] })
                    showToast("تم رفع المرفق بنجاح")
                  } else {
                    showToast((res as any).message || "فشل رفع المرفق", "error")
                  }
                } catch {
                  showToast("فشل رفع المرفق", "error")
                } finally {
                  setUploadingAttachment(false)
                  e.target.value = ""
                }
              }}
            />
            <div
              onClick={() => !uploadingAttachment && attachmentInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/10/30 transition-all cursor-pointer"
            >
              {uploadingAttachment ? (
                <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
              ) : (
                <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              )}
              <p className="text-sm text-slate-500">
                {uploadingAttachment ? "جاري الرفع..." : "اضغط لرفع مرفقات (PDF, ZIP, DOC, PPT)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">حد أقصى 50 ميجابايت</p>
            </div>
            {form.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.attachments.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="text-sm text-slate-700 truncate flex-1">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => update({ attachments: form.attachments.filter((_, i) => i !== idx) })}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Duration & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                المدة (دقائق)
              </label>
              <Input
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => update({ duration: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                سعر الدرس ($)
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => update({ price: Number(e.target.value) })}
                className="rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => update({ isPublished: v })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className="text-sm text-slate-700">منشور</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Switch
                checked={form.isFree}
                onCheckedChange={(v) => update({ isFree: v })}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm text-slate-700">درس مجاني</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
          <Link href={`/admin/courses/${courseId}/content`}>
            <Button variant="outline" className="rounded-xl h-10">
              إلغاء
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white h-10 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ الدرس
          </Button>
        </div>
      </m.div>
    </div>
  )
}
