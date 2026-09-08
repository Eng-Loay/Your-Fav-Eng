"use client"

import { useState, useEffect, useRef } from "react"
import { m } from "framer-motion"
import Image from "next/image"
import { useApi, api } from "@/hooks/use-api"
import {
  Send,
  ArrowLeft,
  ArrowRight,
  Paperclip,
  Mic,
  Square,
  Users,
  MessageSquare,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

export default function StudentCommunitiesPage() {
  const { locale, dir } = useI18n()
  const { user, showToast } = useStore()
  const isRTL = dir === "rtl"
  const [messageInput, setMessageInput] = useState("")
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: communitiesRes } = useApi(() => api.getCommunities())
  const communities = (communitiesRes as { data?: any[] })?.data ?? []

  const [selectedCommunity, setSelectedCommunity] = useState<any>(null)
  const [messagesFromApi, setMessagesFromApi] = useState<any[] | null>(null)

  useEffect(() => {
    if (communities.length && !selectedCommunity) {
      setSelectedCommunity(communities[0])
    }
  }, [communities])

  useEffect(() => {
    if (!selectedCommunity?.id) return
    setMessagesFromApi(null)
    api.getMessages(selectedCommunity.id).then((res) => {
      if (res.success && res.data) {
        const msgs = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? []
        setMessagesFromApi(msgs)
      }
    })
  }, [selectedCommunity?.id])

  const messagesDisplay = (messagesFromApi ?? []).map((m: any, i: number) => ({
    id: m.id ?? i + 1,
    sender: m.senderId === user?.id ? ("me" as const) : ("them" as const),
    senderName: m.sender?.name ?? "",
    textEn: m.content ?? "",
    textAr: m.content ?? "",
    time: m.createdAt ?? "",
    attachmentUrl: m.attachmentUrl,
    attachmentType: m.attachmentType,
  }))

  const handleSend = async (content?: string, attachmentUrl?: string, attachmentType?: "image" | "audio") => {
    if (!selectedCommunity?.id) return
    const text = content ?? messageInput.trim()
    if (!text && !attachmentUrl) return
    setMessageInput("")
    try {
      const res = await api.sendMessage(selectedCommunity.id, text, attachmentUrl, attachmentType)
      if (res.success) {
        const refreshed = await api.getMessages(selectedCommunity.id)
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

  return (
    <div dir={dir} className="space-y-6">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          {locale === "ar" ? "الكوميونتي" : "Communities"}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {locale === "ar" ? "مجموعات الدردشة مع زملائك" : "Group chats with your peers"}
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
          <div className="w-full md:w-[340px] border-e border-[#E2E8F0]/60 flex flex-col">
            <div className="p-4 border-b border-[#E2E8F0]/60">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="w-4 h-4" />
                {locale === "ar" ? "المجموعات" : "Groups"}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {communities.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommunity(c)}
                  className={`w-full flex items-center gap-3 p-4 text-start transition-colors ${
                    selectedCommunity?.id === c.id ? "bg-[#8B5CF6]/5 border-e-2 border-[#8B5CF6]" : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="h-11 w-11 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] truncate">{c.title || "Group"}</p>
                    <p className="text-xs text-[#94A3B8]">{c.members?.length ?? 0} {locale === "ar" ? "أعضاء" : "members"}</p>
                  </div>
                </button>
              ))}
              {communities.length === 0 && (
                <div className="p-8 text-center text-[#94A3B8] text-sm">
                  {locale === "ar" ? "لا توجد مجموعات" : "No communities yet"}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {!selectedCommunity ? (
              <div className="flex-1 flex items-center justify-center text-[#94A3B8] p-8">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">{locale === "ar" ? "اختر مجموعة" : "Select a community"}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]/60">
                  <div className="h-10 w-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{selectedCommunity.title || "Group"}</p>
                    <p className="text-xs text-[#94A3B8]">{selectedCommunity.members?.length ?? 0} {locale === "ar" ? "أعضاء" : "members"}</p>
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
                        {msg.sender !== "me" && (
                          <p className="text-xs font-semibold text-[#8B5CF6] mb-1">{msg.senderName}</p>
                        )}
                        {msg.attachmentType === "image" && msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                            <img src={msg.attachmentUrl} alt="" className="max-w-full rounded-lg max-h-48 object-cover" />
                          </a>
                        )}
                        {msg.attachmentType === "audio" && msg.attachmentUrl && (
                          <audio controls className="mb-2 max-w-full" src={msg.attachmentUrl} />
                        )}
                        <p className="text-sm leading-relaxed">{locale === "ar" ? msg.textAr : msg.textEn}</p>
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
    </div>
  )
}
