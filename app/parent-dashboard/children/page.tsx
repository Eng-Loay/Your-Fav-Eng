"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { Plus, ChevronRight, ChevronLeft, GraduationCap, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ParentChildrenPage() {
  const { locale, dir } = useI18n()
  const { showToast } = useStore()
  const { data: childrenData, refetch } = useApi(() => api.getParentChildren(true))
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkEmail, setLinkEmail] = useState("")
  const [linkCode, setLinkCode] = useState("")
  const [linking, setLinking] = useState(false)

  const ensureName = (val: unknown): string =>
    typeof val === "string" ? val : (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string" ? String((val as { name: string }).name) : "Child")

  const children = (childrenData && Array.isArray(childrenData) && childrenData.length > 0)
    ? childrenData.map((c: { id: string; name?: unknown; email?: string; studentProfile?: { grade?: string }; avgGrade?: number; attendance?: number; courses?: number; statusEn?: string; statusAr?: string; recentEn?: string; recentAr?: string }) => ({
        id: c.id,
        name: ensureName(c.name) || "Child",
        nameAr: ensureName(c.name) || "طفل",
        gradeEn: c.studentProfile?.grade ? `Grade ${c.studentProfile.grade}` : "—",
        gradeAr: c.studentProfile?.grade ? `الصف ${c.studentProfile.grade}` : "—",
        schoolEn: "—",
        schoolAr: "—",
        avgGrade: c.avgGrade ?? 0,
        attendance: c.attendance ?? 0,
        courses: c.courses ?? 0,
        avatar: (ensureName(c.name) || "C").charAt(0),
        statusEn: c.statusEn ?? "—",
        statusAr: c.statusAr ?? "—",
        recentEn: c.recentEn ?? "No recent activity",
        recentAr: c.recentAr ?? "لا يوجد نشاط حديث",
      }))
    : []

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkEmail && !linkCode) return
    setLinking(true)
    try {
      const res = await api.linkChild({ email: linkEmail || undefined, code: linkCode || undefined })
      if (res.success) {
        showToast(locale === "ar" ? "تم ربط الطفل بنجاح" : "Child linked successfully")
        setLinkModalOpen(false)
        setLinkEmail("")
        setLinkCode("")
        refetch()
      } else {
        showToast(res.message || (locale === "ar" ? "فشل الربط" : "Link failed"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "حدث خطأ" : "Something went wrong", "error")
    } finally {
      setLinking(false)
    }
  }

  const isRTL = dir === "rtl"

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "أبنائي" : "My Children"}</h2>
          <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "عرض وإدارة ملفات أبنائك" : "View and manage your children's profiles"}</p>
        </div>
        <Button onClick={() => setLinkModalOpen(true)} className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-xl gap-2 shadow-lg shadow-[#EC4899]/25">
          <Plus className="w-4 h-4" />
          {locale === "ar" ? "ربط طفل جديد" : "Link Child"}
        </Button>
      </m.div>

      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg text-[#0F172A] mb-4">{locale === "ar" ? "ربط طفل" : "Link Child"}</h3>
            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-1">{locale === "ar" ? "البريد الإلكتروني للطالب" : "Student Email"}</label>
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-1">{locale === "ar" ? "أو رمز الطالب" : "Or Student Code"}</label>
                <input
                  type="text"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm"
                  placeholder="ID"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" disabled={linking} className="bg-[#EC4899] hover:bg-[#DB2777]">{linking ? (locale === "ar" ? "جاري..." : "Linking...") : (locale === "ar" ? "ربط" : "Link")}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {children.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-12 text-center"
        >
          <Users className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
          <h3 className="font-bold text-lg text-[#0F172A] mb-2">{locale === "ar" ? "لا يوجد أبناء مرتبطين" : "No children linked"}</h3>
          <p className="text-sm text-[#64748B] mb-6">{locale === "ar" ? "اربط طفلك باستخدام البريد الإلكتروني أو رمز الطالب" : "Link your child using their email or student code"}</p>
          <Button onClick={() => setLinkModalOpen(true)} className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            {locale === "ar" ? "ربط طفل" : "Link Child"}
          </Button>
        </m.div>
      ) : (
      <div className="grid lg:grid-cols-2 gap-6">
        {children.map((child, i) => (
          <m.div
            key={child.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            <div className="h-2 bg-gradient-to-r from-[#EC4899] to-[#F472B6]" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{child.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-[#0F172A]">{locale === "ar" ? child.nameAr : child.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="text-sm text-[#64748B]">{locale === "ar" ? child.gradeAr : child.gradeEn}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{locale === "ar" ? child.schoolAr : child.schoolEn}</p>
                </div>
                <Badge variant="secondary" className={`text-[10px] border-0 ${child.avgGrade >= 90 ? "bg-[#059669]/10 text-[#059669]" : "bg-primary/10 text-primary"}`}>
                  {locale === "ar" ? child.statusAr : child.statusEn}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-xl bg-[#EC4899]/5 border border-[#EC4899]/10 text-center">
                  <p className="text-lg font-bold text-[#EC4899]">{child.avgGrade}%</p>
                  <p className="text-[10px] text-[#64748B]">{locale === "ar" ? "المعدل" : "Avg Grade"}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#059669]/5 border border-[#059669]/10 text-center">
                  <p className="text-lg font-bold text-[#059669]">{child.attendance}%</p>
                  <p className="text-[10px] text-[#64748B]">{locale === "ar" ? "الحضور" : "Attendance"}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                  <p className="text-lg font-bold text-primary">{child.courses}</p>
                  <p className="text-[10px] text-[#64748B]">{locale === "ar" ? "الدورات" : "Courses"}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 mb-4">
                <p className="text-xs text-[#64748B] mb-0.5">{locale === "ar" ? "آخر نشاط" : "Recent Activity"}</p>
                <p className="text-sm font-medium text-[#0F172A]">{locale === "ar" ? child.recentAr : child.recentEn}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]/60">
                <Link href="/parent-dashboard/progress" className="text-xs text-[#EC4899] font-semibold hover:underline flex items-center gap-1">
                  {locale === "ar" ? "عرض التقدم" : "View Progress"}
                  {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
                <Link href="/parent-dashboard/grades" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  {locale === "ar" ? "عرض الدرجات" : "View Grades"}
                  {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
              </div>
            </div>
          </m.div>
        ))}
      </div>
      )}
    </div>
  )
}
