"use client"

import { useState, useMemo, useCallback } from "react"
import { m } from "framer-motion"
import { Bell, CheckCheck, Trash2, Loader2, Inbox } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { locale, dir } = useI18n()
  const isAr = locale === "ar"
  const [markingAll, setMarkingAll] = useState(false)

  const { data: rawData, loading, refetch } = useApi<Notification[]>(
    () => api.getNotifications(),
    { immediate: true }
  )

  const notifications = useMemo(() => {
    const raw = rawData as unknown
    const list = Array.isArray(raw) ? raw : (raw as { data?: Notification[] })?.data ?? []
    return Array.isArray(list) ? list : []
  }, [rawData])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = useCallback(async (id: string) => {
    await api.markNotificationRead(id)
    refetch()
  }, [refetch])

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true)
    await api.markAllNotificationsRead()
    refetch()
    setMarkingAll(false)
  }, [refetch])

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return isAr ? "الآن" : "Just now"
    if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`
    if (diffHr < 24) return isAr ? `منذ ${diffHr} ساعة` : `${diffHr}h ago`
    if (diffDay < 7) return isAr ? `منذ ${diffDay} يوم` : `${diffDay}d ago`
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US")
  }

  const typeColor = (type: string) => {
    if (type === "success") return "bg-emerald-500"
    if (type === "warning") return "bg-amber-500"
    if (type === "error") return "bg-red-500"
    return "bg-blue-500"
  }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isAr ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {unreadCount > 0
              ? isAr
                ? `لديك ${unreadCount} إشعار غير مقروء`
                : `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : isAr
                ? "لا توجد إشعارات جديدة"
                : "No new notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="gap-2 rounded-xl"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            {isAr ? "تعيين الكل كمقروء" : "Mark all as read"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-16"
        >
          <Inbox className="mb-4 h-16 w-16 text-[#94A3B8]" />
          <h3 className="text-lg font-bold text-[#0F172A]">
            {isAr ? "لا توجد إشعارات" : "No notifications yet"}
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            {isAr ? "ستظهر الإشعارات الجديدة هنا" : "New notifications will appear here"}
          </p>
        </m.div>
      ) : (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
        >
          <div className="divide-y divide-[#E2E8F0]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 transition-colors hover:bg-[#F8FAFC] ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      !n.read ? "bg-primary/10" : "bg-[#F1F5F9]"
                    }`}
                  >
                    <Bell
                      className={`h-4 w-4 ${!n.read ? "text-primary" : "text-[#94A3B8]"}`}
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${typeColor(n.type)}`} />
                      <p
                        className={`text-sm font-semibold ${
                          !n.read ? "text-[#0F172A]" : "text-[#64748B]"
                        }`}
                      >
                        {n.title}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-[#94A3B8]">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] leading-relaxed">{n.message}</p>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      {isAr ? "تعيين كمقروء" : "Mark as read"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </m.div>
      )}
    </div>
  )
}
