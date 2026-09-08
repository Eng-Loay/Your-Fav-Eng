"use client"

import { useEffect, useMemo, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Layers, Plus, Search, Trash2, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import MediaUploader from "@/components/admin/courses/media-uploader"

type Kind = "SERVICE" | "BUNDLE"
type Status = "active" | "inactive"

interface ServiceBundle {
  id: string
  kind: Kind
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  image?: string
  price?: number | null
  ctaUrl?: string | null
  position: number
  status: Status
}

const initialForm: Omit<ServiceBundle, "id"> = {
  kind: "SERVICE",
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  image: "",
  price: null,
  ctaUrl: "",
  position: 0,
  status: "active",
}

export default function AdminServicesBundlesPage() {
  const { showToast } = useStore()
  const [items, setItems] = useState<ServiceBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<"ALL" | Kind>("ALL")
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ServiceBundle | null>(null)
  const [form, setForm] = useState(initialForm)

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminServicesBundles({ limit: 200 })
      if (res.success) {
        const payload = res.data as any
        const raw = Array.isArray(payload) ? payload : payload?.data
        setItems(Array.isArray(raw) ? raw : [])
      }
    } catch {
      showToast("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch =
        !search ||
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        (it.titleAr || "").includes(search)
      const matchesKind = kindFilter === "ALL" || it.kind === kindFilter
      return matchesSearch && matchesKind
    })
  }, [items, search, kindFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setEditorOpen(true)
  }

  const openEdit = (item: ServiceBundle) => {
    setEditing(item)
    setForm({
      kind: item.kind,
      title: item.title || "",
      titleAr: item.titleAr || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      image: item.image || "",
      price: item.price ?? null,
      ctaUrl: item.ctaUrl || "",
      position: item.position || 0,
      status: item.status || "active",
    })
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      showToast("Title is required", "error")
      return
    }
    setSaving(true)
    try {
      const payload = {
        kind: form.kind,
        title: form.title.trim(),
        titleAr: form.titleAr?.trim() || undefined,
        description: form.description?.trim() || undefined,
        descriptionAr: form.descriptionAr?.trim() || undefined,
        image: form.image || undefined,
        price: form.price == null || Number.isNaN(form.price) ? undefined : Number(form.price),
        ctaUrl: form.ctaUrl?.trim() || undefined,
        position: Number(form.position || 0),
        status: form.status,
      }
      const res = editing
        ? await api.updateAdminServiceBundle(editing.id, payload)
        : await api.createAdminServiceBundle(payload)
      if (res.success) {
        showToast(editing ? "Updated successfully" : "Created successfully")
        setEditorOpen(false)
        await loadItems()
      } else {
        showToast(res.message || "Failed to save", "error")
      }
    } catch {
      showToast("Failed to save", "error")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await api.deleteAdminServiceBundle(id)
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        showToast("Deleted successfully")
      } else {
        showToast(res.message || "Failed to delete", "error")
      }
    } catch {
      showToast("Failed to delete", "error")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Services & Bundles</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage homepage service and bundle cards.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add New
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5 border border-[#E2E8F0]/60 sm:w-[360px]">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "SERVICE", "BUNDLE"] as const).map((k) => (
            <Button key={k} variant={kindFilter === k ? "default" : "outline"} onClick={() => setKindFilter(k)} className="rounded-xl">
              {k === "ALL" ? "All" : k === "SERVICE" ? "Services" : "Bundles"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <m.div key={item.id} whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">{item.kind === "SERVICE" ? "Service" : "Bundle"}</p>
                  <h3 className="text-base font-bold text-[#0F172A] truncate">{item.titleAr || item.title}</h3>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.descriptionAr || item.description}</p>
                </div>
                <Switch
                  checked={item.status === "active"}
                  onCheckedChange={async (checked) => {
                    const res = await api.updateAdminServiceBundle(item.id, { status: checked ? "active" : "inactive" })
                    if (res.success) {
                      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: checked ? "active" : "inactive" } : i)))
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-[#64748B]">Position: {item.position ?? 0}</div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-[#F1F5F9]">
                    <Edit className="w-4 h-4 text-[#64748B]" />
                  </button>
                  <button onClick={() => remove(item.id)} className="p-2 rounded-lg hover:bg-red-50" disabled={deleteId === item.id}>
                    {deleteId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                  </button>
                </div>
              </div>
            </m.div>
          ))}
          {!filtered.length && (
            <div className="col-span-full bg-white rounded-2xl border border-[#E2E8F0]/60 p-10 text-center text-[#64748B]">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-60" />
              No items yet.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
            <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-2xl bg-white rounded-2xl border border-[#E2E8F0]/60 max-h-[92vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-[#0F172A]">{editing ? "Edit item" : "Add item"}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(["SERVICE", "BUNDLE"] as const).map((k) => (
                    <Button key={k} variant={form.kind === k ? "default" : "outline"} onClick={() => setForm((f) => ({ ...f, kind: k }))}>
                      {k === "SERVICE" ? "Service" : "Bundle"}
                    </Button>
                  ))}
                </div>
                <Input placeholder="Title (EN)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <Input placeholder="Title (AR)" value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} />
                <Textarea placeholder="Description (EN)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                <Textarea placeholder="Description (AR)" value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} />
                <MediaUploader value={form.image || ""} onChange={(url) => setForm((f) => ({ ...f, image: url }))} label="Image" />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Price (optional)"
                    value={form.price ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? null : Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Position"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}
                  />
                </div>
                <Input placeholder="CTA URL (optional)" value={form.ctaUrl || ""} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
                <div className="flex items-center gap-2">
                  <Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm((f) => ({ ...f, status: checked ? "active" : "inactive" }))} />
                  <span className="text-sm text-[#64748B]">Active</span>
                </div>
              </div>
              <div className="p-5 border-t border-[#E2E8F0]/60 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Create"}
                </Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
