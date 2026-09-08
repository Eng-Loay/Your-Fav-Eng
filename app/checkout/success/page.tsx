"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import { CheckCircle2, Download, Package, BookOpen, ArrowRight, ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { Button } from "@/components/ui/button"
import { cn, getProductFileUrl } from "@/lib/utils"
import { AnimatedPageHero } from "@/components/ui/animated-page-hero"

function CheckoutSuccessContent() {
  const { locale, dir } = useI18n()
  const { isLoggedIn } = useStore()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [order, setOrder] = useState<{
    id: string
    status: string
    total: number
    items?: Array<{
      id: string
      title: string
      productId?: string
      product?: { id: string; title: string; type: string; fileUrl?: string }
      course?: { id: string; slug: string }
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = "/login?redirect=/checkout/success"
      return
    }
    if (sessionId) {
      api.getOrderBySessionId(sessionId).then((res) => {
        if (res.success && res.data) {
          setOrder(res.data as typeof order)
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      api.getMyOrders({ limit: 1 }).then((res) => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0] as typeof order
          api.getOrderById(latest.id).then((r) => {
            if (r.success && r.data) setOrder(r.data as typeof order)
            setLoading(false)
          }).catch(() => setLoading(false))
        } else {
          setLoading(false)
        }
      }).catch(() => setLoading(false))
    }
  }, [isLoggedIn, sessionId])

  const digitalProducts = order?.items?.filter((i) => i.product?.type === "DIGITAL" && i.product?.fileUrl) ?? []
  const isRTL = dir === "rtl"
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <div dir={dir} className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <AnimatedPageHero
        badge={locale === "ar" ? "تم التأكيد" : "Order Confirmed"}
        title={locale === "ar" ? "شكراً لشرائك!" : "Thank you for your purchase!"}
        subtitle={locale === "ar" ? "تم استلام طلبك بنجاح" : "Your order has been received successfully"}
        compact
      />
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm"
        >
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-[#64748B]">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-bold text-[#0F172A]">
                {locale === "ar" ? "تم تأكيد الطلب!" : "Order Confirmed!"}
              </h2>
              {order && (
                <p className="mb-6 text-center text-[#64748B]">
                  {locale === "ar" ? "رقم الطلب:" : "Order #"}{order.id.slice(0, 8)}
                </p>
              )}

              {digitalProducts.length > 0 && (
                <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#0F172A]">
                    <Download className="h-4 w-4" />
                    {locale === "ar" ? "تحميل ملفات المنتجات الرقمية" : "Download Digital Products"}
                  </h3>
                  <ul className="space-y-2">
                    {digitalProducts.map((item) => (
                      <li key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                        <span className="text-sm font-medium text-[#0F172A]"
                          >{locale === "ar" && item.product?.titleAr ? item.product.titleAr : item.title}</span>
                        <a
                          href={getProductFileUrl(item.product?.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {locale === "ar" ? "تحميل" : "Download"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/dashboard/purchases">
                  <Button className={cn("w-full gap-2 rounded-xl sm:w-auto bg-primary hover:bg-primary-hover")}>
                    {locale === "ar" ? "الذهاب لصفحة المشتريات" : "Go to My Purchases"}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                </Link>
                {order?.items?.some((i) => i.course) && (
                  <Link href="/courses">
                    <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto">
                      <BookOpen className="h-4 w-4" />
                      {locale === "ar" ? "تصفح الدورات" : "Browse Courses"}
                    </Button>
                  </Link>
                )}
                <Link href="/store">
                  <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto">
                    <Package className="h-4 w-4" />
                    {locale === "ar" ? "المتجر" : "Store"}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </m.div>
      </section>
      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
