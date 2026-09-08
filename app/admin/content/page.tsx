"use client"

import React, { useState } from "react"
import Image from "next/image"
import { m } from "framer-motion"
import {
  FileEdit,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Layout,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Upload,
  Globe,
  Loader2,
  AlertTriangle,
  Inbox,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const tabs = [
  { key: "banners", icon: ImageIcon, en: "Home Banners", ar: "بانرات الرئيسية" },
  { key: "pages", icon: Layout, en: "Landing Pages", ar: "صفحات الهبوط" },
  { key: "blog", icon: FileText, en: "Blog", ar: "المدونة" },
  { key: "faq", icon: HelpCircle, en: "FAQ", ar: "الأسئلة الشائعة" },
]

interface ContentItem {
  id: string
  type: string
  title: string
  titleAr?: string
  image?: string
  status: "active" | "inactive" | "published" | "draft"
  position?: number
  slug?: string
  updatedAt?: string
  author?: string
  publishedAt?: string
  views?: number
  question?: string
  questionAr?: string
  answer?: string
  answerAr?: string
  category?: string
}

function getContentType(tab: string) {
  if (tab === "banners") return "banner"
  if (tab === "pages") return "page"
  if (tab === "blog") return "blog"
  return "faq"
}

function EmptyState({ isAr, tab }: { isAr: boolean; tab: string }) {
  const labels: Record<string, { en: string; ar: string }> = {
    banners: { en: "No banners yet", ar: "لا توجد بانرات بعد" },
    pages: { en: "No pages yet", ar: "لا توجد صفحات بعد" },
    blog: { en: "No blog posts yet", ar: "لا توجد مقالات بعد" },
    faq: { en: "No FAQ items yet", ar: "لا توجد أسئلة شائعة بعد" },
  }
  const label = labels[tab] || labels.banners
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-12 h-12 text-[#CBD5E1] mb-3" />
      <p className="text-sm font-medium text-[#94A3B8]">{isAr ? label.ar : label.en}</p>
      <p className="text-xs text-[#CBD5E1] mt-1">
        {isAr ? "اضغط على \"إضافة جديد\" للبدء" : "Click \"Add New\" to get started"}
      </p>
    </div>
  )
}

export default function ContentPage() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()

  const [activeTab, setActiveTab] = useState("banners")
  const [showEditor, setShowEditor] = useState(false)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [newTitleAr, setNewTitleAr] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [newQuestion, setNewQuestion] = useState("")
  const [newQuestionAr, setNewQuestionAr] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newAnswerAr, setNewAnswerAr] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newPosition, setNewPosition] = useState("")

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ContentItem | null>(null)

  const { data: contentData, loading, error, refetch } = useApi<ContentItem[]>(
    () => api.getAdminContent(activeTab),
    { immediate: true, deps: [activeTab] }
  )

  const contentList = contentData || []

  const banners = contentList.filter(c => c.type === "banner" || activeTab === "banners")
  const pages = contentList.filter(c => c.type === "page" || activeTab === "pages")
  const blog = contentList.filter(c => c.type === "blog" || activeTab === "blog")
  const faq = contentList.filter(c => c.type === "faq" || activeTab === "faq")

  const resetForm = () => {
    setNewTitle("")
    setNewTitleAr("")
    setNewContent("")
    setNewSlug("")
    setNewQuestion("")
    setNewQuestionAr("")
    setNewAnswer("")
    setNewAnswerAr("")
    setNewCategory("")
    setNewPosition("")
    setEditItem(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowEditor(true)
  }

  const openEditModal = (item: ContentItem) => {
    setEditItem(item)
    setNewTitle(item.title || "")
    setNewTitleAr(item.titleAr || "")
    setNewContent("")
    setNewSlug(item.slug || "")
    setNewQuestion(item.question || "")
    setNewQuestionAr(item.questionAr || "")
    setNewAnswer(item.answer || "")
    setNewAnswerAr(item.answerAr || "")
    setNewCategory(item.category || "")
    setNewPosition(item.position != null ? String(item.position) : "")
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    resetForm()
  }

  const isFaqTab = activeTab === "faq"

  const handleSaveContent = async () => {
    if (isFaqTab) {
      if (!newQuestion) return
    } else {
      if (!newTitle) return
    }

    setSaving(true)
    const type = getContentType(activeTab)

    try {
      if (editItem) {
        const payload: Record<string, unknown> = { type }
        if (isFaqTab) {
          payload.question = newQuestion
          payload.questionAr = newQuestionAr
          payload.answer = newAnswer
          payload.answerAr = newAnswerAr
          payload.category = newCategory
          payload.title = newQuestion
        } else {
          payload.title = newTitle
          payload.titleAr = newTitleAr
          payload.content = newContent
          if (activeTab === "pages") payload.slug = newSlug
          if (activeTab === "banners" && newPosition) payload.position = Number(newPosition)
        }

        await api.updateAdminContent(editItem.id, payload)
        showToast(isAr ? "تم تحديث المحتوى بنجاح" : "Content updated successfully", "success")
      } else {
        const payload: Record<string, unknown> = { type }
        if (isFaqTab) {
          payload.question = newQuestion
          payload.questionAr = newQuestionAr
          payload.answer = newAnswer
          payload.answerAr = newAnswerAr
          payload.category = newCategory
          payload.title = newQuestion
        } else {
          payload.title = newTitle
          payload.titleAr = newTitleAr
          payload.content = newContent
          if (activeTab === "pages") payload.slug = newSlug
          if (activeTab === "banners" && newPosition) payload.position = Number(newPosition)
        }

        await api.createAdminContent(payload)
        showToast(isAr ? "تم إنشاء المحتوى بنجاح" : "Content created successfully", "success")
      }

      closeEditor()
      refetch()
    } catch (err) {
      const msg = err instanceof Error ? err.message : isAr ? "حدث خطأ" : "Something went wrong"
      showToast(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = (item: ContentItem) => {
    setDeleteConfirm(item)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const id = deleteConfirm.id
    setDeleteConfirm(null)
    setDeleting(id)
    try {
      await api.deleteAdminContent(id)
      showToast(isAr ? "تم حذف المحتوى بنجاح" : "Content deleted successfully", "success")
      refetch()
    } catch (err) {
      const msg = err instanceof Error ? err.message : isAr ? "فشل الحذف" : "Delete failed"
      showToast(msg, "error")
    } finally {
      setDeleting(null)
    }
  }

  const handlePreviewPage = (slug?: string) => {
    if (slug) {
      window.open(`/${slug}`, "_blank")
    }
  }

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

  const isFormValid = isFaqTab ? !!newQuestion : !!newTitle

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة المحتوى" : "Content Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إدارة محتوى الموقع والصفحات" : "Manage website content and pages"}</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة جديد" : "Add New"}
        </Button>
      </m.div>

      <m.div variants={fadeUp}>
        <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </m.div>

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.length === 0 ? (
            <div className="col-span-full"><EmptyState isAr={isAr} tab="banners" /></div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
                <div className="relative h-36">
                  <Image src={banner.image || "/placeholder.png"} alt={banner.title} fill className="object-cover" />
                  <span className={`absolute top-2 end-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${banner.status === "active" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                    {banner.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[#0F172A]">{isAr ? (banner.titleAr || banner.title) : banner.title}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{isAr ? "الموقع" : "Position"}: {banner.position || 1}</p>
                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#F1F5F9] text-[#64748B] text-[11px] font-medium hover:bg-[#E2E8F0]"
                    >
                      <Edit className="w-3 h-3" /> {isAr ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => requestDelete(banner)}
                      disabled={deleting === banner.id}
                      className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-[#F1F5F9] text-red-500 text-[11px] hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === banner.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div onClick={openCreateModal} className="bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0] flex items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/30 transition-colors">
            <div className="text-center">
              <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">{isAr ? "إضافة بانر جديد" : "Add New Banner"}</p>
            </div>
          </div>
        </m.div>
      )}

      {/* Pages Tab */}
      {activeTab === "pages" && (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
          {pages.length === 0 ? (
            <EmptyState isAr={isAr} tab="pages" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "العنوان" : "Title"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الرابط" : "Slug"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "آخر تحديث" : "Updated"}</th>
                    <th className="text-start px-3 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
                    <tr key={page.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{isAr ? (page.titleAr || page.title) : page.title}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B] font-mono">{page.slug || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${page.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {page.status === "published" ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{page.updatedAt || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(page)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handlePreviewPage(page.slug)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Eye className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => requestDelete(page)}
                            disabled={deleting === page.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                          >
                            {deleting === page.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </m.div>
      )}

      {/* Blog Tab */}
      {activeTab === "blog" && (
        <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm overflow-hidden">
          {blog.length === 0 ? (
            <EmptyState isAr={isAr} tab="blog" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{isAr ? "العنوان" : "Title"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الكاتب" : "Author"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "المشاهدات" : "Views"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "تاريخ النشر" : "Published"}</th>
                    <th className="text-start px-3 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {blog.map(post => (
                    <tr key={post.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#0F172A]">{isAr ? (post.titleAr || post.title) : post.title}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{post.author || "—"}</td>
                      <td className="px-3 py-3 text-sm text-[#0F172A] font-medium">{(post.views || 0).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {post.status === "published" ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{post.publishedAt || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(post)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Edit className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => requestDelete(post)}
                            disabled={deleting === post.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                          >
                            {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </m.div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <m.div variants={fadeUp} className="space-y-3">
          {faq.length === 0 ? (
            <EmptyState isAr={isAr} tab="faq" />
          ) : (
            faq.map((faqItem) => (
              <div key={faqItem.id} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{isAr ? (faqItem.questionAr || faqItem.question || faqItem.title) : (faqItem.question || faqItem.title)}</p>
                    <p className="text-sm text-[#64748B] mt-1.5">{isAr ? (faqItem.answerAr || faqItem.answer) : faqItem.answer}</p>
                    <span className="inline-flex mt-2 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[10px] font-semibold text-[#64748B]">{faqItem.category || "General"}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditModal(faqItem)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Edit className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => requestDelete(faqItem)}
                      disabled={deleting === faqItem.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                    >
                      {deleting === faqItem.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </m.div>
      )}

      {/* Create / Edit Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {editItem
                  ? (isAr ? "تعديل المحتوى" : "Edit Content")
                  : (isAr ? "إضافة محتوى جديد" : "Add New Content")}
              </h3>
              <button onClick={closeEditor} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9]"><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {isFaqTab ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "السؤال (English)" : "Question (English)"}</label>
                    <input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "السؤال (عربي)" : "Question (Arabic)"}</label>
                    <input
                      value={newQuestionAr}
                      onChange={(e) => setNewQuestionAr(e.target.value)}
                      dir="rtl"
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الإجابة (English)" : "Answer (English)"}</label>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={4}
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الإجابة (عربي)" : "Answer (Arabic)"}</label>
                    <textarea
                      value={newAnswerAr}
                      onChange={(e) => setNewAnswerAr(e.target.value)}
                      rows={4}
                      dir="rtl"
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "التصنيف" : "Category"}</label>
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "العنوان (English)" : "Title (English)"}</label>
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</label>
                    <input
                      value={newTitleAr}
                      onChange={(e) => setNewTitleAr(e.target.value)}
                      dir="rtl"
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  {activeTab === "pages" && (
                    <div>
                      <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الرابط (Slug)" : "Slug"}</label>
                      <input
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        placeholder="e.g. about-us"
                        className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary font-mono"
                      />
                    </div>
                  )}
                  {activeTab === "banners" && (
                    <div>
                      <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "الموقع" : "Position"}</label>
                      <input
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        type="number"
                        min={1}
                        className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-[#0F172A] block mb-1.5">{isAr ? "المحتوى" : "Content"}</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={6}
                      className="w-full border border-[#E2E8F0]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeEditor} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button
                onClick={handleSaveContent}
                disabled={saving || !isFormValid}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editItem ? (isAr ? "تحديث" : "Update") : (isAr ? "حفظ" : "Save")}
              </Button>
            </div>
          </m.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
              <p className="text-sm text-[#64748B]">
                {isAr
                  ? `هل أنت متأكد من حذف "${deleteConfirm.question || deleteConfirm.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete "${deleteConfirm.question || deleteConfirm.title}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={confirmDelete} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                {isAr ? "حذف" : "Delete"}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
