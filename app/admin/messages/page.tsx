"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { m } from "framer-motion"
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Users,
  GraduationCap,
  Presentation,
  TicketCheck,
  Loader2,
  Megaphone,
  UserCircle,
  UserPlus,
  Plus,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { resolveImageUrl, safeStr } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

function formatConvTime(d: string | Date | undefined, isAr?: boolean): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return isAr ? "الآن" : "Now"
  if (diff < 3600000) return isAr ? `${Math.floor(diff / 60000)} د` : `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return isAr ? `${Math.floor(diff / 3600000)} س` : `${Math.floor(diff / 3600000)}h`
  return date.toLocaleDateString()
}

interface Conversation {
  id: string
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageAr?: string
  time?: string
  unread?: number
  role?: string
  participantType?: string
  children?: string[]
  online?: boolean
}

interface Message {
  id: string
  sender: string
  content: string
  contentAr?: string
  time: string
  isAdmin: boolean
  senderId?: string
}

export default function MessagesPage() {
  const { locale } = useI18n()
  const { showToast, user } = useStore()
  const isAr = locale === "ar"
  const [selectedConv, setSelectedConv] = useState("")
  const [messageText, setMessageText] = useState("")
  const [searchConv, setSearchConv] = useState("")
  const [sendTo, setSendTo] = useState("individual")
  const [sending, setSending] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [showNewConvModal, setShowNewConvModal] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [groupStudentSearch, setGroupStudentSearch] = useState("")
  const [groupName, setGroupName] = useState("")
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<string[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [creatingConv, setCreatingConv] = useState(false)

  const { data: conversationsRaw, loading: loadingConvs, refetch: refetchConvs } = useApi(
    () => api.getAdminConversations(),
    { immediate: true }
  )

  const conversations: Conversation[] = (() => {
    const arr = Array.isArray(conversationsRaw) ? conversationsRaw : (conversationsRaw as { data?: any[] })?.data ?? []
    return arr.map((c: any) => {
      const p = c.primaryParticipant
      const lastMsg = c.messages?.[0]
      const name = p?.name ?? c.title ?? (isAr ? "محادثة" : "Conversation")
      return {
        id: c.id,
        name,
        avatar: p?.avatar,
        lastMessage: lastMsg?.content,
        lastMessageAr: lastMsg?.content,
        time: formatConvTime(c.updatedAt ?? lastMsg?.createdAt, isAr),
        unread: 0,
        role: p?.participantType ?? p?.role ?? "student",
        participantType: p?.participantType ?? p?.role,
        children: p?.children ?? [],
      }
    })
  })()

  const { data: messagesRaw, loading: loadingMessages, refetch: refetchMessages } = useApi(
    () => (selectedConv ? api.getAdminMessages(selectedConv) : Promise.resolve({ success: true, data: [] })),
    { immediate: false, deps: [selectedConv] }
  )

  const wsRef = useRef<WebSocket | null>(null)

  const userSearchRef = React.useRef(userSearch)
  userSearchRef.current = userSearch
  const groupStudentSearchRef = React.useRef(groupStudentSearch)
  groupStudentSearchRef.current = groupStudentSearch

  const { data: usersForConv, loading: loadingUsers, refetch: refetchUsers } = useApi(
    () => api.getAdminUsers({ search: userSearchRef.current || undefined, limit: 100 }),
    { immediate: false }
  )

  const { data: studentsForGroup, loading: loadingStudents, refetch: refetchStudents } = useApi(
    () => api.getAdminStudents({ search: groupStudentSearchRef.current || undefined, limit: 200 }),
    { immediate: false }
  )

  useEffect(() => {
    if (showNewConvModal) refetchUsers()
  }, [showNewConvModal, userSearch, refetchUsers])

  useEffect(() => {
    if (sendTo === "group") refetchStudents()
  }, [sendTo, groupStudentSearch, refetchStudents])

  useEffect(() => {
    if (selectedConv) refetchMessages()
  }, [selectedConv, refetchMessages])

  useEffect(() => {
    if (conversations.length > 0 && !selectedConv && sendTo === "individual") {
      setSelectedConv(conversations[0].id)
    }
  }, [conversations, selectedConv, sendTo])

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
          if (data.conversationId && data.conversationId === selectedConv) {
            refetchMessages()
          }
        }
      } catch {
        // ignore malformed events
      }
    }

    ws.onerror = () => {
      // errors are non-fatal; HTTP polling is disabled, but REST fetch still works
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [refetchConvs, refetchMessages, selectedConv])

  const messages: Message[] = (() => {
    const arr = Array.isArray(messagesRaw) ? messagesRaw : (messagesRaw as { data?: any[] })?.data ?? []
    return arr.map((m: any) => ({
      id: m.id,
      sender: m.sender?.name ?? "",
      content: m.content ?? "",
      contentAr: m.content,
      time: m.createdAt ? formatConvTime(m.createdAt, isAr) : "",
      isAdmin: m.senderId === user?.id,
      senderId: m.senderId,
    }))
  })()

  const filteredConvs = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchConv.toLowerCase())
  )

  const usersList: any[] = (() => {
    const raw = usersForConv
    const arr = Array.isArray(raw) ? raw : (raw as { data?: any[] })?.data ?? []
    return user?.id ? arr.filter((u: any) => u.id !== user.id) : arr
  })()

  const studentsList: any[] = (() => {
    const raw = studentsForGroup
    const arr = Array.isArray(raw) ? raw : (raw as { data?: any[] })?.data ?? []
    return arr
  })()

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConv) return
    setSending(true)
    try {
      await api.sendMessage(selectedConv, messageText)
      setMessageText("")
      showToast(isAr ? "تم إرسال الرسالة" : "Message sent")
      refetchMessages()
    } catch (err) {
      showToast(isAr ? "فشل في إرسال الرسالة" : "Failed to send message", "error")
    } finally {
      setSending(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return
    setBroadcastSending(true)
    try {
      await api.sendMessage("broadcast", broadcastMessage, { target: sendTo, title: broadcastTitle })
      setBroadcastTitle("")
      setBroadcastMessage("")
      showToast(
        isAr
          ? `تم إرسال الرسالة الجماعية إلى ${sendTo === "students" ? "الطلاب" : sendTo === "teachers" ? "المعلمين" : "الجميع"}`
          : `Broadcast sent to ${sendTo}`,
      )
    } catch (err) {
      showToast(isAr ? "فشل في إرسال الرسالة الجماعية" : "Failed to send broadcast", "error")
    } finally {
      setBroadcastSending(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    setCreatingConv(true)
    try {
      const res = await api.createConversation(userId)
      if (res?.success && (res as any).data?.id) {
        setShowNewConvModal(false)
        setUserSearch("")
        await refetchConvs()
        setSelectedConv((res as any).data.id)
        setSendTo("individual")
        showToast(isAr ? "تم بدء المحادثة" : "Conversation started")
      } else {
        showToast(isAr ? "فشل في بدء المحادثة" : "Failed to start conversation", "error")
      }
    } catch (err) {
      showToast(isAr ? "فشل في بدء المحادثة" : "Failed to start conversation", "error")
    } finally {
      setCreatingConv(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupStudents.length === 0) {
      showToast(isAr ? "أدخل اسم المجموعة واختر طلاباً" : "Enter group name and select students", "error")
      return
    }
    setCreatingGroup(true)
    try {
      const res = await api.createCommunity(groupName.trim(), selectedGroupStudents)
      if (res?.success && (res as any).data?.id) {
        setShowCreateGroupModal(false)
        setGroupName("")
        setSelectedGroupStudents([])
        setGroupStudentSearch("")
        await refetchConvs()
        setSelectedConv((res as any).data.id)
        setSendTo("individual")
        showToast(isAr ? "تم إنشاء المجموعة" : "Group created")
      } else {
        showToast(isAr ? "فشل في إنشاء المجموعة" : "Failed to create group", "error")
      }
    } catch (err) {
      showToast(isAr ? "فشل في إنشاء المجموعة" : "Failed to create group", "error")
    } finally {
      setCreatingGroup(false)
    }
  }

  const toggleGroupStudent = (id: string) => {
    setSelectedGroupStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const isBroadcast = sendTo === "students" || sendTo === "teachers" || sendTo === "everyone"
  const isCreateGroup = sendTo === "group"

  if (loadingConvs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleIcons: Record<string, React.ReactNode> = {
    student: <GraduationCap className="w-3 h-3" />,
    STUDENT: <GraduationCap className="w-3 h-3" />,
    instructor: <Presentation className="w-3 h-3" />,
    INSTRUCTOR: <Presentation className="w-3 h-3" />,
    TEACHER: <Presentation className="w-3 h-3" />,
    parent: <UserCircle className="w-3 h-3" />,
    PARENT: <UserCircle className="w-3 h-3" />,
    ticket: <TicketCheck className="w-3 h-3" />,
  }

  const roleLabels: Record<string, { en: string; ar: string }> = {
    STUDENT: { en: "Student", ar: "طالب" },
    PARENT: { en: "Parent", ar: "ولي أمر" },
    INSTRUCTOR: { en: "Instructor", ar: "مدرب" },
    TEACHER: { en: "Teacher", ar: "معلم" },
  }

  const broadcastLabels: Record<string, { en: string; ar: string }> = {
    students: { en: "All Students", ar: "جميع الطلاب" },
    teachers: { en: "All Teachers", ar: "جميع المعلمين" },
    everyone: { en: "Everyone", ar: "الجميع" },
  }

  return (
    <m.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "الرسائل" : "Messages"}</h1>
        <p className="text-sm text-[#64748B] mt-1">{isAr ? "التواصل مع المستخدمين وإدارة تذاكر الدعم" : "Communicate with users and manage support tickets"}</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 w-fit">
          {[
            { key: "individual", label: isAr ? "فردي" : "Individual" },
            { key: "group", label: isAr ? "إنشاء مجموعة" : "Create Group" },
            { key: "students", label: isAr ? "الطلاب" : "Students" },
            { key: "teachers", label: isAr ? "المعلمين" : "Teachers" },
            { key: "everyone", label: isAr ? "الجميع" : "Everyone" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setSendTo(tab.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sendTo === tab.key ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {sendTo === "individual" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewConvModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isAr ? "محادثة مع مستخدم" : "Message User"}
            </button>
            <button
              onClick={() => setSendTo("group")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? "إنشاء مجموعة" : "Create Group"}
            </button>
          </div>
        )}
      </div>

      {isCreateGroup ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#0F172A]">{isAr ? "إنشاء مجموعة جديدة" : "Create New Group"}</p>
              <p className="text-xs text-[#94A3B8]">{isAr ? "اختر الطلاب وأضفهم للمجموعة" : "Select students and add them to the group"}</p>
            </div>
          </div>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "اسم المجموعة" : "Group Name"}</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={isAr ? "مثال: مجموعة الميكانيكا" : "e.g. Mechanics Group"}
                className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8B5CF6] text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "اختر الطلاب" : "Select Students"}</label>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={groupStudentSearch}
                    onChange={(e) => setGroupStudentSearch(e.target.value)}
                    placeholder={isAr ? "بحث عن طالب..." : "Search students..."}
                    className="w-full border border-[#E2E8F0]/60 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#8B5CF6] text-[#0F172A] placeholder:text-[#94A3B8]"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border border-[#E2E8F0]/60 rounded-xl p-2 space-y-1">
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : studentsList.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] p-4 text-center">{isAr ? "لا يوجد طلاب" : "No students found"}</p>
                ) : (
                  studentsList.map((s: any) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupStudents.includes(s.id)}
                        onChange={() => toggleGroupStudent(s.id)}
                        className="rounded"
                      />
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-[#E2E8F0] shrink-0 flex items-center justify-center">
                        {s.avatar ? (
                          <Image src={resolveImageUrl(s.avatar, "/user-avatar.png")} alt="" width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-[#94A3B8] font-bold text-sm">{safeStr(s.name)[0] || "?"}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#0F172A]">{safeStr(s.name)}</span>
                      {s.email && <span className="text-xs text-[#94A3B8] truncate max-w-[120px]">{s.email}</span>}
                    </label>
                  ))
                )}
              </div>
              {selectedGroupStudents.length > 0 && (
                <p className="text-xs text-[#64748B] mt-1">{isAr ? `${selectedGroupStudents.length} طالب محدد` : `${selectedGroupStudents.length} student(s) selected`}</p>
              )}
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !groupName.trim() || selectedGroupStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-sm font-semibold hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
            >
              {creatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {isAr ? "إنشاء المجموعة" : "Create Group"}
            </button>
          </div>
        </m.div>
      ) : isBroadcast ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm"
        >
          <div className="p-4 border-b border-[#E2E8F0]/60 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                {isAr ? `رسالة جماعية - ${broadcastLabels[sendTo]?.ar}` : `Broadcast - ${broadcastLabels[sendTo]?.en}`}
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                {isAr ? "سيتم إرسال الرسالة إلى جميع المستخدمين المحددين" : "Message will be sent to all selected users"}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "العنوان (اختياري)" : "Subject (optional)"}</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder={isAr ? "عنوان الرسالة..." : "Message subject..."}
                className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الرسالة" : "Message"}</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
                placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
                className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleBroadcast}
                disabled={broadcastSending || !broadcastMessage.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {broadcastSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAr ? "إرسال الرسالة الجماعية" : "Send Broadcast"}
              </button>
            </div>
          </div>
        </m.div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
          <div className="flex h-full">
            <div className="w-[300px] border-e border-[#E2E8F0]/60 flex flex-col shrink-0 hidden sm:flex">
              <div className="p-3 border-b border-[#E2E8F0]/60">
                <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchConv}
                    onChange={(e) => setSearchConv(e.target.value)}
                    placeholder={isAr ? "بحث..." : "Search..."}
                    className="bg-transparent text-xs outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] mb-0.5">{isAr ? "لا توجد محادثات" : "No conversations"}</p>
                    <p className="text-[10px] text-[#94A3B8] text-center">{isAr ? "لا توجد محادثات تطابق بحثك" : "No conversations match your search"}</p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv.id)}
                      className={`w-full flex items-center gap-3 p-3 transition-colors text-start ${
                        selectedConv === conv.id ? "bg-primary/5 border-e-2 border-primary" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image src={resolveImageUrl(conv.avatar, "/user-avatar.png")} alt={conv.name} fill className="object-cover" />
                        </div>
                        {conv.online && <div className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-[#0F172A] truncate">{conv.name}</span>
                          <span className="text-[10px] text-[#94A3B8] shrink-0">{conv.time || ""}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="text-[#94A3B8] shrink-0" title={isAr ? roleLabels[conv.participantType || conv.role || ""]?.ar : roleLabels[conv.participantType || conv.role || ""]?.en}>
                            {roleIcons[conv.participantType || conv.role || "student"]}
                          </span>
                          {conv.participantType === "PARENT" && conv.children && conv.children.length > 0 && (
                            <span className="text-[10px] text-[#64748B] truncate max-w-[120px]">
                              ({isAr ? "ابن: " : "child: "}{conv.children.join(", ")})
                            </span>
                          )}
                          <p className="text-[11px] text-[#94A3B8] truncate flex-1 min-w-0">{isAr ? (conv.lastMessageAr || conv.lastMessage) : conv.lastMessage}</p>
                        </div>
                      </div>
                      {(conv.unread || 0) > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-[#E2E8F0]/60 flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-full shrink-0">
                  <Image src={resolveImageUrl(conversations.find(c => c.id === selectedConv)?.avatar, "/user-avatar.png")} alt="" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">
                    {conversations.find(c => c.id === selectedConv)?.name || (isAr ? "اختر محادثة" : "Select a conversation")}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#64748B] font-medium">
                      {roleLabels[conversations.find(c => c.id === selectedConv)?.participantType || ""]?.[isAr ? "ar" : "en"] ?? ""}
                    </span>
                    {conversations.find(c => c.id === selectedConv)?.participantType === "PARENT" &&
                      (conversations.find(c => c.id === selectedConv)?.children?.length ?? 0) > 0 && (
                      <span className="text-[10px] text-primary">
                        {isAr ? "ابن: " : "child: "}{conversations.find(c => c.id === selectedConv)?.children?.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-0.5">{isAr ? "لا توجد رسائل" : "No messages yet"}</p>
                    <p className="text-xs text-[#94A3B8]">{isAr ? "ابدأ المحادثة بإرسال رسالة" : "Start the conversation by sending a message"}</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <m.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.isAdmin
                          ? "bg-primary text-white rounded-ee-md"
                          : "bg-[#F1F5F9] text-[#0F172A] rounded-es-md"
                      }`}>
                        <p className="text-sm">{isAr ? (msg.contentAr || msg.content) : msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.isAdmin ? "text-white/60" : "text-[#94A3B8]"}`}>{msg.time}</p>
                      </div>
                    </m.div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-[#E2E8F0]/60">
                <div className="flex items-center gap-2">
                  <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#F1F5F9] text-[#94A3B8] transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    className="flex-1 bg-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
                    onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSendMessage() }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageText.trim()}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showNewConvModal} onOpenChange={setShowNewConvModal}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "محادثة مع مستخدم" : "Start Conversation with User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "بحث عن مستخدم" : "Search user"}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={isAr ? "الاسم أو البريد..." : "Name or email..."}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border border-[#E2E8F0]/60 rounded-xl p-2 space-y-1">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : usersList.length === 0 ? (
                <p className="text-sm text-[#94A3B8] p-4 text-center">{isAr ? "لا يوجد مستخدمين" : "No users found"}</p>
              ) : (
                usersList.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartConversation(u.id)}
                    disabled={creatingConv || u.id === user?.id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] text-start transition-colors disabled:opacity-50"
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-[#E2E8F0] shrink-0 flex items-center justify-center">
                      {u.avatar ? (
                        <Image src={resolveImageUrl(u.avatar, "/user-avatar.png")} alt="" width={36} height={36} className="object-cover" />
                      ) : (
                        <span className="text-[#94A3B8] font-bold text-sm">{safeStr(u.name)[0] || "?"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{safeStr(u.name)}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{u.email ?? ""}</p>
                      {u.role && (
                        <span className="text-[10px] text-[#64748B]">{roleLabels[u.role]?.[isAr ? "ar" : "en"] ?? u.role}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </m.div>
  )
}
