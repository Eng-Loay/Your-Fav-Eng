"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { m, AnimatePresence } from "framer-motion"
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  TrendingUp,
  AlertTriangle,
  X,
  Power,
  ExternalLink,
  Grid3X3,
  List,
  Tag,
  FileDown,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import CourseImage from "@/components/admin/courses/course-image"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { adminStatStyle } from "@/lib/admin-theme"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.04 } } }

const STORE_ENABLED_KEY = "lms_store_enabled"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

interface Product {
  id: string
  title: string
  titleAr?: string
  description?: string
  thumbnail?: string
  price: number
  currency?: string
  type?: string
  category?: string
  fileUrl?: string
  stock?: number | null
  status: string
  seller?: { id: string; name: string }
  _count?: { orderItems: number; productOrders: number }
  createdAt: string
}

function loadStoreEnabled(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORE_ENABLED_KEY) === "true"
}

async function saveStoreEnabled(enabled: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_ENABLED_KEY, String(enabled))
  window.dispatchEvent(new Event("store-toggle"))
  try {
    await api.request("/admin/settings/store", {
      method: "PUT",
      body: { settings: { store_enabled: String(enabled) } },
    })
  } catch {}
}

export default function StorePage() {
  const { showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const [storeEnabled, setStoreEnabled] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [openAction, setOpenAction] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  useEffect(() => {
    setStoreEnabled(loadStoreEnabled())
    api.request("/settings/store-status").then((res) => {
      if (res.success) {
        const enabled = (res.data as any)?.enabled === true
        setStoreEnabled(enabled)
        localStorage.setItem(STORE_ENABLED_KEY, String(enabled))
      }
    }).catch(() => {})
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.request("/admin/products?limit=100")
      if (res.success) {
        const data = res.data as any
        setProducts(Array.isArray(data) ? data : data?.data || [])
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStore = (enabled: boolean) => {
    setStoreEnabled(enabled)
    saveStoreEnabled(enabled)
    showToast(enabled ? "تم تفعيل المتجر الإلكتروني" : "تم تعطيل المتجر الإلكتروني")
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.titleAr && p.titleAr.includes(search))
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const publishedCount = products.filter((p) => p.status === "active").length
  const totalStock = products.reduce((a, p) => a + (p.stock || 0), 0)
  const totalOrders = products.reduce((a, p) => a + (p._count?.productOrders || 0), 0)

  const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
    active: { label: "نشط", bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    inactive: { label: "معطل", bg: "bg-red-50 text-red-600", dot: "bg-red-400" },
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await api.request(`/admin/products/${deleteTarget.id}`, { method: "DELETE" })
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        showToast("تم حذف المنتج بنجاح")
      } else {
        showToast("حدث خطأ أثناء الحذف", "error")
      }
    } catch {
      showToast("حدث خطأ", "error")
    }
    setDeleteTarget(null)
  }

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active"
    try {
      const res = await api.request(`/admin/products/${product.id}`, {
        method: "PUT",
        body: { status: newStatus },
      })
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        )
        showToast("تم تحديث حالة المنتج")
      }
    } catch {
      showToast("حدث خطأ", "error")
    }
    setOpenAction(null)
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Store Toggle Banner */}
      <m.div
        variants={fadeUp}
        className={`rounded-2xl border-2 p-5 transition-all ${
          storeEnabled
            ? "bg-gradient-to-l from-emerald-50 to-white border-emerald-200"
            : "bg-gradient-to-l from-slate-50 to-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                storeEnabled ? "bg-emerald-100" : "bg-slate-100"
              }`}
            >
              <Power className={`w-6 h-6 ${storeEnabled ? "text-emerald-600" : "text-slate-400"}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">المتجر الإلكتروني</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {storeEnabled
                  ? "المتجر مفعل — يظهر في الموقع ويمكن للزوار تصفح المنتجات"
                  : "المتجر معطل — لن يظهر في الموقع"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {storeEnabled && (
              <Link href="/store" target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  زيارة المتجر
                </Button>
              </Link>
            )}
            <Switch
              checked={storeEnabled}
              onCheckedChange={handleToggleStore}
              className="data-[state=checked]:bg-emerald-500 scale-125"
            />
          </div>
        </div>
      </m.div>

      {/* Header */}
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المنتجات</h1>
          <p className="text-sm text-slate-500 mt-1">إضافة وإدارة منتجات المتجر الإلكتروني</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/store/orders">
            <Button variant="outline" className="gap-2 rounded-xl h-11 px-5 border-slate-200">
              <TrendingUp className="w-4 h-4" />
              الطلبات
            </Button>
          </Link>
          <Link href="/admin/store/new">
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25/25 h-11 px-6">
              <Plus className="w-4 h-4" />
              إضافة منتج جديد
            </Button>
          </Link>
        </div>
      </m.div>

      {/* Stats */}
      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المنتجات", value: products.length, icon: Package, ...adminStatStyle(0) },
          { label: "المنتجات النشطة", value: publishedCount, icon: Eye, ...adminStatStyle(1) },
          { label: "المخزون الكلي", value: totalStock.toLocaleString(), icon: ShoppingBag, ...adminStatStyle(2) },
          { label: "إجمالي الطلبات", value: totalOrders.toLocaleString(), icon: TrendingUp, ...adminStatStyle(3) },
        ].map((s, i) => (
          <m.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} ${s.icon} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </m.div>
        ))}
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
              placeholder="البحث في المنتجات..."
              className="bg-transparent text-sm outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
              {[
                { value: "all", label: "الكل" },
                { value: "active", label: "نشط" },
                { value: "inactive", label: "معطل" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === item.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex border border-slate-200/60 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </m.div>

      {/* Products */}
      {loading ? (
        <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="flex justify-between pt-2">
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </m.div>
      ) : filtered.length === 0 ? (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-5">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">لا توجد منتجات</h3>
          <p className="text-sm text-slate-400 mt-2">ابدأ بإضافة أول منتج للمتجر</p>
          <Link href="/admin/store/new">
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white mt-5">
              <Plus className="w-4 h-4" /> إضافة منتج
            </Button>
          </Link>
        </m.div>
      ) : viewMode === "grid" ? (
        <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <m.div
              key={product.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <CourseImage src={product.thumbnail} alt={product.title} />
                <div className="absolute top-3 start-3 flex gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm ${statusConfig[product.status]?.bg || statusConfig.inactive.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[product.status]?.dot || statusConfig.inactive.dot}`} />
                    {statusConfig[product.status]?.label || product.status}
                  </span>
                  {product.type === "DIGITAL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-violet-500/90 text-white backdrop-blur-sm">
                      <FileDown className="w-3 h-3" /> رقمي
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{product.titleAr || product.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {product.category && (
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 hover:bg-slate-100">
                          <Tag className="w-2.5 h-2.5 ml-0.5" /> {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenAction(openAction === product.id ? null : product.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    <AnimatePresence>
                      {openAction === product.id && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute end-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200/60 py-1.5 z-30"
                        >
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 w-full"
                          >
                            {product.status === "active" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {product.status === "active" ? "تعطيل" : "تفعيل"}
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setDeleteTarget(product)
                              setOpenAction(null)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> حذف
                          </button>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-primary">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-slate-500">
                    {product.type === "DIGITAL" ? "رقمي" : `${product.stock || 0} بالمخزون`}
                  </span>
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      ) : (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-start px-5 py-3.5 font-semibold">المنتج</th>
                  <th className="text-start px-3 py-3.5 font-semibold">النوع</th>
                  <th className="text-start px-3 py-3.5 font-semibold">التصنيف</th>
                  <th className="text-start px-3 py-3.5 font-semibold">السعر</th>
                  <th className="text-start px-3 py-3.5 font-semibold">المخزون</th>
                  <th className="text-start px-3 py-3.5 font-semibold">الحالة</th>
                  <th className="text-start px-3 py-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-[72px] overflow-hidden rounded-lg shrink-0 bg-slate-100">
                          <CourseImage src={product.thumbnail} alt={product.title} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.titleAr || product.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5" dir="ltr">{product.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {product.type === "DIGITAL" ? (
                        <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-600">
                          <FileDown className="w-2.5 h-2.5 ml-0.5" /> رقمي
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <Package className="w-2.5 h-2.5 ml-0.5" /> مادي
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600">{product.category || "—"}</td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm font-bold text-primary">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600">
                      {product.type === "DIGITAL" ? "∞" : product.stock || 0}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusConfig[product.status]?.bg || statusConfig.inactive.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[product.status]?.dot || statusConfig.inactive.dot}`} />
                        {statusConfig[product.status]?.label || product.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={product.status === "active"}
                          onCheckedChange={() => handleToggleStatus(product)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </m.div>
      )}

      {/* Delete Dialog */}
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
                <h3 className="text-lg font-bold text-slate-900">حذف المنتج</h3>
                <p className="text-sm text-slate-500 mt-2">
                  هل أنت متأكد من حذف <span className="font-semibold text-slate-900">{deleteTarget.titleAr || deleteTarget.title}</span>؟
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

      {openAction && <div className="fixed inset-0 z-10" onClick={() => setOpenAction(null)} />}
    </m.div>
  )
}
