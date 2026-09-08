"use client"

import React, { useState } from "react"
import Image from "next/image"
import { m } from "framer-motion"
import { Heart, Search, Users, Link2, Plus, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { resolveImageUrl } from "@/lib/utils"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const PAGE_SIZE = 10

interface Child {
  name: string
  grade?: string
}

interface Parent {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  status: "active" | "inactive"
  children: Child[]
}

export default function ParentsPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [search, setSearch] = useState("")
  const [showLink, setShowLink] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [linking, setLinking] = useState(false)
  const [page, setPage] = useState(1)

  const { data: parents, loading, error, refetch } = useApi<Parent[]>(
    () => api.getAdminParents(),
    { immediate: true }
  )

  const { data: students } = useApi<{ id: string; name: string }[]>(
    () => api.getAdminStudents(),
    { immediate: true }
  )

  const parentsList = parents || []
  
  const filtered = parentsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const totalChildren = parentsList.reduce((a, p) => a + (p.children?.length || 0), 0)
  const activeParents = parentsList.filter(p => p.status === "active").length

  const handleLinkParentStudent = async () => {
    if (!selectedParentId || !studentSearch) return
    setLinking(true)
    try {
      await api.linkParentStudent(selectedParentId, studentSearch)
      setShowLink(false)
      setSelectedParentId("")
      setStudentSearch("")
      showToast(isAr ? "تم ربط ولي الأمر بالطالب بنجاح" : "Parent linked to student successfully")
      refetch()
    } catch (err) {
      showToast(isAr ? "فشل في ربط ولي الأمر بالطالب" : "Failed to link parent to student", "error")
    } finally {
      setLinking(false)
    }
  }

  const stats = [
    { label: isAr ? "إجمالي أولياء الأمور" : "Total Parents", value: parentsList.length, icon: Heart, color: "bg-[#EC4899]/10 text-[#EC4899]" },
    { label: isAr ? "أولياء الأمور النشطون" : "Active Parents", value: activeParents, icon: Users, color: "bg-[#059669]/10 text-[#059669]" },
    { label: isAr ? "إجمالي الأبناء المرتبطين" : "Linked Children", value: totalChildren, icon: Link2, color: "bg-primary/10 text-primary" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={refetch} variant="outline">{isAr ? "إعادة المحاولة" : "Retry"}</Button>
      </div>
    )
  }

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة أولياء الأمور" : "Parents Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إدارة أولياء الأمور وربطهم بالطلاب" : "Manage parents and link them to students"}</p>
        </div>
        <Button onClick={() => setShowLink(true)} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
          <Link2 className="w-4 h-4" /> {isAr ? "ربط ولي أمر بطالب" : "Link Parent to Student"}
        </Button>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <m.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
          </m.div>
        ))}
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={isAr ? "بحث عن ولي أمر..." : "Search parents..."}
              className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EC4899]/10 mb-4">
              <Heart className="w-7 h-7 text-[#EC4899]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">{isAr ? "لا يوجد أولياء أمور" : "No parents found"}</p>
            <p className="text-xs text-[#94A3B8]">{isAr ? "حاول تعديل معايير البحث" : "Try adjusting your search criteria"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "ولي الأمر" : "Parent"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "البريد" : "Email"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الهاتف" : "Phone"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الأبناء المرتبطون" : "Linked Children"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((parent) => (
                    <tr key={parent.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-lg shrink-0">
                            <Image src={resolveImageUrl(parent.avatar, "/user-avatar.png")} alt={parent.name} fill className="object-cover" />
                          </div>
                          <span className="text-sm font-medium text-[#0F172A]">{parent.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{parent.email}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B] font-mono">{parent.phone || "—"}</td>
                      <td className="px-3 py-3">
                        {(!parent.children || parent.children.length === 0) ? (
                          <span className="text-xs text-[#94A3B8]">{isAr ? "لا يوجد أبناء" : "No children linked"}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {parent.children.map((child, ci) => (
                              <span key={ci} className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                                {child.name}{child.grade ? ` (${child.grade})` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${parent.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {parent.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedParentId(parent.id); setShowLink(true) }}
                          className="gap-1.5 rounded-lg text-xs h-8"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          {isAr ? "ربط ابن" : "Assign Child"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0]/40">
                <p className="text-xs text-[#94A3B8]">
                  {isAr
                    ? `عرض ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} من ${filtered.length}`
                    : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
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

      {showLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A]">{isAr ? "ربط ولي أمر بطالب" : "Link Parent to Student"}</h3>
              <button onClick={() => setShowLink(false)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "ولي الأمر" : "Parent"}</label>
                <select 
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">{isAr ? "اختر ولي أمر" : "Select Parent"}</option>
                  {parentsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الطالب" : "Student"}</label>
                <select 
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">{isAr ? "اختر طالب" : "Select Student"}</option>
                  {(students || []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowLink(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button 
                onClick={handleLinkParentStudent} 
                disabled={linking || !selectedParentId || !studentSearch}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white"
              >
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "ربط" : "Link")}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
