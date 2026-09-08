"use client"

import { useState, useEffect, useRef } from "react"
import { m, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useApi, api } from "@/hooks/use-api"
import {
  Search,
  Send,
  Plus,
  ArrowLeft,
  ArrowRight,
  Paperclip,
  Mic,
  Square,
  X,
  MessageSquare,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr, resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

function formatConvTime(dateStr: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

type ConversationItem = {
  id: string
  nameEn: string
  nameAr: string
  lastMessageEn: string
  lastMessageAr: string
  time: string
  unread: number
  isGroup?: boolean
}

export default function StudentMessagesPage() {
  const { locale, dir } = useI18n()
  const { user, showToast } = useStore()
  const isRTL = dir === "rtl"
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: conversationsRes, refetch: refetchConvs } = useApi(() => api.getConversations())
  const { data: enrolledInstructors } = useApi(() => api.getEnrolledInstructors(), { deps: [] })

  const convRaw = Array.isArray(conversationsRes) ? conversationsRes : (conversationsRes as { data?: any[] })?.data ?? []
  const conversationsDisplay: ConversationItem[] = convRaw.map((c: any) => {
    const others = c.members?.filter((m: any) => m.userId !== user?.id) ?? []
    const other = others[0]?.user ?? c.otherMember ?? {}
    const lastMsg = c.messages?.[0] ?? c.lastMessage ?? {}
    const displayName = c.isGroup ? (c.title || "Group") : (other.name || "Instructor")
    return {
      id: c.id,
      nameEn: displayName,
      nameAr: displayName,
      lastMessageEn: lastMsg.content ?? "",
      lastMessageAr: lastMsg.content ?? "",
      time: formatConvTime(c.updatedAt ?? lastMsg.createdAt),
      unread: c.members?.find((m: any) => m.userId === user?.id)?.unreadCount ?? 0,
      isGroup: c.isGroup,
    }
  })

  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null)
  const [messagesFromApi, setMessagesFromApi] = useState<any[] | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const selectedConvIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (conversationsDisplay.length && !selectedConversation) {
      setSelectedConversation(conversationsDisplay[0])
    } else if (conversationsDisplay.length && selectedConversation && !conversationsDisplay.find((c) => c.id === selectedConversation.id)) {
      setSelectedConversation(conversationsDisplay[0])
    } else if (!conversationsDisplay.length) {
      setSelectedConversation(null)
    }
  }, [conversationsDisplay])

  useEffect(() => {
    if (!selectedConversation?.id) return
    setMessagesFromApi(null)
    api.getMessages(selectedConversation.id).then((res) => {
      if (res.success && res.data) {
        const msgs = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? []
        setMessagesFromApi(msgs)
      }
    })
  }, [selectedConversation?.id])

  useEffect(() => {
    selectedConvIdRef.current = selectedConversation?.id ?? null
  }, [selectedConversation?.id])

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("lms_token")
    if (!token) return

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const wsUrl = `${protocol}://${window.location.host}/api/messages/ws?token=${encodeURIComponent(
      token,
    )}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === "message:new") {
          refetchConvs()
          const currentId = selectedConvIdRef.current
          if (data.conversationId && data.conversationId === currentId) {
            api.getMessages(data.conversationId).then((res) => {
              if (res.success && res.data) {
                const msgs = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? []
                setMessagesFromApi(msgs)
              }
            })
          }
        }
      } catch {
        // ignore malformed events
      }
    }

    ws.onerror = () => {
      // non-fatal; REST still works
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [refetchConvs])

  const activeConversation = selectedConversation ?? conversationsDisplay[0]
  const messagesDisplay = (messagesFromApi ?? []).map((m: any, i: number) => ({
    id: m.id ?? i + 1,
    sender: m.senderId === user?.id ? ("me" as const) : ("them" as const),
    textEn: m.content ?? "",
    textAr: m.content ?? "",
    time: m.createdAt ?? "",
    attachmentUrl: m.attachmentUrl,
    attachmentType: m.attachmentType,
  }))

  const filteredConversations = conversationsDisplay.filter((c) =>
    (locale === "ar" ? c.nameAr : c.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectConversation = (conv: ConversationItem) => {
    setSelectedConversation(conv)
    setShowMobileChat(true)
  }

  const handleSend = async (content?: string, attachmentUrl?: string, attachmentType?: "image" | "audio") => {
    if (!activeConversation?.id) return
    const text = content ?? messageInput.trim()
    if (!text && !attachmentUrl) return
    setMessageInput("")
    try {
      const res = await api.sendMessage(activeConversation.id, text, attachmentUrl, attachmentType)
      if (res.success) {
        const refreshed = await api.getMessages(activeConversation.id)
        if (refreshed.success && refreshed.data) {
          setMessagesFromApi(Array.isArray(refreshed.data) ? refreshed.data : [])
        }
      }
    } catch {
      showToast(locale === "ar" ? "فشل الإرسال" : "Failed to send", "error")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setUploading(true)
    try {
      const { url, attachmentType } = await api.uploadMessageAttachment(file)
      await handleSend("", `${API_BASE.replace("/api", "")}${url}`, attachmentType as "image")
    } catch {
      showToast(locale === "ar" ? "فشل رفع الصورة" : "Failed to upload image", "error")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const startRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: "audio/webm" })
        const file = new File([blob], "voice.webm", { type: "audio/webm" })
        setUploading(true)
        try {
          const { url, attachmentType } = await api.uploadMessageAttachment(file)
          await handleSend("", `${API_BASE.replace("/api", "")}${url}`, attachmentType as "audio")
        } catch {
          showToast(locale === "ar" ? "فشل رفع التسجيل" : "Failed to upload recording", "error")
        } finally {
          setUploading(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    })
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setRecording(false)
  }

  const findExistingConversation = (instructorId: string) => {
    return convRaw.find((c: any) => {
      if (c.isGroup) return false
      const others = c.members?.filter((m: any) => m.userId !== user?.id) ?? []
      return others.some((m: any) => m.userId === instructorId)
    })
  }

  const handleCreateConversation = async (instructorId: string) => {
    const existing = findExistingConversation(instructorId)
    if (existing) {
      setShowNewConv(false)
      const other = existing.members?.filter((m: any) => m.userId !== user?.id)?.[0]?.user ?? {}
      setSelectedConversation({
        id: existing.id,
        nameEn: other.name || "Instructor",
        nameAr: other.name || "مدرب",
        lastMessageEn: existing.messages?.[0]?.content ?? "",
        lastMessageAr: existing.messages?.[0]?.content ?? "",
        time: formatConvTime(existing.updatedAt),
        unread: 0,
      })
      return
    }
    try {
      const res = await api.createConversation(instructorId)
      if (res.success && res.data) {
        setShowNewConv(false)
        const conv = res.data as any
        setSelectedConversation({
          id: conv.id,
          nameEn: conv.members?.find((m: any) => m.userId !== user?.id)?.user?.name ?? "Instructor",
          nameAr: conv.members?.find((m: any) => m.userId !== user?.id)?.user?.name ?? "مدرب",
          lastMessageEn: "",
          lastMessageAr: "",
          time: "",
          unread: 0,
        })
        refetchConvs()
      }
    } catch {
      showToast(locale === "ar" ? "فشل إنشاء المحادثة" : "Failed to create conversation", "error")
    }
  }

  const instructorsList = Array.isArray(enrolledInstructors) ? enrolledInstructors : (enrolledInstructors as { data?: any[] })?.data ?? []

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          {locale === "ar" ? "الرسائل" : "Messages"}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {locale === "ar" ? "تواصل مع مدربيك" : "Communicate with your instructors"}
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm overflow-hidden"
        style={{ height: "calc(100vh - 260px)", minHeight: 500 }}
      >
        <div className="flex h-full">
          <div className={`w-full md:w-[340px] border-e border-[#E2E8F0]/60 flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-[#E2E8F0]/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {locale === "ar" ? "المحادثات" : "Conversations"}
                </h3>
                <button
                  onClick={() => setShowNewConv(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={locale === "ar" ? "بحث..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none flex-1"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv, i) => (
                <m.button
                  key={conv.id}
                  initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-start transition-colors ${
                    activeConversation?.id === conv.id
                      ? "bg-[#8B5CF6]/5 border-e-2 border-[#8B5CF6]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="relative h-11 w-11 overflow-hidden rounded-xl">
                      <Image src="/user-avatar.png" alt="" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#0F172A] truncate">
                        {locale === "ar" ? conv.nameAr : conv.nameEn}
                      </p>
                      <span className="text-[10px] text-[#94A3B8] shrink-0">{conv.time}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                      {locale === "ar" ? conv.lastMessageAr : conv.lastMessageEn}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6] text-[10px] text-white font-bold shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </m.button>
              ))}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${showMobileChat ? "flex" : "hidden md:flex"}`}>
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-[#94A3B8] p-8">
                <p className="text-sm">
                  {locale === "ar" ? "اختر محادثة أو ابدأ محادثة جديدة" : "Select a conversation or start a new one"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]/60">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors"
                  >
                    {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </button>
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl shrink-0">
                    <Image src="/user-avatar.png" alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0F172A]">
                      {locale === "ar" ? activeConversation.nameAr : activeConversation.nameEn}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesDisplay.map((msg, i) => (
                    <m.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          msg.sender === "me"
                            ? "bg-[#8B5CF6] text-white rounded-ee-md"
                            : "bg-[#F1F5F9] text-[#0F172A] rounded-es-md"
                        }`}
                      >
                        {msg.attachmentType === "image" && msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                            <img src={msg.attachmentUrl} alt="" className="max-w-full rounded-lg max-h-48 object-cover" />
                          </a>
                        )}
                        {msg.attachmentType === "audio" && msg.attachmentUrl && (
                          <audio controls className="mb-2 max-w-full" src={msg.attachmentUrl} />
                        )}
                        <p className="text-sm leading-relaxed">
                          {locale === "ar" ? msg.textAr : msg.textEn}
                        </p>
                        <span className={`text-[10px] block mt-1 ${msg.sender === "me" ? "text-white/60" : "text-[#94A3B8]"}`}>
                          {msg.time ? new Date(msg.time).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </m.div>
                  ))}
                </div>

                <div className="p-4 border-t border-[#E2E8F0]/60">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition-colors shrink-0"
                    >
                      <Paperclip className="w-4 h-4 text-[#94A3B8]" />
                    </button>
                    {recording ? (
                      <button
                        onClick={stopRecording}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shrink-0"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition-colors shrink-0"
                      >
                        <Mic className="w-4 h-4 text-[#94A3B8]" />
                      </button>
                    )}
                    <div className="flex-1 flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-4 py-2.5">
                      <input
                        type="text"
                        placeholder={locale === "ar" ? "اكتب رسالة..." : "Type a message..."}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        className="bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none flex-1"
                      />
                    </div>
                    <Button
                      onClick={() => handleSend()}
                      disabled={uploading}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shrink-0 p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </m.div>

      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{locale === "ar" ? "محادثة جديدة" : "New Conversation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {instructorsList.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-4">
                {locale === "ar" ? "لا يوجد مدربين للتواصل معهم" : "No instructors to message"}
              </p>
            ) : (
              instructorsList.map((inst: any) => {
                const hasExisting = !!findExistingConversation(inst.id)
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleCreateConversation(inst.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F1F5F9] transition-colors text-start"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-[#E2E8F0] shrink-0">
                      {inst.avatar ? (
                        <img src={resolveImageUrl(inst.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#94A3B8] font-bold">
                          {safeStr(inst.name)[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[#0F172A] block truncate">{safeStr(inst.name)}</span>
                      {hasExisting && (
                        <span className="text-[10px] text-[#94A3B8]">
                          {locale === "ar" ? "محادثة موجودة — اضغط للفتح" : "Existing chat — tap to open"}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
