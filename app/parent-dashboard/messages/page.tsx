"use client"

import { useState, useMemo } from "react"
import { m } from "framer-motion"
import { Search, Send, Paperclip, MoreVertical, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ParentMessagesPage() {
  const { locale, dir } = useI18n()
  const { user, showToast } = useStore()
  const [selectedConversation, setSelectedConversation] = useState(0)
  const [messageText, setMessageText] = useState("")
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState("")
  const [selectedChildForMsg, setSelectedChildForMsg] = useState("")
  const [creating, setCreating] = useState(false)
  const isRTL = dir === "rtl"

  const { data: conversationsData, refetch: refetchConvs } = useApi(() => api.getParentConversations())
  const { data: instructorsData } = useApi(() => api.getParentChildrenInstructors())
  const { data: childrenData } = useApi(() => api.getParentChildren())

  const conversations = useMemo(() => {
    const childMap = Object.fromEntries(((childrenData as { id: string; name?: string }[]) || []).map((ch) => [ch.id, ch.name || "Child"]))
    if (conversationsData && Array.isArray(conversationsData) && conversationsData.length > 0) {
      return conversationsData.map((c: { id: string; members?: Array<{ userId?: string; user?: { id?: string; name?: string; avatar?: string } }>; messages?: Array<{ content?: string; createdAt?: string }>; title?: string }) => {
        const other = c.members?.find((m) => m.userId !== user?.id && m.user?.id !== user?.id)?.user
        const lastMsg = c.messages?.[0]
        const childMatch = c.title?.match(/Child: ([a-f0-9-]+)/i)
        const childLabel = childMatch ? (childMap[childMatch[1]] || "—") : "—"
        return {
          id: c.id,
          nameEn: safeStr(other?.name) || "Unknown",
          nameAr: safeStr(other?.name) || "غير معروف",
          lastMessageEn: lastMsg?.content || "No messages",
          lastMessageAr: lastMsg?.content || "لا توجد رسائل",
          time: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
          timeAr: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" }) : "",
          unread: 0,
          avatar: (safeStr(other?.name) || "U").charAt(0),
          childEn: childLabel,
          childAr: childLabel,
        }
      })
    }
    return []
  }, [conversationsData, user?.id, childrenData])

  const instructors = (instructorsData && Array.isArray(instructorsData)) ? instructorsData : []
  const children = (childrenData && Array.isArray(childrenData)) ? childrenData : []

  const selectedConvId = String(conversations[Math.min(selectedConversation, Math.max(0, conversations.length - 1))]?.id ?? conversations[0]?.id ?? "")
  const { data: messagesData, refetch: refetchMessages } = useApi(
    () => (selectedConvId ? api.getParentConversationMessages(selectedConvId) : Promise.resolve({ success: false })),
    { deps: [selectedConvId], immediate: !!selectedConvId }
  )

  const messages = useMemo(() => {
    if (messagesData && Array.isArray(messagesData) && messagesData.length > 0) {
      return messagesData.map((m: { id: string; content?: string; createdAt?: string; senderId?: string }) => ({
        id: m.id,
        sender: m.senderId === user?.id ? "me" : "them",
        textEn: m.content || "",
        textAr: m.content || "",
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
      }))
    }
    return []
  }, [messagesData, user?.id])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConvId) return
    const res = await api.sendParentMessage(String(selectedConvId), messageText.trim())
    if (res.success) {
      setMessageText("")
      refetchMessages()
    }
  }

  const handleCreateConversation = async () => {
    if (!selectedInstructor) return
    setCreating(true)
    try {
      const res = await api.createParentConversation(selectedInstructor, selectedChildForMsg || undefined)
      if (res.success && res.data) {
        setNewMessageOpen(false)
        setSelectedInstructor("")
        setSelectedChildForMsg("")
        refetchConvs()
        showToast(locale === "ar" ? "تم إنشاء المحادثة" : "Conversation created")
        const conv = res.data as { id: string }
        const idx = conversations.findIndex((c) => c.id === conv.id)
        if (idx >= 0) setSelectedConversation(idx)
        else setSelectedConversation(0)
      } else {
        showToast(res.message || (locale === "ar" ? "فشل إنشاء المحادثة" : "Failed to create conversation"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "حدث خطأ" : "Something went wrong", "error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الرسائل" : "Messages"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "تواصل مع معلمي أبنائك" : "Contact your children's teachers"}</p>
        </div>
        <Button onClick={() => setNewMessageOpen(true)} className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-xl gap-2 shadow-lg shadow-[#EC4899]/25">
          <Plus className="w-4 h-4" />
          {locale === "ar" ? "رسالة جديدة" : "New Message"}
        </Button>
      </m.div>

      {newMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg text-[#0F172A] mb-4">{locale === "ar" ? "رسالة جديدة للمعلم" : "New Message to Teacher"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-1">{locale === "ar" ? "المعلم" : "Teacher"}</label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                >
                  <option value="">{locale === "ar" ? "اختر المعلم" : "Select teacher"}</option>
                  {instructors.map((inst: { id: string; name: string; children?: { name: string }[] }) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.children?.length ? `(${inst.children.map((c) => c.name).join(", ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-1">{locale === "ar" ? "بخصوص الابن (اختياري)" : "Regarding child (optional)"}</label>
                <select
                  value={selectedChildForMsg}
                  onChange={(e) => setSelectedChildForMsg(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                >
                  <option value="">{locale === "ar" ? "الكل" : "All"}</option>
                  {children.map((ch: { id: string; name?: string }) => (
                    <option key={ch.id} value={ch.id}>{ch.name || "Child"}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setNewMessageOpen(false); setSelectedInstructor(""); setSelectedChildForMsg(""); }}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreateConversation} disabled={!selectedInstructor || creating} className="bg-[#EC4899] hover:bg-[#DB2777]">
                  {creating ? (locale === "ar" ? "جاري..." : "Creating...") : (locale === "ar" ? "بدء المحادثة" : "Start Conversation")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden"
        style={{ height: "calc(100vh - 280px)", minHeight: 500 }}
      >
        <div className="flex h-full">
          <div className={`w-full sm:w-80 border-e border-[#E2E8F0]/60 flex flex-col ${conversations.length === 0 ? "hidden sm:flex" : ""}`}>
            <div className="p-4 border-b border-[#E2E8F0]/60">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={locale === "ar" ? "بحث..." : "Search..."}
                  className="w-full ps-10 pe-4 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-[#94A3B8]">{locale === "ar" ? "لا توجد محادثات. اضغط على رسالة جديدة للتواصل مع معلم ابنك." : "No conversations. Click New Message to contact your child's teacher."}</p>
                </div>
              ) : (
              conversations.map((conv, i) => (
                <m.div
                  key={conv.id}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedConversation(i)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-[#E2E8F0]/30 ${
                    selectedConversation === i ? "bg-[#EC4899]/5" : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{conv.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{locale === "ar" ? conv.nameAr : conv.nameEn}</p>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0 ms-2">{locale === "ar" ? conv.timeAr : conv.time}</span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{locale === "ar" ? conv.lastMessageAr : conv.lastMessageEn}</p>
                    <Badge variant="secondary" className="text-[8px] mt-1 bg-[#EC4899]/10 text-[#EC4899] border-0">
                      {locale === "ar" ? conv.childAr : conv.childEn}
                    </Badge>
                  </div>
                  {conv.unread > 0 && (
                    <div className="flex-shrink-0 h-5 min-w-[20px] rounded-full bg-[#EC4899] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white px-1.5">{conv.unread}</span>
                    </div>
                  )}
                </m.div>
              ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]/60">
              <div className="flex items-center gap-3">
                <button className="sm:hidden p-1" onClick={() => setSelectedConversation(0)}>
                  {isRTL ? "→" : "←"}
                </button>
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{conversations[selectedConversation]?.avatar ?? "?"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {locale === "ar" ? conversations[selectedConversation]?.nameAr : conversations[selectedConversation]?.nameEn ?? (locale === "ar" ? "اختر محادثة" : "Select conversation")}
                  </p>
                  <p className="text-[10px] text-[#EC4899]">{conversations.length > 0 ? (locale === "ar" ? "متصل" : "Online") : ""}</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-[#F1F5F9]">
                <MoreVertical className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <m.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === "me"
                      ? "bg-[#EC4899] text-white rounded-ee-sm"
                      : "bg-[#F1F5F9] text-[#0F172A] rounded-es-sm"
                  }`}>
                    <p className="text-sm">{locale === "ar" ? msg.textAr : msg.textEn}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-white/60" : "text-[#94A3B8]"}`}>{msg.time}</p>
                  </div>
                </m.div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E2E8F0]/60">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors">
                  <Paperclip className="w-5 h-5 text-[#94A3B8]" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]"
                />
                <m.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="p-2.5 rounded-xl bg-[#EC4899] text-white hover:bg-[#DB2777] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </m.button>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </div>
  )
}
