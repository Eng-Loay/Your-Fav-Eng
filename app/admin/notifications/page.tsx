"use client"

import React, { useState } from "react"
import { m } from "framer-motion"
import {
  Bell,
  Send,
  Mail,
  Smartphone,
  Monitor,
  Users,
  GraduationCap,
  Presentation,
  User,
  Clock,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const PAGE_SIZE = 10

interface NotificationHistoryItem {
  id: string
  title: string
  titleAr?: string
  target: string
  channel: string
  sentAt: string
  read: number
  total: number
  status: "delivered" | "pending" | "failed"
}

interface NotificationStats {
  totalSent: number
  readRate: number
  totalRecipients: number
}

export default function NotificationsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [target, setTarget] = useState("all")
  const [targetEmail, setTargetEmail] = useState("")
  const [channels, setChannels] = useState<string[]>(["inapp"])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)

  const { data: stats, loading: loadingStats } = useApi<NotificationStats>(
    () => api.getAdminNotificationStats(),
    { immediate: true }
  )

  const { data: history, loading: loadingHistory, refetch } = useApi<NotificationHistoryItem[]>(
    () => api.getAdminNotificationHistory(),
    { immediate: true }
  )

  const notificationHistory = history || []
  const notificationStats = stats || { totalSent: 0, readRate: 0, totalRecipients: 0 }

  const totalPages = Math.max(1, Math.ceil(notificationHistory.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = notificationHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  const handleSendNotification = async () => {
    if (!title || !message || channels.length === 0) return
    setSending(true)
    try {
      await api.sendAdminNotification({
        target,
        targetEmail: target === "specific" ? targetEmail : undefined,
        channels,
        title,
        message,
      })
      setTitle("")
      setMessage("")
      setTargetEmail("")
      showToast(isAr ? "تم إرسال الإشعار بنجاح" : "Notification sent successfully")
      refetch()
    } catch (err) {
      showToast(isAr ? "فشل في إرسال الإشعار" : "Failed to send notification", "error")
    } finally {
      setSending(false)
    }
  }

  if (loadingStats || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const targets = [
    { key: "all", label: isAr ? "الجميع" : "All Users", icon: Users },
    { key: "students", label: isAr ? "الطلاب" : "Students", icon: GraduationCap },
    { key: "teachers", label: isAr ? "المعلمين" : "Teachers", icon: Presentation },
    { key: "parents", label: isAr ? "أولياء الأمور" : "Parents", icon: Users },
    { key: "admins", label: isAr ? "المديرون" : "Admins", icon: Users },
    { key: "specific", label: isAr ? "مستخدم محدد" : "Specific User", icon: User },
  ]

  const channelOptions = [
    { key: "email", label: isAr ? "بريد إلكتروني" : "Email", icon: Mail },
    { key: "push", label: isAr ? "إشعار فوري" : "Push", icon: Smartphone },
    { key: "inapp", label: isAr ? "داخل التطبيق" : "In-App", icon: Monitor },
  ]

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة الإشعارات" : "Notifications Management"}</h1>
        <p className="text-sm text-[#64748B] mt-1">{isAr ? "إرسال وإدارة الإشعارات للمستخدمين" : "Send and manage notifications to users"}</p>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><Bell className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{notificationStats.totalSent || notificationHistory.length}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "إشعارات مرسلة" : "Notifications Sent"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669] mb-3"><CheckCircle className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{notificationStats.readRate || 0}%</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "معدل القراءة" : "Read Rate"}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-3"><Send className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{(notificationStats.totalRecipients || 0).toLocaleString()}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "إجمالي المستلمين" : "Total Recipients"}</p>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-4">{isAr ? "إرسال إشعار جديد" : "Send New Notification"}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-2">{isAr ? "المستهدفون" : "Target Audience"}</label>
            <div className="flex flex-wrap gap-2">
              {targets.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTarget(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    target === t.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {target === "specific" && (
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "البريد الإلكتروني" : "User Email"}</label>
              <input 
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder={isAr ? "أدخل البريد الإلكتروني..." : "Enter user email..."} 
                className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-2">{isAr ? "قنوات الإرسال" : "Channels"}</label>
            <div className="flex gap-2">
              {channelOptions.map(ch => (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    channels.includes(ch.key)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-white text-[#64748B] border-[#E2E8F0]/60 hover:border-primary/20"
                  }`}
                >
                  <ch.icon className="w-3.5 h-3.5" /> {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "العنوان" : "Title"}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الرسالة" : "Message"}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <Button 
            onClick={handleSendNotification}
            disabled={sending || !title || !message || channels.length === 0}
            className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {isAr ? "إرسال الإشعار" : "Send Notification"}
          </Button>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60">
          <h3 className="text-sm font-bold text-[#0F172A]">{isAr ? "سجل الإشعارات" : "Notification History"}</h3>
        </div>

        {notificationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Inbox className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">{isAr ? "لا توجد إشعارات" : "No notifications yet"}</p>
            <p className="text-xs text-[#94A3B8]">{isAr ? "ستظهر الإشعارات المرسلة هنا" : "Sent notifications will appear here"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "العنوان" : "Title"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المستهدفون" : "Target"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "القنوات" : "Channels"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "تاريخ الإرسال" : "Sent At"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "القراءة" : "Read"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((n) => (
                    <tr key={n.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{isAr ? (n.titleAr || n.title) : n.title}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">
                        {n.target === "all" ? (isAr ? "الجميع" : "All") :
                         n.target === "students" ? (isAr ? "الطلاب" : "Students") :
                         n.target === "teachers" ? (isAr ? "المعلمين" : "Teachers") :
                         n.target === "instructors" ? (isAr ? "المدربين" : "Instructors") :
                         n.target === "parents" ? (isAr ? "أولياء الأمور" : "Parents") :
                         n.target === "admins" ? (isAr ? "المديرون" : "Admins") :
                         n.target === "specific" ? (isAr ? "مستخدم محدد" : "Specific") :
                         n.target}
                      </td>
                      <td className="px-3 py-3 text-xs text-[#64748B]">{isAr ? "داخل التطبيق" : "In-App"}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{n.sentAt}</td>
                      <td className="px-3 py-3 text-sm text-[#0F172A]">
                        {(n.read ?? 0).toLocaleString()} / {(n.total ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          n.status === "delivered" ? "bg-green-100 text-green-700" :
                          n.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {n.status === "delivered" ? (isAr ? "تم الإرسال" : "Delivered") :
                           n.status === "pending" ? (isAr ? "قيد الانتظار" : "Pending") :
                           (isAr ? "فشل" : "Failed")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notificationHistory.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0]/40">
                <p className="text-xs text-[#94A3B8]">
                  {isAr
                    ? `عرض ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, notificationHistory.length)} من ${notificationHistory.length}`
                    : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, notificationHistory.length)} of ${notificationHistory.length}`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#0F172A] min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </m.div>
    </m.div>
  )
}
