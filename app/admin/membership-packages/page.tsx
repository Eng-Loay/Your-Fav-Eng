// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { useEffect, useMemo, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Award, Plus, Search, Trash2, Edit, Loader2, BookOpen, UserPlus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import MediaUploader from "@/components/admin/courses/media-uploader"

interface MembershipPackage {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  price: number
  currency: string
  courseCount: number
  courseIds?: string[]
  level?: string
  duration: string
  image?: string
  status: string
  position: number
}

interface CourseOption {
  id: string
  title: string
}

const initialForm = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  price: 0,
  currency: "GBP",
  courseCount: 3,
  courseIds: [] as string[],
  level: "",
  duration: "Annual",
  image: "",
  status: "active" as const,
  position: 0,
}

export default function AdminMembershipPackagesPage() {
  const { showToast } = useStore()
  const [items, setItems] = useState<MembershipPackage[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [courseSearch, setCourseSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MembershipPackage | null>(null)
  const [form, setForm] = useState(initialForm)
  const [issueForm, setIssueForm] = useState({ userId: "", packageId: "" })
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminMembershipPackages()
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : []
        setItems(list)
      }
    } catch {
      showToast("فشل تحميل الباقات", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    api.getAdminUsers({ limit: 200, role: "STUDENT" }).then((res: any) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data || []
      setUsers(list.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
    }).catch(() => {})
    api.getAdminCourses({ status: "PUBLISHED" }).then((res: any) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data || []
      setCourses(
        list.map((c: any) => ({
          id: c.id,
          title: c.titleAr || c.title || c.titleEn || "Course",
        }))
      )
    }).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (!search) return true
      return it.title.toLowerCase().includes(search.toLowerCase())
    })
  }, [items, search])

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses
    const q = courseSearch.toLowerCase()
    return courses.filter((c) => c.title.toLowerCase().includes(q))
  }, [courses, courseSearch])

  const toggleCourse = (courseId: string) => {
    setForm((prev) => {
      const exists = prev.courseIds.includes(courseId)
      const courseIds = exists ? prev.courseIds.filter((id) => id !== courseId) : [...prev.courseIds, courseId]
      return { ...prev, courseIds, courseCount: courseIds.length || prev.courseCount }
    })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setCourseSearch("")
    setEditorOpen(true)
  }

  const openEdit = (item: MembershipPackage) => {
    setEditing(item)
    setForm({
      title: item.title,
      titleAr: item.titleAr || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      price: item.price,
      currency: item.currency,
      courseCount: item.courseCount,
      courseIds: item.courseIds || [],
      level: item.level || "",
      duration: item.duration,
      image: item.image || "",
      status: item.status as "active",
      position: item.position,
    })
    setCourseSearch("")
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      showToast("العنوان مطلوب", "error")
      return
    }
    if (form.courseIds.length === 0) {
      showToast("اختر دورة واحدة على الأقل للباقة", "error")
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, courseCount: form.courseIds.length }
      const res = editing
        ? await api.updateMembershipPackage(editing.id, payload)
        : await api.createMembershipPackage(payload)
      if (res.success) {
        showToast(editing ? "تم تحديث الباقة" : "تم إنشاء الباقة", "success")
        setEditorOpen(false)
        loadItems()
      } else {
        showToast(res.message || "فشل الحفظ", "error")
      }
    } catch {
      showToast("فشل الحفظ", "error")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الباقة؟")) return
    try {
      await api.deleteMembershipPackage(id)
      showToast("تم الحذف", "success")
      loadItems()
    } catch {
      showToast("فشل الحذف", "error")
    }
  }

  const issueMembership = async () => {
    if (!issueForm.userId || !issueForm.packageId) {
      showToast("اختر العضو والباقة", "error")
      return
    }
    setSaving(true)
    try {
      const res = await api.issueMembership(issueForm)
      if (res.success) {
        showToast("تم إصدار العضوية مع PDF وتسجيل الدورات", "success")
        setIssueOpen(false)
        setIssueForm({ userId: "", packageId: "" })
      } else {
        showToast(res.message || "فشل الإصدار", "error")
      }
    } catch {
      showToast("فشل الإصدار", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">باقات العضوية</h1>
          <p className="text-sm text-slate-500">أنشئ باقة وحدد الدورات — كل عضو يحصل على PDF في محفظته</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIssueOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            إصدار عضوية
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            باقة جديدة
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {item.level && <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.level}</p>}
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {(item.courseIds?.length ?? item.courseCount) || 0} دورات
                </span>
                <span>{item.duration}</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {item.currency} {item.price.toLocaleString()}
              </p>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <m.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">{editing ? "تعديل الباقة" : "باقة عضوية جديدة"}</h2>
              <div className="space-y-4">
                <Input placeholder="العنوان (إنجليزي)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="العنوان (عربي)" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
                <Textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="السعر" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  <Input placeholder="العملة" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="المستوى (Associate...)" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
                  <Input placeholder="المدة (Annual)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <MediaUploader value={form.image} onChange={(url) => setForm({ ...form, image: url })} />

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">دورات الباقة ({form.courseIds.length})</p>
                    {form.courseIds.length > 0 && (
                      <button type="button" className="text-xs text-primary" onClick={() => setForm({ ...form, courseIds: [], courseCount: 0 })}>
                        مسح الكل
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="بحث في الدورات..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="mb-3"
                  />
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {filteredCourses.length === 0 ? (
                      <p className="text-sm text-slate-400">لا توجد دورات منشورة</p>
                    ) : (
                      filteredCourses.map((course) => {
                        const checked = form.courseIds.includes(course.id)
                        return (
                          <label
                            key={course.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              checked ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleCourse(course.id)} />
                            <span className="flex-1 truncate">{course.title}</span>
                            {checked && <Check className="h-4 w-4 shrink-0 text-primary" />}
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.status === "active"} onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} />
                  <span className="text-sm">نشط</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الباقة"}
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {issueOpen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <m.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">إصدار عضوية + PDF</h2>
              <p className="mb-4 text-sm text-slate-500">سيتم إنشاء PDF وتسجيل العضو تلقائياً في دورات الباقة</p>
              <div className="space-y-4">
                <select className="w-full rounded-md border border-slate-200 p-2 text-sm" value={issueForm.userId} onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}>
                  <option value="">اختر العضو...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <select className="w-full rounded-md border border-slate-200 p-2 text-sm" value={issueForm.packageId} onChange={(e) => setIssueForm({ ...issueForm, packageId: e.target.value })}>
                  <option value="">اختر الباقة...</option>
                  {items.filter((i) => i.status === "active").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {(p.courseIds?.length ?? p.courseCount) || 0} دورات
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIssueOpen(false)}>إلغاء</Button>
                <Button onClick={issueMembership} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "إصدار وتسجيل الدورات"}
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
