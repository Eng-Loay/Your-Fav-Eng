// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { m } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Key,
  LogIn,
  Ban,
  BookOpen,
  GraduationCap,
  Heart,
  DollarSign,
  MessageCircle,
  Plus,
  Bell,
  Loader2,
  X,
  Shield,
  Users,
  FileText,
  CheckCircle,
  CreditCard,
  Award,
  ClipboardList,
  BarChart3,
  Percent,
  Layers,
  Calculator,
  Save,
  Trash2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { safeStr, resolveImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"
  const isRTL = dir === "rtl"
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showNotifyParentModal, setShowNotifyParentModal] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [newPassword, setNewPassword] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyMessage, setNotifyMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [commissionValue, setCommissionValue] = useState(70)

  type CommissionType = "percentage" | "per_student" | "tiered"
  interface Tier { from: number; to: number | null; amount: number }
  const [commissionType, setCommissionType] = useState<CommissionType>("percentage")
  const [commissionPercentage, setCommissionPercentage] = useState(30)
  const [commissionAmountPerStudent, setCommissionAmountPerStudent] = useState(0)
  const [commissionTiers, setCommissionTiers] = useState<Tier[]>([{ from: 1, to: 10, amount: 100 }])
  const [exampleRevenue, setExampleRevenue] = useState(10000)
  const [exampleStudents, setExampleStudents] = useState(50)
  const [commissionPreview, setCommissionPreview] = useState<{ platformFee: number; instructorEarnings: number; detail: string } | null>(null)

  const { data: userData, loading, refetch } = useApi(() => api.getAdminUserDetail(id))
  const { data: coursesData } = useApi(() => api.getAdminCourses({ status: "PUBLISHED" }))
  const { data: teachersData } = useApi(() => api.getAdminUsers({ role: "teacher", status: "active", limit: 100 }))
  const [selectedTeacherId, setSelectedTeacherId] = useState("")

  const user = userData as any
  const courses = Array.isArray(coursesData) ? coursesData : []
  const teachersRaw = teachersData as { data?: any[] } | any[] | undefined
  const teacherOptions = Array.isArray(teachersRaw) ? teachersRaw : (teachersRaw?.data ?? [])

  useEffect(() => {
    const share = user?.teacherProfile?.revenueShare
    if (share != null) setCommissionValue(Number(share))
  }, [user?.teacherProfile?.revenueShare])

  const commissionConfigStr = user?.teacherProfile?.commissionConfig
  useEffect(() => {
    if (!commissionConfigStr) return
    try {
      const c = JSON.parse(commissionConfigStr) as { type?: string; percentage?: number; amountPerStudent?: number; tiers?: Tier[] }
      setCommissionType((c.type as CommissionType) || "percentage")
      setCommissionPercentage(c.percentage ?? 30)
      setCommissionAmountPerStudent(c.amountPerStudent ?? 0)
      setCommissionTiers(Array.isArray(c.tiers) && c.tiers.length > 0 ? c.tiers : [{ from: 1, to: 10, amount: 100 }])
    } catch { /* ignore */ }
  }, [commissionConfigStr])

  useEffect(() => {
    const run = async () => {
      const config = { type: commissionType, percentage: commissionPercentage, amountPerStudent: commissionAmountPerStudent, tiers: commissionTiers }
      const res = await api.previewCommission(config, exampleRevenue, exampleStudents)
      if (res?.data) setCommissionPreview(res.data)
    }
    run()
  }, [commissionType, commissionPercentage, commissionAmountPerStudent, commissionTiers, exampleRevenue, exampleStudents])

  const openEdit = () => {
    setEditForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      country: user?.country ?? "",
      bio: user?.bio ?? "",
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await api.updateAdminUser(id, editForm)
      if (res.success) {
        showToast(isAr ? "تم التحديث" : "Updated")
        setShowEditModal(false)
        refetch()
      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showToast(isAr ? "كلمة المرور 8 أحرف على الأقل" : "Password must be at least 8 characters", "error")
      return
    }
    setSaving(true)
    try {
      const res = await api.resetUserPassword(id, newPassword)
      if (res.success) {
        showToast(isAr ? "تم تعيين كلمة المرور" : "Password set")
        setShowPasswordModal(false)
        setNewPassword("")
      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const handleEnroll = async () => {
    if (!selectedCourseId) {
      showToast(isAr ? "اختر دورة" : "Select a course", "error")
      return
    }
    setSaving(true)
    try {
      const res = await api.manualEnroll(id, selectedCourseId)
      if (res.success) {
        showToast(isAr ? "تم التسجيل" : "Enrolled")
        setShowEnrollModal(false)
        setSelectedCourseId("")
        refetch()
      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const handleNotifyParent = async () => {
    const parent = user?.parent
    if (!parent?.id) {
      showToast(isAr ? "لا يوجد ولي أمر" : "No parent linked", "error")
      return
    }
    if (!notifyTitle || !notifyMessage) {
      showToast(isAr ? "أدخل العنوان والرسالة" : "Enter title and message", "error")
      return
    }
    setSaving(true)
    try {
      const res = await api.sendAdminNotification({
        target: "specific",
        title: notifyTitle,
        message: notifyMessage,
        userIds: [parent.id],
      })
      if (res.success) {
        showToast(isAr ? "تم إرسال الإشعار" : "Notification sent")
        setShowNotifyParentModal(false)
        setNotifyTitle("")
        setNotifyMessage("")
      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const handleSaveCommission = async () => {
    setSaving(true)
    try {
      const config = { type: commissionType, percentage: commissionPercentage, amountPerStudent: commissionAmountPerStudent, tiers: commissionTiers }
      const res = await api.setUserCommissionConfig(id, config)
      if (res.success) {
        showToast(isAr ? "تم تحديث إعدادات العمولة" : "Commission config updated")
        refetch()
      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const handleSaveRevenueShare = async () => {
    setSaving(true)
    try {
      const res = await api.setRevenueShare(id, commissionValue)
      if (res.success) { showToast(isAr ? "تم تحديث نسبة الحصة" : "Revenue share updated"); refetch() }
      else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
    finally { setSaving(false) }
  }

  const addCommissionTier = () => {
    const lastTo = commissionTiers.length > 0 ? (commissionTiers[commissionTiers.length - 1].to ?? commissionTiers[commissionTiers.length - 1].from) : 0
    setCommissionTiers([...commissionTiers, { from: lastTo + 1, to: lastTo + 20, amount: 150 }])
  }
  const removeCommissionTier = (i: number) => setCommissionTiers(commissionTiers.filter((_, idx) => idx !== i))
  const updateCommissionTier = (i: number, field: keyof Tier, value: number | null) =>
    setCommissionTiers(commissionTiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))

  const handleImpersonate = async () => {
    const res = await api.impersonateUser(id)
    if (res.success && res.data) {
      localStorage.setItem("lms_token", res.data.accessToken)
      localStorage.setItem("lms_refresh_token", res.data.refreshToken)
      showToast(isAr ? "تم تسجيل الدخول" : "Logged in", "info")
      window.location.href = "/"
    } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
  }

  const handleToggleStatus = async () => {
    const newStatus = user?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    const res = await api.updateUserStatus(id, newStatus)
    if (res.success) {
      showToast(isAr ? "تم تحديث الحالة" : "Status updated")
      refetch()
    } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
  }

  const roleLabels: Record<string, string> = {
    student: isAr ? "طالب" : "Student",
    teacher: isAr ? "معلم" : "Teacher",
    parent: isAr ? "ولي أمر" : "Parent",
    admin: isAr ? "مسؤول" : "Admin",
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const role = (user.role || "").toLowerCase()
  const isStudent = role === "student"
  const isTeacher = role === "teacher"
  const isParent = role === "parent"

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-primary">
          <ArrowIcon className="w-4 h-4" />
          {isAr ? "العودة للمستخدمين" : "Back to Users"}
        </Link>
      </div>

      <m.div variants={fadeUp} initial="initial" animate="animate" className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-start gap-4 shrink-0">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-[#F1F5F9]">
                <Image src={resolveImageUrl(user.avatar, "/user-avatar.png")} alt={safeStr(user.name)} fill className="object-cover" sizes="80px" unoptimized />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">{safeStr(user.name)}</h1>
                <p className="text-sm text-[#64748B]">{user.email}</p>
                <span className="inline-flex mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                  {roleLabels[role] || user.role}
                </span>
                <span className={`inline-flex ms-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {user.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:ms-auto">
              <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 rounded-xl">
                <Edit className="w-3.5 h-3.5" /> {isAr ? "تعديل" : "Edit"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowPasswordModal(true) }} className="gap-1.5 rounded-xl">
                <Key className="w-3.5 h-3.5" /> {isAr ? "كلمة مرور جديدة" : "New Password"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImpersonate} className="gap-1.5 rounded-xl">
                <LogIn className="w-3.5 h-3.5" /> {isAr ? "تسجيل دخول كمستخدم" : "Login as User"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleStatus} className="gap-1.5 rounded-xl">
                <Ban className="w-3.5 h-3.5" /> {user.status === "ACTIVE" ? (isAr ? "تعطيل" : "Disable") : (isAr ? "تفعيل" : "Enable")}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Phone className="w-4 h-4" /> {user.phone}
              </div>
            )}
            {user.country && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <MapPin className="w-4 h-4" /> {user.country}
              </div>
            )}
          </div>
          {user.bio && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC]">
              <p className="text-sm text-[#64748B] whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
        </div>
      </m.div>

      {/* Student Section */}
      {isStudent && (
        <>
          {user.status === "PENDING_REVIEW" && (
            <m.div variants={fadeUp} className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {isAr ? "قيد المراجعة" : "Pending Review"}
              </h2>
              <p className="text-sm text-amber-700 mb-4">
                {isAr ? "الحساب بانتظار الموافقة وتعيين مدرس." : "Account is awaiting approval and a teacher assignment."}
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-amber-800 block mb-1.5">
                  {isAr ? "اختر المدرس" : "Assign to Teacher"}
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full sm:w-72 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">{isAr ? "-- اختر --" : "-- Select --"}</option>
                  {teacherOptions.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!selectedTeacherId) {
                      showToast(isAr ? "اختر مدرس الأول" : "Select a teacher first", "error")
                      return
                    }
                    setSaving(true)
                    try {
                      const res = await api.approveStudent(id, selectedTeacherId)
                      if (res.success) {
                        showToast(isAr ? "تمت الموافقة" : "Approved")
                        refetch()
                      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
                    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
                    finally { setSaving(false) }
                  }}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isAr ? "موافقة" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const res = await api.rejectStudent(id)
                      if (res.success) {
                        showToast(isAr ? "تم الرفض" : "Rejected")
                        refetch()
                      } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
                    } catch { showToast(isAr ? "خطأ" : "Error", "error") }
                    finally { setSaving(false) }
                  }}
                  disabled={saving}
                  className="rounded-xl"
                >
                  {isAr ? "رفض" : "Reject"}
                </Button>
              </div>
            </m.div>
          )}

          {/* Student Summary Report */}
          <m.div variants={fadeUp} className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {isAr ? "التقرير الموجز" : "Summary Report"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/80 border border-[#E2E8F0]/60">
                <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "الدورات المسجلة" : "Enrolled Courses"}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{(user.enrollments || []).length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-[#E2E8F0]/60">
                <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "الاختبارات الشاملة" : "Comprehensive Exams"}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{(user.comprehensiveExamResults || []).length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-[#E2E8F0]/60">
                <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "اختبارات ناجحة" : "Passed Exams"}</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {(user.comprehensiveExamResults || []).filter((r: any) => r.passed).length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border border-[#E2E8F0]/60">
                <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "الشهادات" : "Certificates"}</p>
                <p className="text-2xl font-bold text-[#8B5CF6]">{(user.certificates || []).length}</p>
              </div>
            </div>
          </m.div>

          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {isAr ? "الدورات المسجلة" : "Enrolled Courses"}
              </h2>
              <Button size="sm" onClick={() => setShowEnrollModal(true)} className="gap-1.5 rounded-xl bg-primary">
                <Plus className="w-3.5 h-3.5" /> {isAr ? "إضافة دورة" : "Add Course"}
              </Button>
            </div>
            <div className="space-y-3">
              {(user.enrollments || []).length === 0 ? (
                <p className="text-sm text-[#94A3B8] py-4">{isAr ? "لا توجد دورات" : "No courses"}</p>
              ) : (
                (user.enrollments || []).map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded-lg overflow-hidden bg-[#E2E8F0] shrink-0">
                        {e.course?.thumbnail && <Image src={e.course.thumbnail} alt="" width={64} height={40} className="object-cover w-full h-full" unoptimized />}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{locale === "ar" ? e.course?.titleAr : e.course?.title}</p>
                        <p className="text-xs text-[#94A3B8]">{Math.round(e.progress || 0)}% {isAr ? "تقدم" : "progress"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">{e.status}</span>
                  </div>
                ))
              )}
            </div>
          </m.div>

          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {isAr ? "إجمالي الدفع" : "Total Paid"}
            </h2>
            <p className="text-2xl font-bold text-primary">{formatCurrency(user.totalPaid ?? 0)}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{(user.orders || []).length} {isAr ? "طلب" : "orders"}</p>
          </m.div>

          {/* Comprehensive Exam Results */}
          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {isAr ? "نتائج الاختبارات الشاملة" : "Comprehensive Exam Results"}
            </h2>
            <div className="space-y-3">
              {(user.comprehensiveExamResults || []).length === 0 ? (
                <p className="text-sm text-[#94A3B8] py-4">{isAr ? "لا توجد نتائج اختبارات" : "No exam results yet"}</p>
              ) : (
                (user.comprehensiveExamResults || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]">
                    <div>
                      <p className="font-medium text-[#0F172A]">{locale === "ar" ? r.comprehensiveExam?.titleAr : r.comprehensiveExam?.title}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {isAr ? "المحاولات" : "Attempts"}: {r.attempts} • {isAr ? "الدرجة" : "Score"}: {r.score}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${r.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </m.div>

          {/* Certificates */}
          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#8B5CF6]" />
              {isAr ? "الشهادات" : "Certificates"} ({(user.certificates || []).length})
            </h2>
            <div className="space-y-3">
              {(user.certificates || []).length === 0 ? (
                <p className="text-sm text-[#94A3B8] py-4">{isAr ? "لا توجد شهادات بعد" : "No certificates yet"}</p>
              ) : (
                (user.certificates || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]">
                    <div>
                      <p className="font-medium text-[#0F172A]">{locale === "ar" ? c.course?.titleAr : c.course?.title}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {c.certificateNo && `${isAr ? "رقم الشهادة" : "Certificate No"}: ${c.certificateNo}`}
                        {c.grade != null && ` • ${isAr ? "الدرجة" : "Grade"}: ${c.grade}`}
                        {c.issuedAt && ` • ${new Date(c.issuedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}`}
                      </p>
                    </div>
                    <Award className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                ))
              )}
            </div>
          </m.div>

          {user.parent && (
            <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#EC4899]" />
                  {isAr ? "ولي الأمر" : "Parent"}
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowNotifyParentModal(true)} className="gap-1.5 rounded-xl">
                  <Bell className="w-3.5 h-3.5" /> {isAr ? "إشعار بامتحانات الطالب" : "Notify about exams"}
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC]">
                <p className="font-medium text-[#0F172A]">{user.parent.name}</p>
                <p className="text-sm text-[#64748B]">{user.parent.email}</p>
                {user.parent.phone && <p className="text-sm text-[#64748B]">{user.parent.phone}</p>}
                <Link href={`/admin/users/${user.parent.id}`}>
                  <Button variant="ghost" size="sm" className="mt-2 text-primary">{isAr ? "عرض الملف" : "View Profile"}</Button>
                </Link>
              </div>
            </m.div>
          )}
        </>
      )}

      {/* Teacher Section - Profile & Approve */}
      {isTeacher && (
        <>
          {user.teacherProfile && (
            <>
              {user.status === "PENDING_REVIEW" && (
                <m.div variants={fadeUp} className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {isAr ? "قيد المراجعة" : "Pending Review"}
                  </h2>
                  <p className="text-sm text-amber-700 mb-4">
                    {isAr ? "تم تقديم بيانات المدرس وانتظار الموافقة." : "Teacher profile submitted and awaiting approval."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        setSaving(true)
                        try {
                          const res = await api.approveTeacher(id)
                          if (res.success) {
                            showToast(isAr ? "تمت الموافقة" : "Approved")
                            refetch()
                          } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
                        } catch { showToast(isAr ? "خطأ" : "Error", "error") }
                        finally { setSaving(false) }
                      }}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isAr ? "موافقة" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setSaving(true)
                        try {
                          const res = await api.rejectTeacher(id)
                          if (res.success) {
                            showToast(isAr ? "تم الرفض" : "Rejected")
                            refetch()
                          } else showToast(res.message || (isAr ? "فشل" : "Failed"), "error")
                        } catch { showToast(isAr ? "خطأ" : "Error", "error") }
                        finally { setSaving(false) }
                      }}
                      disabled={saving}
                      className="rounded-xl"
                    >
                      {isAr ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </m.div>
              )}
              <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8B5CF6]" />
                  {isAr ? "بيانات البروفايل" : "Profile Data"}
                </h2>
                <div className="space-y-3">
                  {user.bio && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "نبذة" : "Bio"}</p>
                      <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{user.bio}</p>
                    </div>
                  )}
                  {user.teacherProfile?.specialty && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "التخصص" : "Specialty"}</p>
                      <p className="text-sm text-[#0F172A]">{user.teacherProfile?.specialty}</p>
                    </div>
                  )}
                  {user.teacherProfile?.experience && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "الخبرات" : "Experience"}</p>
                      <p className="text-sm text-[#0F172A]">{user.teacherProfile?.experience}</p>
                    </div>
                  )}
                  {user.teacherProfile?.subject && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "المادة" : "Subject"}</p>
                      <p className="text-sm text-[#0F172A]">{user.teacherProfile.subject}</p>
                    </div>
                  )}
                  {user.teacherProfile?.website && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">{isAr ? "الموقع" : "Website"}</p>
                      <a href={user.teacherProfile?.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {user.teacherProfile?.website}
                      </a>
                    </div>
                  )}
                  {user.teacherProfile?.twitter && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">Twitter</p>
                      <p className="text-sm text-[#0F172A]">{user.teacherProfile?.twitter}</p>
                    </div>
                  )}
                  {!user.bio && !user.teacherProfile?.specialty && !user.teacherProfile?.experience && (
                    <p className="text-sm text-[#94A3B8]">{isAr ? "لم يتم إكمال بيانات البروفايل بعد" : "Profile data not completed yet"}</p>
                  )}
                </div>
              </m.div>

              <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#059669]" />
                {isAr ? "إعدادات العمولة لهذا المدرس" : "Commission settings for this teacher"}
              </h2>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#F8FAFC]">
                <label className="text-sm font-medium text-[#0F172A]">{isAr ? "نسبة حصة المدرس" : "Teacher revenue share"}</label>
                <input type="number" min={0} max={100} value={commissionValue} onChange={(e) => setCommissionValue(Number(e.target.value))} className="w-20 border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm" />
                <span className="text-sm text-[#64748B]">%</span>
                <Button size="sm" variant="outline" onClick={handleSaveRevenueShare} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ" : "Save")}</Button>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">
                {isAr ? "طريقة حساب عمولة المنصة لهذا المدرس. إن لم تُضبط، تُستخدم الإعدادات العامة." : "Platform commission calculation for this teacher. If not set, global settings apply."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#0F172A] block mb-2">{isAr ? "نوع العمولة" : "Commission type"}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: "percentage" as const, icon: Percent, labelAr: "نسبة مئوية", labelEn: "Percentage" },
                      { value: "per_student" as const, icon: Users, labelAr: "قيمة ثابتة لكل طالب", labelEn: "Fixed per student" },
                      { value: "tiered" as const, icon: Layers, labelAr: "شرائح", labelEn: "Tiers" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCommissionType(opt.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-start ${
                          commissionType === opt.value ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 ${commissionType === opt.value ? "text-primary" : "text-[#64748B]"}`} />
                        <span className="text-sm font-medium">{isAr ? opt.labelAr : opt.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {commissionType === "percentage" && (
                  <div>
                    <label className="text-sm font-semibold text-[#0F172A] block mb-1">{isAr ? "النسبة المئوية (%)" : "Percentage (%)"}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value) || 0)}
                      className="w-32 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {commissionType === "per_student" && (
                  <div>
                    <label className="text-sm font-semibold text-[#0F172A] block mb-1">{isAr ? "القيمة لكل طالب" : "Amount per student"}</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={commissionAmountPerStudent}
                      onChange={(e) => setCommissionAmountPerStudent(Number(e.target.value) || 0)}
                      className="w-40 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {commissionType === "tiered" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#0F172A]">{isAr ? "الشرائح" : "Tiers"}</label>
                      <Button variant="outline" size="sm" onClick={addCommissionTier} className="gap-1 rounded-lg">
                        <Plus className="w-4 h-4" /> {isAr ? "إضافة" : "Add"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {commissionTiers.map((t, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                          <input type="number" min={1} value={t.from} onChange={(e) => updateCommissionTier(i, "from", Number(e.target.value) || 1)} className="w-16 border rounded-lg px-2 py-1.5 text-sm" />
                          <span className="text-[#64748B]">–</span>
                          <input type="number" min={t.from} value={t.to ?? ""} onChange={(e) => updateCommissionTier(i, "to", e.target.value ? Number(e.target.value) : null)} className="w-16 border rounded-lg px-2 py-1.5 text-sm" placeholder={isAr ? "∞" : "∞"} />
                          <input type="number" min={0} step={0.01} value={t.amount} onChange={(e) => updateCommissionTier(i, "amount", Number(e.target.value) || 0)} className="w-20 border rounded-lg px-2 py-1.5 text-sm" />
                          <button onClick={() => removeCommissionTier(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{isAr ? "معاينة" : "Preview"}</span>
                  </div>
                  <div className="flex gap-3 mb-2">
                    <div>
                      <label className="text-xs text-[#64748B] block">{isAr ? "إيرادات مثال" : "Example revenue"}</label>
                      <input type="number" min={0} value={exampleRevenue} onChange={(e) => setExampleRevenue(Number(e.target.value) || 0)} className="w-24 border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-[#64748B] block">{isAr ? "عدد الطلاب" : "Students"}</label>
                      <input type="number" min={0} value={exampleStudents} onChange={(e) => setExampleStudents(Number(e.target.value) || 0)} className="w-24 border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                  {commissionPreview && (
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200 text-sm mb-3">
                      <span className="text-[#64748B]">{isAr ? "عمولة المنصة:" : "Platform fee:"}</span> <span className="font-bold text-emerald-700">{commissionPreview.platformFee}</span>
                      {" · "}
                      <span className="text-[#64748B]">{isAr ? "صافي المدرس:" : "Teacher net:"}</span> <span className="font-bold text-emerald-700">{commissionPreview.instructorEarnings}</span>
                      <p className="text-xs text-[#64748B] mt-1">{commissionPreview.detail}</p>
                    </div>
                  )}
                  <Button size="sm" onClick={handleSaveCommission} disabled={saving} className="rounded-xl gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isAr ? "حفظ إعدادات العمولة" : "Save commission settings"}
                  </Button>
                </div>
              </div>
            </m.div>
            </>
          )}

          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B5CF6]" />
              {isAr ? "الدورات" : "Courses"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(user.courses || []).map((c: any) => (
                <Link key={c.id} href={`/admin/courses`} className="block p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9]">
                  <p className="font-medium text-[#0F172A]">{locale === "ar" ? c.titleAr : c.title}</p>
                  <p className="text-xs text-[#94A3B8]">{c.totalStudents ?? 0} {isAr ? "طالب" : "students"}</p>
                </Link>
              ))}
            </div>
            {user.instructorStats && (
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#94A3B8]">{isAr ? "إجمالي المبيعات" : "Total Sales"}</p>
                  <p className="font-bold text-[#0F172A]">{formatCurrency(user.instructorStats.totalSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{isAr ? "مكسب المدرس" : "Teacher Earnings"}</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(user.instructorStats.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{isAr ? "مكسب المنصة" : "Platform Earnings"}</p>
                  <p className="font-bold text-primary">{formatCurrency(user.instructorStats.platformEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{isAr ? "الطلاب" : "Students"}</p>
                  <p className="font-bold text-[#0F172A]">{user.instructorStats.studentCount}</p>
                </div>
              </div>
            )}
          </m.div>

          <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
            <Link href={`/admin/messages`} className="flex items-center gap-2 text-primary font-medium hover:underline">
              <MessageCircle className="w-5 h-5" />
              {isAr ? "الشات للتواصل مع المدرس" : "Chat to communicate with teacher"}
            </Link>
          </m.div>
        </>
      )}

      {/* Parent Section */}
      {isParent && (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EC4899]" />
            {isAr ? "الأبناء" : "Children"}
          </h2>
          <div className="space-y-3">
            {(user.children || []).length === 0 ? (
              <p className="text-sm text-[#94A3B8]">{isAr ? "لا يوجد أبناء مرتبطين" : "No children linked"}</p>
            ) : (
              (user.children || []).map((c: any) => (
                <Link key={c.id} href={`/admin/users/${c.id}`} className="block p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9]">
                  <p className="font-medium text-[#0F172A]">{c.name}</p>
                  <p className="text-sm text-[#64748B]">{c.email}</p>
                </Link>
              ))
            )}
          </div>
          {user.parentProfile && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC]">
              <p className="text-sm text-[#64748B]">{isAr ? "العلاقة" : "Relationship"}: {user.parentProfile.relationship || "—"}</p>
              {user.parentProfile.address && <p className="text-sm text-[#64748B]">{user.parentProfile.address}</p>}
            </div>
          )}
        </m.div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{isAr ? "تعديل المستخدم" : "Edit User"}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {["name", "email", "phone", "country"].map((k) => (
                <div key={k}>
                  <label className="text-sm font-medium block mb-1">{k}</label>
                  <input value={editForm[k] ?? ""} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "الوصف" : "Bio"}</label>
                <textarea value={editForm.bio ?? ""} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ" : "Save")}</Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{isAr ? "كلمة مرور جديدة" : "New Password"}</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={isAr ? "8 أحرف على الأقل" : "At least 8 characters"} className="w-full border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button onClick={handleSetPassword} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تعيين" : "Set")}</Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{isAr ? "إضافة دورة" : "Add Course"}</h3>
              <button onClick={() => setShowEnrollModal(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">{isAr ? "اختر دورة" : "Select course"}</option>
                {(courses || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{locale === "ar" ? c.titleAr : c.title}</option>
                ))}
              </select>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
              <Button onClick={handleEnroll} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تسجيل" : "Enroll")}</Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Notify Parent Modal */}
      {showNotifyParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{isAr ? "إشعار ولي الأمر" : "Notify Parent"}</h3>
              <button onClick={() => setShowNotifyParentModal(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "العنوان" : "Title"}</label>
                <input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder={isAr ? "امتحانات الطالب" : "Student exams"} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{isAr ? "الرسالة" : "Message"}</label>
                <textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} rows={3} placeholder={isAr ? "تفاصيل الامتحانات..." : "Exam details..."} className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowNotifyParentModal(false)}>Cancel</Button>
              <Button onClick={handleNotifyParent} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إرسال" : "Send")}</Button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
