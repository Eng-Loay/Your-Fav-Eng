"use client"

import React, { useState, useEffect } from "react"
import { m, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  ShoppingBag,
  GraduationCap,
  X,
  AlertTriangle,
  Check,
  Palette,
  FolderOpen,
  Loader2,
  ChevronDown,
  ChevronLeft,
  FolderPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.04 } } }

type ServiceType = "platform" | "store"

interface Category {
  id: string
  name: string
  nameEn: string | null
  slug: string
  service: string
  icon: string | null
  position: number
  status: string
  parentId?: string | null
  parent?: { id: string; name: string; nameEn?: string | null; slug: string } | null
  children?: Category[]
}

const COLORS = [
  "#2563EB", "#8B5CF6", "#059669", "#F59E0B", "#EF4444",
  "#0EA5E9", "#6366F1", "#14B8A6", "#F97316", "#EC4899",
  "#84CC16", "#06B6D4",
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
}

function getColorForCategory(cat: Category, index: number): string {
  return COLORS[index % COLORS.length]
}

export default function CategoriesPage() {
  const { showToast } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceType>("all")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    service: "platform" as ServiceType,
    color: COLORS[0],
    parentId: "" as string | null,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.request("/admin/categories")
      if (res.success) {
        const data = res.data as any
        setCategories(Array.isArray(data) ? data : data?.data || [])
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const filtered = categories.filter((c) => {
    const matchSearch =
      !search ||
      c.name.includes(search) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(search.toLowerCase()))
    const matchService = serviceFilter === "all" || c.service === serviceFilter
    return matchSearch && matchService
  })

  const platformCount = categories.filter((c) => c.service === "platform").length
  const storeCount = categories.filter((c) => c.service === "store").length

  const rootCategories = categories.filter((c) => !c.parentId)

  const openCreate = (parent?: Category | null) => {
    setEditing(null)
    setForm({
      name: "",
      nameEn: "",
      service: (parent?.service === "store" ? "store" : "platform") as ServiceType,
      color: (parent?.icon && parent.icon.startsWith("#")) ? parent.icon : COLORS[0],
      parentId: parent?.id ?? null,
    })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      nameEn: cat.nameEn || "",
      service: cat.service as ServiceType,
      color: cat.icon || COLORS[0],
      parentId: cat.parentId ?? null,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("اسم التصنيف مطلوب", "error")
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await api.request(`/admin/categories/${editing.id}`, {
          method: "PUT",
          body: {
            name: form.name.trim(),
            nameEn: form.nameEn.trim(),
            service: form.service,
            slug: slugify(form.nameEn || form.name),
            icon: form.color,
            parentId: form.parentId || null,
          },
        })
        if (res.success) {
          showToast("تم تحديث التصنيف بنجاح")
          fetchCategories()
        } else {
          showToast(res.message || "حدث خطأ", "error")
        }
      } else {
        const res = await api.request("/admin/categories", {
          method: "POST",
          body: {
            name: form.name.trim(),
            nameEn: form.nameEn.trim(),
            slug: slugify(form.nameEn || form.name),
            service: form.service,
            icon: form.color,
            parentId: form.parentId || null,
          },
        })
        if (res.success) {
          showToast("تم إنشاء التصنيف بنجاح")
          fetchCategories()
        } else {
          showToast(res.message || "حدث خطأ", "error")
        }
      }
      setShowModal(false)
    } catch {
      showToast("حدث خطأ غير متوقع", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await api.request(`/admin/categories/${deleteTarget.id}`, { method: "DELETE" })
      if (res.success) {
        showToast("تم حذف التصنيف بنجاح")
        fetchCategories()
      } else {
        showToast("حدث خطأ أثناء الحذف", "error")
      }
    } catch {
      showToast("حدث خطأ", "error")
    }
    setDeleteTarget(null)
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة التصنيفات</h1>
          <p className="text-sm text-slate-500 mt-1">تصنيفات المنصة التعليمية والمتجر الإلكتروني</p>
        </div>
        <Button
          onClick={() => openCreate()}
          className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25/25 h-11 px-6"
        >
          <Plus className="w-4 h-4" />
          إضافة تصنيف
        </Button>
      </m.div>

      {/* Stats */}
      <m.div variants={fadeUp} className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">إجمالي التصنيفات</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 mb-3">
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{platformCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">تصنيفات المنصة التعليمية</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 mb-3">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{storeCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">تصنيفات المتجر</p>
        </div>
      </m.div>

      {/* Filters */}
      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 flex-1 max-w-md border border-slate-200/60">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في التصنيفات..."
              className="bg-transparent text-sm outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
            {[
              { value: "all" as const, label: "الكل" },
              { value: "platform" as const, label: "المنصة التعليمية", icon: GraduationCap },
              { value: "store" as const, label: "المتجر", icon: ShoppingBag },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setServiceFilter(item.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  serviceFilter === item.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </m.div>

      {/* Categories Grid */}
      {loading ? (
        <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
              <div className="h-2 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-24" />
                    <div className="h-2 bg-slate-200 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </m.div>
      ) : filtered.length === 0 ? (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-5">
            <FolderOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">لا توجد تصنيفات</h3>
          <p className="text-sm text-slate-400 mt-2">
            {search ? "جرب تعديل معايير البحث" : "ابدأ بإنشاء أول تصنيف"}
          </p>
        </m.div>
      ) : (
        <m.div variants={fadeUp} className="space-y-4">
          {filtered.filter((c) => !c.parentId).map((cat, idx) => {
            const color = cat.icon && cat.icon.startsWith("#") ? cat.icon : getColorForCategory(cat, idx)
            const children = filtered.filter((c) => c.parentId === cat.id)
            return (
              <div key={cat.id} className="space-y-2">
                <m.div
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-all"
                >
                  <div className="h-2" style={{ backgroundColor: color }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Tag className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                          {cat.nameEn && <p className="text-xs text-slate-400 mt-0.5" dir="ltr">{cat.nameEn}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openCreate(cat)} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500" title="إضافة تصنيف فرعي">
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <Badge
                        className={`text-[10px] font-semibold px-2 py-0.5 ${
                          cat.service === "platform"
                            ? "bg-violet-50 text-violet-600 hover:bg-violet-50"
                            : "bg-amber-50 text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        {cat.service === "platform" ? (
                          <><GraduationCap className="w-3 h-3 ml-1 inline" /> المنصة التعليمية</>
                        ) : (
                          <><ShoppingBag className="w-3 h-3 ml-1 inline" /> المتجر</>
                        )}
                      </Badge>
                      {children.length > 0 && (
                        <Badge className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600">
                          {children.length} تصنيف فرعي
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                      <span dir="ltr">{cat.slug}</span>
                    </div>
                  </div>
                </m.div>

                {children.length > 0 && (
                  <div className="mr-6 sm:mr-8 lg:mr-10 space-y-2 border-r-2 border-slate-200/60 pr-4">
                    {children.map((sub, subIdx) => {
                      const subColor = sub.icon && sub.icon.startsWith("#") ? sub.icon : getColorForCategory(sub, idx + subIdx + 1)
                      return (
                        <m.div
                          key={sub.id}
                          variants={fadeUp}
                          whileHover={{ x: 4 }}
                          className="bg-white/80 rounded-xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-all"
                        >
                          <div className="h-1" style={{ backgroundColor: subColor }} />
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <ChevronLeft className="w-4 h-4 text-slate-300" />
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                style={{ backgroundColor: `${subColor}20` }}
                              >
                                <Tag className="w-3.5 h-3.5" style={{ color: subColor }} />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-800">{sub.name}</h4>
                                {sub.nameEn && <p className="text-[11px] text-slate-400" dir="ltr">{sub.nameEn}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(sub)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button onClick={() => setDeleteTarget(sub)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </m.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </m.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editing ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-900 block mb-2">التصنيف الأب (اختياري)</label>
                  <select
                    value={form.parentId || ""}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white"
                  >
                    <option value="">— لا يوجد (تصنيف رئيسي) —</option>
                    {rootCategories.filter((c) => !editing || c.id !== editing.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.nameEn ? ` (${c.nameEn})` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 block mb-2">هذا التصنيف تابع لأي خدمة؟ *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, service: "platform" }))}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                        form.service === "platform" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <GraduationCap className={`w-8 h-8 ${form.service === "platform" ? "text-violet-600" : "text-slate-400"}`} />
                      <div className="text-center">
                        <p className={`text-sm font-bold ${form.service === "platform" ? "text-violet-700" : "text-slate-700"}`}>المنصة التعليمية</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">دورات ومحتوى تعليمي</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, service: "store" }))}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                        form.service === "store" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <ShoppingBag className={`w-8 h-8 ${form.service === "store" ? "text-amber-600" : "text-slate-400"}`} />
                      <div className="text-center">
                        <p className={`text-sm font-bold ${form.service === "store" ? "text-amber-700" : "text-slate-700"}`}>المتجر الإلكتروني</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">منتجات وبضائع</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1.5">اسم التصنيف (عربي) *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: البرمجة"
                    className="rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1.5">اسم التصنيف (إنجليزي)</label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="e.g. Programming"
                    className="rounded-xl h-11"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-2">
                    <Palette className="w-4 h-4 inline ml-1" /> اللون
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color }))}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          form.color === color ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {form.color === color && <Check className="w-4 h-4 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">إلغاء</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            >
              <div className="p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">حذف التصنيف</h3>
                <p className="text-sm text-slate-500 mt-2">
                  هل أنت متأكد من حذف <span className="font-semibold text-slate-900">{deleteTarget.name}</span>؟
                </p>
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">إلغاء</Button>
                <Button onClick={handleDelete} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">حذف</Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
