"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ChevronLeft,
  Package,
  DollarSign,
  Clock,
  ShoppingBag,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

interface Order {
  id: string
  productId: string
  userId: string
  quantity: number
  total: number
  status: string
  address?: string
  createdAt: string
  product?: { id: string; title: string; titleAr?: string; thumbnail?: string; price: number; type: string }
  user?: { id: string; name: string; email: string }
}

export default function StoreOrdersPage() {
  const { formatCurrency } = usePlatformCurrency()
  const { showToast } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingCount: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionOrderId, setActionOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const q = statusFilter !== "all" ? `?status=${statusFilter}&limit=100` : "?limit=100"
      const res = await api.request(`/admin/store/orders${q}`)
      if (res.success && res.data) {
        const d = res.data as { data?: Order[] }
        setOrders(Array.isArray(d) ? d : d?.data ?? [])
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.request("/admin/store/orders/stats")
      if (res.success && res.data) {
        setStats(res.data as typeof stats)
      }
    } catch {}
  }

  const statusConfig: Record<string, { label: string; bg: string }> = {
    pending: { label: "قيد الانتظار", bg: "bg-amber-50 text-amber-700" },
    completed: { label: "مكتمل", bg: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "ملغي", bg: "bg-red-50 text-red-600" },
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setActionOrderId(orderId)
    try {
      const res = await api.request(`/admin/store/orders/${orderId}/status`, {
        method: "PUT",
        body: { status: newStatus },
      })
      if (res.success) {
        showToast("تم تحديث الحالة")
        fetchOrders()
        fetchStats()
      } else {
        showToast(res.message ?? "فشل", "error")
      }
    } catch {
      showToast("حدث خطأ", "error")
    } finally {
      setActionOrderId(null)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm("حذف هذا الطلب؟")) return
    setActionOrderId(orderId)
    try {
      const res = await api.request(`/admin/store/orders/${orderId}`, { method: "DELETE" })
      if (res.success) {
        showToast("تم الحذف")
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        fetchStats()
      } else {
        showToast(res.message ?? "فشل", "error")
      }
    } catch {
      showToast("حدث خطأ", "error")
    } finally {
      setActionOrderId(null)
    }
  }

  return (
    <m.div initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex items-center gap-4">
        <Link
          href="/admin/store"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">طلبات المتجر</h1>
          <p className="text-sm text-slate-500 mt-0.5">عرض وإدارة طلبات المتجر الإلكتروني</p>
        </div>
      </m.div>

      {/* Stats */}
      <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي الطلبات", value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, bg: "bg-primary/10", color: "text-primary" },
          { label: "إجمالي الإيرادات", value: formatCurrency(stats.totalRevenue), icon: DollarSign, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "طلبات قيد الانتظار", value: stats.pendingCount.toLocaleString(), icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </m.div>

      {/* Filters */}
      <m.div variants={fadeUp} className="flex gap-2">
        {["all", "pending", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "الكل" : statusConfig[s]?.label ?? s}
          </button>
        ))}
      </m.div>

      {/* Orders Table */}
      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">المنتج</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">العميل</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">الكمية</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">المبلغ</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">الحالة</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">التاريخ</th>
                  <th className="text-start py-4 px-4 text-xs font-semibold text-slate-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {order.product?.thumbnail ? (
                            <img src={order.product.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-slate-900">
                          {order.product?.titleAr || order.product?.title || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{order.user?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{order.quantity}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[order.status]?.bg ?? "bg-slate-100 text-slate-600"}`}>
                        {statusConfig[order.status]?.label ?? order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "completed")}
                            disabled={!!actionOrderId}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50"
                            title="مكتمل"
                          >
                            {actionOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "cancelled")}
                            disabled={!!actionOrderId}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 disabled:opacity-50"
                            title="إلغاء"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={!!actionOrderId}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </m.div>
    </m.div>
  )
}
