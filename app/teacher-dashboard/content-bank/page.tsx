"use client"

import React, { useState } from "react"
import { m } from "framer-motion"
import { Plus, Trash2, Loader2, Library } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

export default function TeacherContentBankPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()
  const { data, loading, refetch } = useApi(() => api.getInstructorContentBank())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", titleAr: "", type: "VIDEO", content: "", videoUrl: "", pdfUrl: "", duration: 0 })

  const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data
  const items = (list ?? []) as Array<{ id: string; title: string; titleAr?: string; type?: string; duration?: number }>

  const handleAdd = async () => {
    if (!form.title.trim()) {
      showToast(isAr ? "العنوان مطلوب" : "Title required", "error")
      return
    }
    setSaving(true)
    try {
      await api.createInstructorContentBankItem({
        title: form.title,
        titleAr: form.titleAr || undefined,
        type: form.type,
        content: form.content || undefined,
        videoUrl: form.videoUrl || undefined,
        pdfUrl: form.pdfUrl || undefined,
        duration: form.duration || 0,
      })
      showToast(isAr ? "تمت الإضافة" : "Added", "success")
      setShowAdd(false)
      setForm({ title: "", titleAr: "", type: "VIDEO", content: "", videoUrl: "", pdfUrl: "", duration: 0 })
      refetch()
    } catch {
      showToast(isAr ? "فشل" : "Failed", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.deleteInstructorContentBankItem(id)
      showToast(isAr ? "تم الحذف" : "Deleted", "success")
      refetch()
    } catch {
      showToast(isAr ? "فشل الحذف" : "Delete failed", "error")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "بنك المحتوى" : "Content Bank"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "أضف محتوى لاستخدامه عند إنشاء الدورات" : "Add content to use when creating courses"}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة محتوى" : "Add Content"}
        </Button>
      </div>

      {items.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center"
        >
          <Library className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#64748B]">{isAr ? "لا يوجد محتوى" : "No content yet"}</p>
          <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
            <Plus className="w-4 h-4" /> {isAr ? "إضافة محتوى" : "Add Content"}
          </Button>
        </m.div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{isAr ? (item.titleAr || item.title) : item.title}</p>
                  <p className="text-xs text-[#64748B]">{item.type} • {item.duration || 0} {isAr ? "دقيقة" : "min"}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                >
                  {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{isAr ? "إضافة محتوى" : "Add Content"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "العنوان" : "Title"}</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder={isAr ? "عنوان المحتوى" : "Content title"} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "العنوان (عربي)" : "Title (Ar)"}</label>
                <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "النوع" : "Type"}</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm">
                  <option value="VIDEO">{isAr ? "فيديو" : "Video"}</option>
                  <option value="TEXT">{isAr ? "نص" : "Text"}</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>
              {form.type === "VIDEO" && (
                <div>
                  <label className="text-sm font-medium block mb-1">URL</label>
                  <input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                </div>
              )}
              {form.type === "TEXT" && (
                <div>
                  <label className="text-sm font-medium block mb-1">{isAr ? "المحتوى" : "Content"}</label>
                  <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]" />
                </div>
              )}
              {form.type === "PDF" && (
                <div>
                  <label className="text-sm font-medium block mb-1">PDF URL</label>
                  <input value={form.pdfUrl} onChange={(e) => setForm((f) => ({ ...f, pdfUrl: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "المدة (دقيقة)" : "Duration (min)"}</label>
                <input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-sm" min={0} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleAdd} disabled={saving} className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
