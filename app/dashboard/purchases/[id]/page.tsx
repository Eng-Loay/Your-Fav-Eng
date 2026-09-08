"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { ArrowLeft, Download, Package, BookOpen, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { getProductFileUrl } from "@/lib/utils"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isRTL = dir === "rtl"
  const orderId = params.id as string

  const { data: order, loading } = useApi(
    () => api.getOrderById(orderId),
    { deps: [orderId] }
  )

  const ord = order as {
    id: string
    status: string
    total: number
    currency: string
    createdAt: string
    items?: Array<{
      id: string
      title: string
      price: number
      quantity: number
      productId?: string
      product?: { id: string; title: string; titleAr?: string; type: string; fileUrl?: string }
      course?: { id: string; slug: string }
    }>
  } | null

  if (!loading && !ord) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-[#64748B]">{locale === "ar" ? "الطلب غير موجود" : "Order not found"}</p>
        <Link href="/dashboard/purchases">
          <Button variant="outline" className="mt-4">
            {locale === "ar" ? "العودة للمشتريات" : "Back to Purchases"}
          </Button>
        </Link>
      </div>
    )
  }

  const digitalProducts = ord?.items?.filter((i) => i.product?.type === "DIGITAL" && i.product?.fileUrl) ?? []

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            {locale === "ar" ? "تفاصيل الطلب" : "Order Details"}
          </h1>
          <p className="text-sm text-[#64748B]">#{ord?.id?.slice(0, 8) ?? "—"}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : ord ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                ord.status === "COMPLETED" || ord.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700"
                  : ord.status === "REJECTED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {ord.status === "REJECTED" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {ord.status === "COMPLETED" || ord.status === "APPROVED"
                ? (locale === "ar" ? "مكتمل" : "Completed")
                : ord.status === "REJECTED"
                  ? (locale === "ar" ? "مرفوض" : "Rejected")
                  : (locale === "ar" ? "قيد الانتظار" : "Pending")}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
              <Calendar className="h-4 w-4" />
              {new Date(ord.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
            </span>
            <span className="font-bold text-[#0F172A]">
              {formatCurrency(ord.total)}
            </span>
          </div>

          <h3 className="mb-3 font-semibold text-[#0F172A]">
            {locale === "ar" ? "العناصر" : "Items"}
          </h3>
          <ul className="space-y-3">
            {ord.items?.map((item) => {
              const isDigital = item.product?.type === "DIGITAL" && item.product?.fileUrl
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {item.product ? (
                      <Package className="h-5 w-5 text-[#64748B]" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-[#64748B]" />
                    )}
                    <div>
                      <p className="font-medium text-[#0F172A]">
                        {locale === "ar" && item.product?.titleAr ? item.product.titleAr : item.title}
                      </p>
                      <p className="text-sm text-[#64748B]">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  {isDigital && (
                    <a
                      href={getProductFileUrl(item.product?.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
                    >
                      <Download className="h-4 w-4" />
                      {locale === "ar" ? "تحميل الملف" : "Download File"}
                    </a>
                  )}
                  {item.course && (
                    <Link href={`/courses/${item.course.slug}`}>
                      <Button variant="outline" size="sm">
                        {locale === "ar" ? "عرض الدورة" : "View Course"}
                      </Button>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>

          {digitalProducts.length > 0 && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                {locale === "ar" ? "يمكنك تحميل ملفات المنتجات الرقمية من أزرار التحميل أعلاه" : "You can download digital product files using the download buttons above"}
              </p>
            </div>
          )}
        </m.div>
      ) : null}
    </div>
  )
}
