"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { m } from "framer-motion"
import { Plus, FileText, CheckCircle2, Clock, AlertCircle, ChevronDown, X, Inbox } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { labelEn: string; labelAr: string; icon: typeof CheckCircle2; color: string; badgeColor: string }> = {
  active: { labelEn: "Active", labelAr: "نشط", icon: Clock, color: "text-primary", badgeColor: "bg-primary/10 text-primary" },
  completed: { labelEn: "Completed", labelAr: "مكتمل", icon: CheckCircle2, color: "text-[#059669]", badgeColor: "bg-[#059669]/10 text-[#059669]" },
  graded: { labelEn: "Graded", labelAr: "تم التصحيح", icon: CheckCircle2, color: "text-[#8B5CF6]", badgeColor: "bg-[#8B5CF6]/10 text-[#8B5CF6]" },
  overdue: { labelEn: "Overdue", labelAr: "متأخر", icon: AlertCircle, color: "text-red-500", badgeColor: "bg-red-100 text-red-600" },
}

export default function TeacherAssignmentsPage() {
  const { locale, dir } = useI18n()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const isRTL = dir === "rtl"
  const [formTitle, setFormTitle] = useState("")
  const [formClass, setFormClass] = useState("")
  const [formDueDate, setFormDueDate] = useState("")
  const [formPoints, setFormPoints] = useState("")
  const [formDesc, setFormDesc] = useState("")

  const { data: assignmentsRes, refetch } = useApi(() => api.getTeacherAssignments())
  const { data: classesRes } = useApi(() => api.getTeacherClasses())
  const classOptions = Array.isArray(classesRes) ? classesRes : []

  const assignmentsData = (() => {
    const paginated = assignmentsRes as { data?: any[] } | undefined
    const arr = Array.isArray(assignmentsRes) ? assignmentsRes : (paginated?.data ?? [])
    return arr.map((a: any) => ({
      id: a.id,
      titleEn: a.title ?? "",
      titleAr: a.titleAr ?? a.title ?? "",
      classEn: a.class?.name ?? "",
      classAr: a.class?.nameAr ?? a.class?.name ?? "",
      dueDate: a.dueDate ?? "",
      dueDateAr: a.dueDate ? new Date(a.dueDate).toLocaleDateString("ar-SA") : "",
      submissions: a._count?.submissions ?? 0,
      total: a.class?.maxStudents ?? 0,
      status: (a.status as "active" | "completed" | "graded" | "overdue") ?? "active",
    }))
  })()

  const handleCreate = async () => {
    const res = await api.createTeacherAssignment({ title: formTitle, classId: formClass, dueDate: formDueDate, totalPoints: formPoints ? Number(formPoints) : undefined, description: formDesc })
    if (res.success) {
      setShowForm(false)
      setFormTitle("")
      setFormClass("")
      setFormDueDate("")
      setFormPoints("")
      setFormDesc("")
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الواجبات" : "Assignments"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "إنشاء وإدارة الواجبات" : "Create and manage assignments"}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-2 shadow-lg shadow-[#059669]/25">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? (locale === "ar" ? "إلغاء" : "Cancel") : (locale === "ar" ? "إنشاء واجب" : "Create Assignment")}
        </Button>
      </m.div>

      {showForm && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6"
        >
          <h3 className="font-bold text-[#0F172A] mb-4">{locale === "ar" ? "واجب جديد" : "New Assignment"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "العنوان" : "Title"}</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الصف" : "Class"}</label>
              <select value={formClass} onChange={(e) => setFormClass(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]">
                <option value="">{locale === "ar" ? "اختر الصف" : "Select Class"}</option>
                {classOptions.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "تاريخ التسليم" : "Due Date"}</label>
              <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الدرجة الكاملة" : "Total Points"}</label>
              <input type="number" value={formPoints} onChange={(e) => setFormPoints(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الوصف" : "Description"}</label>
              <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] resize-none" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreate} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl">
              {locale === "ar" ? "إنشاء الواجب" : "Create Assignment"}
            </Button>
          </div>
        </m.div>
      )}

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
        {assignmentsData.length === 0 && !showForm ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-[#64748B]">{locale === "ar" ? "لا توجد واجبات بعد. أنشئ واجباً جديداً." : "No assignments yet. Create a new one."}</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/60">
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "العنوان" : "Title"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">{locale === "ar" ? "الصف" : "Class"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden md:table-cell">{locale === "ar" ? "تاريخ التسليم" : "Due Date"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "التسليمات" : "Submissions"}</th>
                <th className="text-start px-5 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{locale === "ar" ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {assignmentsData.map((assignment, i) => {
                const status = statusConfig[assignment.status]
                const StatusIcon = status.icon
                return (
                  <m.tr
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => router.push(`/teacher-dashboard/assignments/${assignment.id}`)}
                    className="border-b border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#059669]" />
                        </div>
                        <span className="text-sm font-semibold text-[#0F172A]">{locale === "ar" ? assignment.titleAr : assignment.titleEn}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-[#64748B]">{locale === "ar" ? assignment.classAr : assignment.classEn}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-[#64748B]">{locale === "ar" ? assignment.dueDateAr : assignment.dueDate}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div className="h-full rounded-full bg-[#059669]" style={{ width: `${assignment.total > 0 ? (assignment.submissions / assignment.total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A]">{assignment.submissions}/{assignment.total}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" className={`text-[10px] border-0 gap-1 ${status.badgeColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {locale === "ar" ? status.labelAr : status.labelEn}
                      </Badge>
                    </td>
                  </m.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}
      </m.div>

      {assignmentsData.length > 0 && (
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-[#059669]" />
          <h3 className="font-bold text-[#0F172A]">{locale === "ar" ? "نظرة عامة" : "Overview"}</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#059669]/5 border border-[#059669]/10 text-center">
            <p className="text-2xl font-bold text-[#059669]">{assignmentsData.length}</p>
            <p className="text-xs text-[#64748B] mt-1">{locale === "ar" ? "إجمالي الواجبات" : "Total Assignments"}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">{assignmentsData.reduce((sum, a) => sum + a.submissions, 0)}</p>
            <p className="text-xs text-[#64748B] mt-1">{locale === "ar" ? "إجمالي التسليمات" : "Total Submissions"}</p>
          </div>
        </div>
        <p className="text-xs text-[#94A3B8] mt-4 text-center">
          {locale === "ar" ? "دوس على أي واجب فوق عشان تصححه" : "Click any assignment above to grade its submissions"}
        </p>
      </m.div>
      )}
    </div>
  )
}
