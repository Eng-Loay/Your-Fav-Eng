"use client"

import React, { useState, useEffect } from "react"
import { m } from "framer-motion"
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Users,
  Settings,
  BookOpen,
  FileText,
  Bell,
  BarChart3,
  FolderOpen,
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  Presentation,
  Tag,
  UserPlus,
  Ticket,
  ShoppingBag,
  ClipboardList,
  Library,
  Star,
  Award,
  MessageSquare,
  FileEdit,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface Permission {
  id: string
  name: string
  module: string
  action: string
}

interface Role {
  id: string
  name: string
  nameAr?: string
  users?: number
  color?: string
  description?: string
  descriptionAr?: string
  permissions?: Array<{ permission: Permission }>
}

const PERMISSION_LABELS: Record<string, { en: string; ar: string; icon: React.ElementType }> = {
  admin_dashboard: { en: "Dashboard", ar: "لوحة التحكم", icon: LayoutDashboard },
  admin_users: { en: "Users", ar: "المستخدمون", icon: Users },
  admin_instructors: { en: "Teacher Approvals", ar: "موافقات المدرسين", icon: Presentation },
  admin_courses: { en: "Courses", ar: "الدورات", icon: BookOpen },
  admin_categories: { en: "Categories", ar: "التصنيفات", icon: Tag },
  admin_student_requests: { en: "Student Requests", ar: "طلبات الطلاب", icon: UserPlus },
  admin_coupons: { en: "Coupons", ar: "الكوبونات", icon: Ticket },
  admin_store: { en: "Store", ar: "المتجر الإلكتروني", icon: ShoppingBag },
  admin_store_orders: { en: "Store Orders", ar: "طلبات المتجر", icon: ShoppingBag },
  admin_exams: { en: "Exams", ar: "الاختبارات", icon: FileText },
  admin_question_bank: { en: "Question Bank", ar: "بنك الأسئلة", icon: ClipboardList },
  admin_content_bank: { en: "Content Bank", ar: "بنك المحتوى", icon: Library },
  admin_comprehensive_exams: { en: "Comprehensive Exams", ar: "امتحانات شاملة", icon: FileText },
  admin_reviews: { en: "Reviews", ar: "مراجعة التقييمات", icon: Star },
  admin_certificates: { en: "Certificates", ar: "الشهادات", icon: Award },
  admin_enrollments: { en: "Enrollments", ar: "التسجيلات", icon: UserPlus },
  admin_messages: { en: "Messages", ar: "الرسائل", icon: MessageSquare },
  admin_communities: { en: "Communities", ar: "المجتمعات", icon: UserPlus },
  admin_notifications: { en: "Notifications", ar: "الإشعارات", icon: Bell },
  admin_content: { en: "Content", ar: "المحتوى", icon: FileEdit },
  admin_files: { en: "Files", ar: "الملفات", icon: FolderOpen },
  admin_lessons: { en: "Lessons", ar: "الدروس", icon: BookOpen },
  admin_roles: { en: "Roles & Permissions", ar: "الأدوار والصلاحيات", icon: Shield },
  admin_reports: { en: "Reports", ar: "التقارير", icon: BarChart3 },
  admin_settings: { en: "Settings", ar: "الإعدادات", icon: Settings },
  admin_parents: { en: "Parents", ar: "أولياء الأمور", icon: Users },
  admin_students: { en: "Students", ar: "الطلاب", icon: Users },
}

const roleColors: Record<string, string> = {
  "Super Admin": "bg-red-100 text-red-700",
  Admin: "bg-orange-100 text-orange-700",
  Support: "bg-primary/10 text-primary",
  Teacher: "bg-cyan-100 text-cyan-700",
}

export default function RolesPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { data: permissionsRes, loading: loadingPerms } = useApi<Permission[]>(
    () => api.getAdminPermissions("admin"),
    { immediate: true }
  )

  const { data: rolesRes, loading: loadingRoles, error, refetch } = useApi<Role[]>(
    () => api.getAdminRoles(),
    { immediate: true }
  )

  const rawRoles = Array.isArray(rolesRes) ? rolesRes : (rolesRes as { data?: Role[] })?.data ?? []
  const roles = Array.isArray(rawRoles) ? rawRoles : []
  const rawPerms = Array.isArray(permissionsRes) ? permissionsRes : (permissionsRes as { data?: Permission[] })?.data ?? []
  const allPermissions = Array.isArray(rawPerms) ? rawPerms : []

  const permissions = allPermissions
    .filter((p) => p.module === "admin")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      key: p.name,
      label: PERMISSION_LABELS[p.name]?.en ?? p.name,
      labelAr: PERMISSION_LABELS[p.name]?.ar ?? p.name,
      icon: PERMISSION_LABELS[p.name]?.icon ?? FileText,
    }))

  const permissionMatrix: Record<string, string[]> = {}
  roles.forEach((role) => {
    const perms = role.permissions ?? []
    permissionMatrix[role.id] = perms.map((rp: { permission: Permission }) => rp.permission?.name).filter(Boolean) ?? []
  })

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].id)
    }
  }, [roles.length, selectedRole, roles])

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!newRoleName.trim()) errors.name = isAr ? "اسم الدور مطلوب" : "Role name is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const createRes = await api.request("/admin/roles", {
        method: "POST",
        body: { name: newRoleName, description: newRoleDescription },
      })
      if (createRes.success && createRes.data) {
        const roleId = (createRes.data as { id?: string }).id
        if (roleId && selectedPermissions.length > 0) {
          await api.request(`/admin/roles/${roleId}/permissions`, {
            method: "PUT",
            body: { permissions: selectedPermissions },
          })
        }
        setShowCreate(false)
        setNewRoleName("")
        setNewRoleDescription("")
        setSelectedPermissions([])
        setFormErrors({})
        showToast(isAr ? "تم إنشاء الدور بنجاح" : "Role created successfully")
        refetch()
      } else {
        showToast(createRes.message || (isAr ? "فشل في إنشاء الدور" : "Failed to create role"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (role: Role) => {
    setEditRole(role)
    setNewRoleName(role.name)
    setNewRoleDescription(role.description ?? "")
    const permNames = (role.permissions ?? []).map((rp: { permission: Permission }) => rp.permission?.name).filter(Boolean)
    setSelectedPermissions(permNames)
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editRole || !newRoleName.trim()) {
      setFormErrors({ name: isAr ? "اسم الدور مطلوب" : "Role name is required" })
      return
    }
    setSaving(true)
    try {
      const res = await api.request(`/admin/roles/${editRole.id}`, {
        method: "PUT",
        body: { name: newRoleName, description: newRoleDescription },
      })
      if (res.success) {
        await api.request(`/admin/roles/${editRole.id}/permissions`, {
          method: "PUT",
          body: { permissions: selectedPermissions },
        })
        setShowEdit(false)
        setEditRole(null)
        setNewRoleName("")
        setNewRoleDescription("")
        setSelectedPermissions([])
        setFormErrors({})
        showToast(isAr ? "تم تحديث الدور بنجاح" : "Role updated successfully")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في التحديث" : "Failed to update"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await api.request(`/admin/roles/${id}`, { method: "DELETE" })
      if (res.success) {
        showToast(isAr ? "تم حذف الدور" : "Role deleted")
        if (selectedRole === id) setSelectedRole("")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل في الحذف" : "Failed to delete"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "An error occurred", "error")
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleTogglePermission = async (roleId: string, permKey: string) => {
    const current = permissionMatrix[roleId] ?? []
    const updated = current.includes(permKey)
      ? current.filter((p) => p !== permKey)
      : [...current, permKey]
    try {
      const res = await api.request(`/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        body: { permissions: updated },
      })
      if (res.success) {
        showToast(isAr ? "تم تحديث الصلاحيات" : "Permissions updated")
        refetch()
      } else {
        showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ" : "Error", "error")
    }
  }

  const loading = loadingPerms || loadingRoles

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-red-500">{String(error)}</p>
        <Button onClick={refetch} variant="outline">
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    )
  }

  const closeModal = () => {
    setShowCreate(false)
    setShowEdit(false)
    setEditRole(null)
    setNewRoleName("")
    setNewRoleDescription("")
    setSelectedPermissions([])
    setFormErrors({})
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isAr ? "الأدوار والصلاحيات" : "Roles & Permissions"}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {isAr ? "إدارة أدوار المستخدمين وصلاحياتهم" : "Manage user roles and their permissions"}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2 rounded-xl bg-primary text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> {isAr ? "إنشاء دور جديد" : "Create New Role"}
        </Button>
      </m.div>

      {roles.length === 0 ? (
        <m.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Shield className="mb-3 h-12 w-12 text-[#E2E8F0]" />
          <p className="text-sm font-semibold text-[#94A3B8]">{isAr ? "لا توجد أدوار" : "No roles found"}</p>
          <p className="mt-1 text-xs text-[#C0C9D4]">
            {isAr ? "أنشئ دور جديد للبدء" : "Create a new role to get started"}
          </p>
        </m.div>
      ) : (
        <>
          <m.div
            variants={fadeUp}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {roles.map((role) => (
              <m.div
                key={role.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedRole(role.id)}
                className={`cursor-pointer rounded-2xl border-2 bg-white p-4 shadow-sm transition-all ${
                  selectedRole === role.id
                    ? "border-primary shadow-md"
                    : "border-[#E2E8F0]/60 hover:border-primary/30"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      role.color || roleColors[role.name] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(role)}
                      className="rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(role.id)}
                      className="rounded-md p-1 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">
                  {isAr ? (role.nameAr || role.name) : role.name}
                </p>
                <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                  {isAr ? (role.descriptionAr || role.description) : role.description}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Users className="h-3 w-3 text-[#94A3B8]" />
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    {role.users ?? 0} {isAr ? "مستخدم" : "users"}
                  </span>
                </div>
              </m.div>
            ))}
          </m.div>

          <m.div
            variants={fadeUp}
            className="overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-sm"
          >
            <div className="border-b border-[#E2E8F0]/60 p-4">
              <h3 className="text-sm font-bold text-[#0F172A]">
                {isAr ? "مصفوفة الصلاحيات" : "Permissions Matrix"}
              </h3>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                {isAr ? "انقر على الأيقونة لتبديل الصلاحية" : "Click an icon to toggle permission"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]/40 text-[11px uppercase tracking-wider text-[#94A3B8]">
                    <th className="w-[250px] px-5 py-3 text-start font-semibold">
                      {isAr ? "الصلاحية" : "Permission"}
                    </th>
                    {roles.map((r) => (
                      <th
                        key={r.id}
                        className="px-3 py-3 text-center font-semibold"
                      >
                        {isAr ? (r.nameAr || r.name) : r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr
                      key={perm.key}
                      className="border-t border-[#E2E8F0]/40 transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <perm.icon className="h-4 w-4 text-[#94A3B8]" />
                          <span className="text-sm text-[#0F172A]">
                            {isAr ? perm.labelAr : perm.label}
                          </span>
                        </div>
                      </td>
                      {roles.map((r) => {
                        const hasPermission = permissionMatrix[r.id]?.includes(perm.key)
                        return (
                          <td key={r.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(r.id, perm.key)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                hasPermission
                                  ? "bg-green-100 hover:bg-green-200"
                                  : "bg-[#F1F5F9] hover:bg-[#E2E8F0]"
                              }`}
                            >
                              {hasPermission ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-[#CBD5E1]" />
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </m.div>
        </>
      )}

      {/* Create / Edit Role Modal */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[#E2E8F0]/60 bg-white p-5">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {showEdit
                  ? isAr
                    ? "تعديل الدور"
                    : "Edit Role"
                  : isAr
                    ? "إنشاء دور جديد"
                    : "Create New Role"}
              </h3>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F1F5F9]"
              >
                <X className="h-4 w-4 text-[#64748B]" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">
                  {isAr ? "اسم الدور" : "Role Name"} *
                </label>
                <input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${
                    formErrors.name ? "border-red-400" : "border-[#E2E8F0]/60 focus:border-primary"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">
                  {isAr ? "الوصف" : "Description"}
                </label>
                <input
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0]/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0F172A]">
                  {isAr ? "الصلاحيات" : "Permissions"}
                </label>
                <div className="max-h-[280px] space-y-2 overflow-y-auto">
                  {permissions.map((perm) => (
                    <label
                      key={perm.key}
                      onClick={() => togglePermission(perm.key)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                        selectedPermissions.includes(perm.key)
                          ? "border-primary/30 bg-primary/5"
                          : "border-[#E2E8F0]/60 hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <perm.icon className="h-4 w-4 text-[#94A3B8]" />
                        <span className="text-sm text-[#0F172A]">
                          {isAr ? perm.labelAr : perm.label}
                        </span>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          selectedPermissions.includes(perm.key)
                            ? "bg-primary text-white"
                            : "border border-[#E2E8F0]"
                        }`}
                      >
                        {selectedPermissions.includes(perm.key) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E2E8F0]/60 p-5">
              <Button variant="outline" onClick={closeModal} className="rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={showEdit ? handleEdit : handleCreate}
                disabled={saving}
                className="rounded-xl bg-primary text-white hover:bg-primary-hover"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : showEdit ? (
                  isAr ? "حفظ" : "Save"
                ) : isAr ? (
                  "إنشاء"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#0F172A]">
              {isAr ? "تأكيد الحذف" : "Confirm Delete"}
            </h3>
            <p className="mb-6 text-sm text-[#64748B]">
              {isAr
                ? "هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع."
                : "Are you sure you want to delete this role? This cannot be undone."}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                {isAr ? "حذف" : "Delete"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
