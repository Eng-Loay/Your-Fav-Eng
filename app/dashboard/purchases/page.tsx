"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ShoppingBag,
  Download,
  ChevronRight,
  ChevronLeft,
  Package,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { useApi, api } from "@/hooks/use-api"
import { cn, getProductFileUrl } from "@/lib/utils"

type Order = {
  id: string
  status: string
  total: number
  currency: string
  createdAt: string
  billingAddress?: string
  items?: Array<{
    id: string
    title: string
    price: number
    quantity: number
    productId?: string
    product?: { id: string; title: string; titleAr?: string; type: string; fileUrl?: string }
    course?: { id: string; slug: string }
  }>
}

export default function PurchasesPage() {
  const { locale, dir, t } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: ordersRes, loading } = useApi(
    async () => {
      const res = await api.getMyOrders({ page, limit })
      if (res.success) {
        const r = res as { data?: Order[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }
        return { success: true, data: { orders: r.data ?? [], pagination: r.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 } } }
      }
      return res
    },
    { deps: [page] }
  )

  const orders = useMemo((): Order[] => {
    const d = ordersRes as { orders?: Order[] } | null | undefined
    return d?.orders ?? []
  }, [ordersRes])

  const pagination = useMemo(() => {
    const d = ordersRes as { pagination?: { total: number; page: number; limit: number; totalPages: number } } | null | undefined
    return d?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 }
  }, [ordersRes])

  const statusLabel = (status: string) => {
    if (locale === "ar") {
      if (status === "COMPLETED" || status === "APPROVED") return "مكتمل"
      if (status === "PENDING") return "قيد الانتظار"
      if (status === "REJECTED") return "مرفوض"
      if (status === "SHIPPED") return "تم الشحن"
      if (status === "PROCESSING") return "قيد التجهيز"
      return status
    }
    if (status === "COMPLETED" || status === "APPROVED") return "Completed"
    if (status === "REJECTED") return "Rejected"
    if (status === "SHIPPED") return "Shipped"
    if (status === "PROCESSING") return "Processing"
    return status
  }

  const StatusIcon = ({ status }: { status: string }) =>
    status === "COMPLETED" || status === "APPROVED" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : status === "REJECTED" ? (
      <Clock className="h-4 w-4 text-red-500" />
    ) : (
      <Clock className="h-4 w-4 text-amber-500" />
    )

  return (
    <div dir={dir} className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t("dashboard.purchases")}</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {locale === "ar" ? "عرض جميع طلباتك وحالتها" : "View all your orders and their status"}
          </p>
        </div>
      </m.div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-16"
        >
          <ShoppingBag className="mb-4 h-16 w-16 text-[#94A3B8]" />
          <h3 className="text-lg font-bold text-[#0F172A]">
            {locale === "ar" ? "لا توجد مشتريات" : "No purchases yet"}
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            {locale === "ar" ? "ستظهر طلباتك هنا بعد إتمام الشراء" : "Your orders will appear here after purchase"}
          </p>
          <Link href="/courses">
            <button className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover">
              {locale === "ar" ? "تصفح الدورات" : "Browse Courses"}
            </button>
          </Link>
        </m.div>
      ) : (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 rounded-xl bg-[#F1F5F9] items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-[#64748B]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#64748B]">#{order.id.slice(0, 8)}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          order.status === "COMPLETED" || order.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : order.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        )}
                      >
                        <StatusIcon status={order.status} />
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </div>
                    <p className="mt-2 font-bold text-[#0F172A]">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/purchases/${order.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {locale === "ar" ? "عرض التفاصيل" : "View details"}
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Link>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                  {order.billingAddress && order.items.some((i) => i.product?.type !== "DIGITAL") && (
                    <p className="mb-3 text-xs text-[#64748B]">
                      {locale === "ar" ? "عنوان الشحن:" : "Shipping:"} {order.billingAddress}
                    </p>
                  )}
                  <h4 className="mb-2 text-xs font-semibold text-[#64748B]">
                    {locale === "ar" ? "العناصر" : "Items"}
                  </h4>
                  <ul className="space-y-2">
                    {order.items.map((item) => {
                      const isDigital = item.product?.type === "DIGITAL" && item.product?.fileUrl
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {item.product ? (
                              <Package className="h-4 w-4 text-[#94A3B8]" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-[#94A3B8]" />
                            )}
                            <span className="text-sm font-medium text-[#0F172A]">
                              {locale === "ar" && item.product?.titleAr ? item.product.titleAr : item.title}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-[#64748B]">×{item.quantity}</span>
                            )}
                          </div>
                          {isDigital && (
                            <a
                              href={getProductFileUrl(item.product?.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white hover:bg-primary-hover"
                            >
                              <Download className="h-3 w-3" />
                              {locale === "ar" ? "تحميل" : "Download"}
                            </a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </button>
              <span className="text-sm text-[#64748B]">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {locale === "ar" ? "التالي" : "Next"}
              </button>
            </div>
          )}
        </m.div>
      )}
    </div>
  )
}
