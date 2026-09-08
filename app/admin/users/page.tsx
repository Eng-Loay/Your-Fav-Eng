"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Users,
  GraduationCap,
  Heart,
  Shield,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  LogIn,
  Ban,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
  FileDown,
  Bell,
  CheckSquare,
  Square,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { safeStr, resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

export default function UsersPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [openAction, setOpenAction] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [addName, setAddName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addRole, setAddRole] = useState("student")
  const [addCountry, setAddCountry] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const actionRef = useRef<HTMLDivElement | null>(null)

  const paramsRef = useRef({ search, roleFilter, statusFilter, page })
  paramsRef.current = { search, roleFilter, statusFilter, page }
  const { data: usersRes, loading, refetch } = useApi(() => api.getAdminUsers({ search: paramsRef.current.search || undefined, role: paramsRef.current.roleFilter !== "all" ? paramsRef.current.roleFilter : undefined, status: paramsRef.current.statusFilter !== "all" ? paramsRef.current.statusFilter : undefined, page: paramsRef.current.page }))
  const { data: statsRes } = useApi(() => api.getAdminUsersStats())
  useEffect(() => { refetch() }, [search, roleFilter, statusFilter, page])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openAction && actionRef.current && !actionRef.current.contains(e.target as Node)) setOpenAction(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openAction])

  const mockUsers = (() => {
    const arr = usersRes as any[] | undefined
    const paginated = usersRes as { data?: any[]; pagination?: { total?: number; pages?: number } } | undefined
    const list = Array.isArray(arr) ? arr : (Array.isArray(paginated?.data) ? paginated.data : null)
    if (!list || list.length === 0) return []
    return list.map((u: any) => ({
      id: u.id,
      name: safeStr(u.name) || "",
      email: u.email ?? "",
      avatar: u.avatar ?? "/user-avatar.png",
      role: ((u.role ?? "student") as string).toLowerCase(),
      status: ((u.status ?? "active") as string).toLowerCase(),
      country: u.country ?? "",
      phone: u.phone ?? "",
    }))
  })()

  const totalPages = (() => {
    const paginated = usersRes as { pagination?: { pages?: number } } | undefined
    return paginated?.pagination?.pages ?? 3
  })()

  const statsData = statsRes as { student?: number; teacher?: number; parent?: number; admin?: number; all?: number } | undefined
  const roleCounts = {
    all: statsData?.all ?? mockUsers.length,
    student: statsData?.student ?? mockUsers.filter(u => (u.role || "").toLowerCase() === "student").length,
    teacher: statsData?.teacher ?? mockUsers.filter(u => (u.role || "").toLowerCase() === "teacher").length,
    parent: statsData?.parent ?? mockUsers.filter(u => (u.role || "").toLowerCase() === "parent").length,
    admin: statsData?.admin ?? mockUsers.filter(u => (u.role || "").toLowerCase() === "admin").length,
  }

  const filtered = mockUsers

  const roleColors: Record<string, string> = {
    student: "bg-primary/10 text-primary",
    teacher: "bg-cyan-100 text-cyan-700",
    parent: "bg-pink-100 text-pink-700",
    admin: "bg-orange-100 text-orange-700",
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  }

  const roleStats = [
    { role: isAr ? "الطلاب" : "Students", count: roleCounts.student, icon: GraduationCap, color: "bg-primary/10 text-primary", filterRole: "student" },
    { role: isAr ? "المعلمون" : "Teachers", count: roleCounts.teacher, icon: Users, color: "bg-primary/10 text-primary", filterRole: "teacher" },
    { role: isAr ? "أولياء الأمور" : "Parents", count: roleCounts.parent, icon: Heart, color: "bg-[#EC4899]/10 text-[#EC4899]", filterRole: "parent" },
    { role: isAr ? "المسؤولون" : "Admins", count: roleCounts.admin, icon: Shield, color: "bg-[#F59E0B]/10 text-[#F59E0B]", filterRole: "admin" },
  ]

  const validateAdd = () => {
    const errors: Record<string, string> = {}
    if (!addName.trim()) errors.name = isAr ? "الاسم مطلوب" : "Name is required"
    if (!addEmail.trim()) errors.email = isAr ? "البريد مطلوب" : "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail)) errors.email = isAr ? "بريد غير صحيح" : "Invalid email"
    if (!addPassword.trim()) errors.password = isAr ? "كلمة المرور مطلوبة" : "Password is required"
    else if (addPassword.length < 6) errors.password = isAr ? "6 أحرف على الأقل" : "At least 6 characters"
    setAddErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddUser = async () => {
    if (!validateAdd()) return
    setSaving(true)
    try {
      const res = await api.createAdminUser({ name: addName, email: addEmail, password: addPassword, role: addRole, country: addCountry })
      if (res.success) {
        setShowAddModal(false)
        setAddName(""); setAddEmail(""); setAddPassword(""); setAddCountry(""); setAddErrors({})
        showToast(isAr ? "تم إضافة المستخدم بنجاح" : "User added successfully")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في إضافة المستخدم" : "Failed to add user"), "error")
      }
    } catch { showToast(isAr ? "حدث خطأ" : "An error occurred", "error") }
    finally { setSaving(false) }
  }

  const handleEditUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await api.updateAdminUser(editUser.id, { name: editUser.name, email: editUser.email, role: editUser.role, country: editUser.country })
      if (res.success) {
        setShowEditModal(false); setEditUser(null)
        showToast(isAr ? "تم تحديث المستخدم بنجاح" : "User updated successfully")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في التحديث" : "Failed to update"), "error")
      }
    } catch { showToast(isAr ? "حدث خطأ" : "An error occurred", "error") }
    finally { setSaving(false) }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await api.deleteAdminUser(id)
      if (res.success) {
        showToast(isAr ? "تم حذف المستخدم" : "User deleted")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في الحذف" : "Failed to delete"), "error")
      }
    } catch { showToast(isAr ? "حدث خطأ" : "An error occurred", "error") }
    finally { setConfirmDelete(null) }
  }

  const handleResetPassword = async (id: string, newPassword?: string) => {
    const pwd = newPassword || prompt(isAr ? "أدخل كلمة المرور الجديدة:" : "Enter new password:")
    if (!pwd || pwd.length < 8) {
      showToast(isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters", "error")
      return
    }
    const res = await api.resetUserPassword(id, pwd)
    setOpenAction(null)
    if (res.success) showToast(isAr ? "تم إعادة تعيين كلمة المرور" : "Password reset successfully")
    else showToast(res.message || (isAr ? "فشل في إعادة التعيين" : "Failed to reset"), "error")
  }

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "active" ? "inactive" : "active"
    const res = await api.updateUserStatus(user.id, newStatus)
    setOpenAction(null)
    if (res.success) {
      showToast(isAr ? "تم تحديث الحالة" : "Status updated")
      refetch()
    } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
  }

  const handleImpersonate = async (id: string) => {
    const res = await api.impersonateUser(id)
    setOpenAction(null)
    if (res.success && res.data) {
      localStorage.setItem("lms_token", res.data.accessToken)
      localStorage.setItem("lms_refresh_token", res.data.refreshToken)
      showToast(isAr ? "تم تسجيل الدخول كمستخدم" : "Logged in as user", "info")
      window.location.href = "/"
    } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((u) => u.id)))
  }

  const handleBulkNotify = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast(isAr ? "أدخل العنوان والرسالة" : "Enter title and message", "error")
      return
    }
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await api.sendAdminNotification({
        target: "specific",
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        userIds: Array.from(selectedIds),
      })
      if (res.success && (res as any).data?.sent) {
        showToast(isAr ? `تم إرسال الإشعار إلى ${(res as any).data.sent} مستخدم` : `Notification sent to ${(res as any).data.sent} users`)
        setShowNotifModal(false)
        setNotifTitle("")
        setNotifMessage("")
        setSelectedIds(new Set())
      } else {
        showToast(res.message || (isAr ? "فشل في الإرسال" : "Failed to send"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setBulkLoading(false)
    }
  }

  const handleExportExcel = () => {
    const ids = Array.from(selectedIds)
    const toExport = ids.length ? filtered.filter((u) => ids.includes(u.id)) : filtered
    const headers = ["Name", "Email", "Role", "Status", "Country"]
    const rows = toExport.map((u) => [u.name, u.email, u.role, u.status, u.country || ""])
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(isAr ? `تم تصدير ${toExport.length} مستخدم` : `Exported ${toExport.length} users`)
    if (ids.length) setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkLoading(true)
    try {
      let ok = 0
      for (const id of ids) {
        const res = await api.deleteAdminUser(id)
        if (res.success) ok++
      }
      showToast(isAr ? `تم حذف ${ok} مستخدم` : `${ok} users deleted`)
      setConfirmBulkDelete(false)
      setSelectedIds(new Set())
      refetch()
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة المستخدمين" : "Users Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إدارة جميع مستخدمي المنصة" : "Manage all platform users"}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} disabled={filtered.length === 0} variant="outline" className="gap-2 rounded-xl border-[#E2E8F0]/60">
            <FileDown className="w-4 h-4" /> {isAr ? "تصدير Excel" : "Export Excel"}
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
            <Plus className="w-4 h-4" /> {isAr ? "إضافة مستخدم" : "Add User"}
          </Button>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {roleStats.map((s, i) => (
          <m.div
            key={i}
            variants={fadeUp}
            onClick={() => setRoleFilter(roleFilter === s.filterRole ? "all" : s.filterRole)}
            className={`bg-white rounded-2xl p-4 border border-[#E2E8F0]/60 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${roleFilter === s.filterRole ? "ring-2 ring-primary/50" : ""}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-[#0F172A]">{s.count}</p>
            <p className="text-xs text-[#94A3B8]">{s.role}</p>
          </m.div>
        ))}
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."} className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]" />
          </div>
          <div className="flex gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none">
              <option value="all">{isAr ? "كل الأدوار" : "All Roles"}</option>
              <option value="student">{isAr ? "طالب" : "Student"}</option>
              <option value="teacher">{isAr ? "معلم" : "Teacher"}</option>
              <option value="parent">{isAr ? "ولي أمر" : "Parent"}</option>
              <option value="admin">{isAr ? "مسؤول" : "Admin"}</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none">
              <option value="all">{isAr ? "كل الحالات" : "All Status"}</option>
              <option value="active">{isAr ? "نشط" : "Active"}</option>
              <option value="inactive">{isAr ? "غير نشط" : "Inactive"}</option>
              <option value="PENDING_REVIEW">{isAr ? "معلق" : "Pending"}</option>
            </select>
          </div>
        </div>

        {(selectedIds.size > 0) && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-3 bg-primary/5 border-b border-primary/20 flex flex-wrap items-center gap-3"
          >
            <span className="text-sm font-semibold text-primary">
              {isAr ? `${selectedIds.size} محدد` : `${selectedIds.size} selected`}
            </span>
            <button
              onClick={() => setShowNotifModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {isAr ? "إرسال إشعار" : "Send Notification"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {isAr ? "تصدير Excel" : "Export Excel"}
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isAr ? "حذف" : "Delete"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ms-auto text-sm text-[#64748B] hover:text-[#0F172A]"
            >
              {isAr ? "إلغاء التحديد" : "Clear selection"}
            </button>
          </m.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mb-3" />
            <p className="text-sm font-semibold text-[#94A3B8]">{isAr ? "لا يوجد مستخدمون" : "No users found"}</p>
            <p className="text-xs text-[#C0C9D4] mt-1">{isAr ? "جرب تغيير معايير البحث" : "Try adjusting your search criteria"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-3 py-3 w-10">
                    <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-[#F1F5F9]">
                      {selectedIds.size === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-[#94A3B8]" />
                      )}
                    </button>
                  </th>
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "المستخدم" : "User"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "البريد" : "Email"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الدور" : "Role"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className={`border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors ${selectedIds.has(user.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelect(user.id)} className="p-1 rounded hover:bg-[#F1F5F9]">
                        {selectedIds.has(user.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-[#94A3B8]" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 block">
                        <div className="relative h-9 w-9 overflow-hidden rounded-lg shrink-0">
                          <Image src={resolveImageUrl(user.avatar, "/user-avatar.png")} alt={safeStr(user.name)} fill className="object-cover" sizes="36px" />
                        </div>
                        <span className="text-sm font-medium text-[#0F172A]">{safeStr(user.name)}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#64748B]">{user.email}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${roleColors[user.role] || "bg-gray-100 text-gray-700"}`}>{user.role}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusColors[user.status] || "bg-gray-100 text-gray-700"}`}>{user.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="relative" ref={openAction === user.id ? actionRef : undefined}>
                        <button onClick={() => setOpenAction(openAction === user.id ? null : user.id)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
                        </button>
                        {openAction === user.id && (
                          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute end-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E2E8F0]/60 py-1 z-20">
                            <button onClick={() => { setEditUser({ ...user }); setShowEditModal(true); setOpenAction(null) }} className="flex items-center gap-2 px-3 py-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] w-full">
                              <Edit className="w-3.5 h-3.5" /> {isAr ? "تعديل" : "Edit"}
                            </button>
                            <button onClick={() => handleResetPassword(user.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] w-full">
                              <Key className="w-3.5 h-3.5" /> {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                            </button>
                            <button onClick={() => handleImpersonate(user.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] w-full">
                              <LogIn className="w-3.5 h-3.5" /> {isAr ? "تسجيل دخول كمستخدم" : "Login as User"}
                            </button>
                            <button onClick={() => handleToggleStatus(user)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] w-full">
                              <Ban className="w-3.5 h-3.5" /> {user.status === "active" ? (isAr ? "تعطيل" : "Disable") : (isAr ? "تفعيل" : "Enable")}
                            </button>
                            <button onClick={() => { setConfirmDelete(user.id); setOpenAction(null) }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full">
                              <Trash2 className="w-3.5 h-3.5" /> {isAr ? "حذف" : "Delete"}
                            </button>
                          </m.div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-[#E2E8F0]/60 flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">
            {isAr ? `عرض ${filtered.length} مستخدم — صفحة ${page}` : `Showing ${filtered.length} users — Page ${page}`}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 hover:bg-[#F1F5F9] transition-colors disabled:opacity-40">
              <ChevronLeft className="w-4 h-4 text-[#64748B]" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? "bg-primary text-white" : "border border-[#E2E8F0]/60 text-[#64748B] hover:bg-[#F1F5F9]"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 hover:bg-[#F1F5F9] transition-colors disabled:opacity-40">
              <ChevronRight className="w-4 h-4 text-[#64748B]" />
            </button>
          </div>
        </div>
      </m.div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "إضافة مستخدم جديد" : "Add New User"}</h3>
              <button onClick={() => { setShowAddModal(false); setAddErrors({}) }} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الاسم الكامل" : "Full Name"} *</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${addErrors.name ? "border-red-400" : "border-[#E2E8F0]/60 focus:border-primary"}`} />
                {addErrors.name && <p className="text-xs text-red-500 mt-1">{addErrors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "البريد الإلكتروني" : "Email"} *</label>
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${addErrors.email ? "border-red-400" : "border-[#E2E8F0]/60 focus:border-primary"}`} />
                {addErrors.email && <p className="text-xs text-red-500 mt-1">{addErrors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "كلمة المرور" : "Password"} *</label>
                <input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${addErrors.password ? "border-red-400" : "border-[#E2E8F0]/60 focus:border-primary"}`} />
                {addErrors.password && <p className="text-xs text-red-500 mt-1">{addErrors.password}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدور" : "Role"}</label>
                <select value={addRole} onChange={(e) => setAddRole(e.target.value)} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  <option value="student">{isAr ? "طالب" : "Student"}</option>
                  <option value="teacher">{isAr ? "معلم" : "Teacher"}</option>
                  <option value="parent">{isAr ? "ولي أمر" : "Parent"}</option>
                  <option value="admin">{isAr ? "مسؤول" : "Admin"}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدولة" : "Country"}</label>
                <input value={addCountry} onChange={(e) => setAddCountry(e.target.value)} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowAddModal(false); setAddErrors({}) }} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleAddUser} disabled={saving} className="rounded-xl bg-primary hover:bg-primary-hover text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إضافة" : "Add User")}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "تعديل المستخدم" : "Edit User"}</h3>
              <button onClick={() => { setShowEditModal(false); setEditUser(null) }} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الاسم الكامل" : "Full Name"}</label>
                <input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "البريد الإلكتروني" : "Email"}</label>
                <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدور" : "Role"}</label>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  <option value="student">{isAr ? "طالب" : "Student"}</option>
                  <option value="teacher">{isAr ? "معلم" : "Teacher"}</option>
                  <option value="parent">{isAr ? "ولي أمر" : "Parent"}</option>
                  <option value="admin">{isAr ? "مسؤول" : "Admin"}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الدولة" : "Country"}</label>
                <input value={editUser.country} onChange={(e) => setEditUser({ ...editUser, country: e.target.value })} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditUser(null) }} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleEditUser} disabled={saving} className="rounded-xl bg-primary hover:bg-primary-hover text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ" : "Save")}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-sm text-[#64748B] mb-6">{isAr ? "هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع." : "Are you sure you want to delete this user? This cannot be undone."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => handleDeleteUser(confirmDelete)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">{isAr ? "حذف" : "Delete"}</Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Bulk Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                {isAr ? "إرسال إشعار للمحددين" : "Send Notification to Selected"}
              </h3>
              <button onClick={() => { setShowNotifModal(false); setNotifTitle(""); setNotifMessage("") }} className="p-2 rounded-lg hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[#64748B]">{isAr ? `${selectedIds.size} مستخدم محدد` : `${selectedIds.size} users selected`}</p>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "العنوان" : "Title"} *</label>
                <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder={isAr ? "عنوان الإشعار" : "Notification title"} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الرسالة" : "Message"} *</label>
                <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} placeholder={isAr ? "نص الإشعار" : "Notification message"} className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowNotifModal(false); setNotifTitle(""); setNotifMessage("") }} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleBulkNotify} disabled={bulkLoading || !notifTitle.trim() || !notifMessage.trim()} className="rounded-xl bg-primary hover:bg-primary-hover text-white gap-2">
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {isAr ? "إرسال" : "Send"}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "حذف المستخدمين المحددين" : "Delete Selected Users"}</h3>
            <p className="text-sm text-[#64748B] mb-6">{isAr ? `هل أنت متأكد من حذف ${selectedIds.size} مستخدم؟ لا يمكن التراجع.` : `Are you sure you want to delete ${selectedIds.size} users? This cannot be undone.`}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmBulkDelete(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleBulkDelete} disabled={bulkLoading} className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2">
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isAr ? "حذف الكل" : "Delete All"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
