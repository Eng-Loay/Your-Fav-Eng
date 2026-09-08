"use client"

import { useMemo } from "react"
import { m } from "framer-motion"
import { CreditCard, TrendingUp, Calendar, FileText } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApi, api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function BillingPage() {
  const { locale, dir, t } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const { data: summaryData } = useApi<any>(() => api.getBillingSummary())
  const { data: transactionsData } = useApi<any[]>(() => api.getBillingTransactions())

  const summary = (summaryData && typeof summaryData === "object" && "totalSpent" in summaryData
    ? summaryData
    : { totalOrders: 0, totalSpent: 0, lastPurchaseDate: "" }) as { totalOrders?: number; totalSpent?: number; lastPurchaseDate?: string }
  const totalSpent = Number(summary.totalSpent ?? 0)
  const totalOrders = Number(summary.totalOrders ?? 0)
  const lastDate = summary.lastPurchaseDate ?? "-"

  const summaryCards = [
    { label: locale === "ar" ? "إجمالي الإنفاق" : "Total Spent", value: formatCurrency(totalSpent), icon: TrendingUp, color: "from-blue-500 to-blue-600" },
    { label: locale === "ar" ? "عدد الطلبات" : "Total Orders", value: String(totalOrders), icon: CreditCard, color: "from-green-500 to-green-600" },
    { label: locale === "ar" ? "آخر عملية شراء" : "Last Purchase", value: lastDate, icon: Calendar, color: "from-purple-500 to-purple-600" },
  ]

  const transactions = useMemo(() => {
    const raw = transactionsData as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? (raw?.data?.data ?? [])
    if (!list || !Array.isArray(list)) return []
    return list.map((order: Record<string, unknown>) => {
      const items = (order.items as Array<Record<string, unknown>>) ?? []
      const firstItem = items[0]
      const firstTitle =
        firstItem?.title ??
        (firstItem?.course as Record<string, unknown>)?.title ??
        (firstItem?.course as Record<string, unknown>)?.titleAr ??
        ""
      const dateVal = order.createdAt
      const dateStr = dateVal ? (typeof dateVal === "string" ? dateVal.split("T")[0] : new Date(dateVal as Date).toISOString().split("T")[0]) : ""
      return {
        date: dateStr,
        course: { titleAr: String(firstTitle || ""), titleEn: String(firstTitle || "") },
        amount: Number(order.total ?? 0),
        status: (order.status === "COMPLETED" || order.status === "paid" ? "paid" : "pending") as "paid" | "pending",
      }
    })
  }, [transactionsData])

  return (
    <div dir={dir}>
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.billingHistory")}</h2>

      <m.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {summaryCards.map((card) => (
          <m.div
            key={card.label}
            variants={item}
            className="bg-white rounded-[20px] border border-border p-5 hover:shadow-lg transition-shadow"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </m.div>
        ))}
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[20px] border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h3 className="font-bold">{locale === "ar" ? "سجل المعاملات" : "Transaction History"}</h3>
        </div>

        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-[#94A3B8]" />
              <p className="text-sm text-[#64748B]">{locale === "ar" ? "لا توجد معاملات حتى الآن" : "No transactions yet"}</p>
            </div>
          ) : (
          transactions.map((tx, i) => (
            <div key={i} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {locale === "ar" ? tx.course.titleAr : tx.course.titleEn}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{tx.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm">
                  {tx.amount <= 0 ? (locale === "ar" ? "مجاني" : "Free") : formatCurrency(tx.amount)}
                </span>
                <Badge
                  variant={tx.status === "paid" ? "default" : "secondary"}
                  className={
                    tx.status === "paid"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                  }
                >
                  {t(`dashboard.${tx.status}`)}
                </Badge>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  {t("dashboard.invoice")}
                </Button>
              </div>
            </div>
          ))
          )}
        </div>
      </m.div>
    </div>
  )
}
