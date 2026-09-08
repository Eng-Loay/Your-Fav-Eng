"use client"

import React, { useState, useRef, useCallback } from "react"
import { m } from "framer-motion"
import {
  FolderOpen,
  Search,
  Upload,
  Grid3X3,
  List,
  FileVideo,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  HardDrive,
  Film,
  FileImage,
  FileType,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import { safeStr } from "@/lib/utils"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

interface FileItem {
  id: string
  name: string
  type: "video" | "pdf" | "image" | "document"
  size: string
  uploadedAt: string
  uploadedBy: string
}

interface StorageStats {
  used: string
  total: string
  percent: number
  videoCount: number
  pdfCount: number
  imageCount: number
  documentCount: number
}

const typeIcons: Record<string, React.ElementType> = {
  video: FileVideo,
  pdf: FileText,
  image: ImageIcon,
  document: File,
}

const typeColors: Record<string, string> = {
  video: "bg-purple-100 text-purple-700",
  pdf: "bg-red-100 text-red-700",
  image: "bg-primary/10 text-primary",
  document: "bg-yellow-100 text-yellow-700",
}

export default function FilesPage() {
  const { locale } = useI18n()
  const { showToast } = useStore()
  const isAr = locale === "ar"
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: files, loading, error, refetch } = useApi<FileItem[]>(
    () => api.getAdminFiles({ type: typeFilter !== "all" ? typeFilter : undefined, search: search || undefined }),
    { immediate: true, deps: [typeFilter, search] }
  )

  const { data: storageData, refetch: refetchStorage } = useApi<StorageStats>(
    () => api.getStorageStats(),
    { immediate: true }
  )

  const filesRaw = files as any
  const filesList: FileItem[] = (Array.isArray(filesRaw) ? filesRaw : []).map((f: any) => {
    const typeRaw = safeStr(f?.type).toLowerCase()
    const type: FileItem["type"] =
      typeRaw === "video" ? "video" :
      typeRaw === "pdf" ? "pdf" :
      typeRaw === "image" ? "image" :
      typeRaw === "document" ? "document" :
      typeRaw === "doc" || typeRaw === "docx" ? "document" :
      typeRaw === "png" || typeRaw === "jpg" || typeRaw === "jpeg" || typeRaw === "gif" || typeRaw === "webp" ? "image" :
      typeRaw === "mp4" || typeRaw === "mov" || typeRaw === "mkv" || typeRaw === "avi" ? "video" :
      "document"

    return {
      id: safeStr(f?.id),
      name: safeStr(f?.name),
      type,
      size: safeStr(f?.size),
      uploadedAt: safeStr(f?.uploadedAt ?? f?.createdAt ?? ""),
      uploadedBy: safeStr(f?.uploadedBy ?? f?.uploader ?? f?.user ?? ""),
    }
  })
  const storage = storageData || { used: "0 GB", total: "50 GB", percent: 0, videoCount: 0, pdfCount: 0, imageCount: 0, documentCount: 0 }

  const filtered = filesList.filter(f => {
    const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || f.type === typeFilter
    return matchSearch && matchType
  })

  const videoCount = storage.videoCount || filesList.filter(f => f.type === "video").length
  const pdfCount = storage.pdfCount || filesList.filter(f => f.type === "pdf").length
  const imageCount = storage.imageCount || filesList.filter(f => f.type === "image").length

  const handleUploadFile = useCallback(async (file: globalThis.File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await api.uploadAdminFile(formData)
      if (res.success) {
        showToast(isAr ? "تم رفع الملف بنجاح" : "File uploaded successfully")
        refetch()
        refetchStorage()
      } else {
        showToast(res.message || (isAr ? "فشل رفع الملف" : "Failed to upload file"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ أثناء الرفع" : "An error occurred during upload", "error")
    } finally {
      setUploading(false)
    }
  }, [isAr, showToast, refetch, refetchStorage])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUploadFile(file)
  }

  const handleViewFile = (file: FileItem) => {
    window.open(`/uploads/${file.name}`, "_blank")
  }

  const handleDownloadFile = (file: FileItem) => {
    const a = document.createElement("a")
    a.href = `/uploads/${file.name}`
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDeleteFile = async (id: string) => {
    setDeleting(id)
    setConfirmDelete(null)
    try {
      const res = await api.deleteAdminFile(id)
      if (res.success) {
        showToast(isAr ? "تم حذف الملف بنجاح" : "File deleted successfully")
        refetch()
        refetchStorage()
      } else {
        showToast(res.message || (isAr ? "فشل في حذف الملف" : "Failed to delete file"), "error")
      }
    } catch {
      showToast(isAr ? "حدث خطأ أثناء الحذف" : "An error occurred during deletion", "error")
    } finally {
      setDeleting(null)
    }
  }

  const storageStats = [
    { label: isAr ? "المساحة المستخدمة" : "Used Storage", value: storage.used || "0 GB", total: storage.total || "50 GB", percent: storage.percent || 0, icon: HardDrive, color: "bg-primary/10 text-primary" },
    { label: isAr ? "فيديوهات" : "Videos", value: videoCount, icon: Film, color: "bg-purple-100 text-purple-700" },
    { label: isAr ? "ملفات PDF" : "PDFs", value: pdfCount, icon: FileType, color: "bg-red-100 text-red-700" },
    { label: isAr ? "صور" : "Images", value: imageCount, icon: FileImage, color: "bg-primary/10 text-primary" },
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
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="video/*,application/pdf,image/*,.doc,.docx"
        onChange={handleFileInputChange}
      />

      <m.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isAr ? "إدارة الملفات" : "File Management"}</h1>
          <p className="text-sm text-[#64748B] mt-1">{isAr ? "إدارة ملفات ووسائط المنصة" : "Manage platform files and media"}</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع ملف" : "Upload File")}
        </Button>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {storageStats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2E8F0]/60 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-[#94A3B8]">{s.label}</p>
            {"percent" in s && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.percent}%` }} />
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">{s.value} / {s.total}</p>
              </div>
            )}
          </div>
        ))}
      </m.div>

      <m.div
        variants={fadeUp}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragOver ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-primary/30"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
        )}
        <p className="text-sm font-semibold text-[#0F172A]">
          {uploading
            ? (isAr ? "جاري رفع الملف..." : "Uploading file...")
            : (isAr ? "اسحب الملفات هنا أو انقر للرفع" : "Drag & drop files here or click to upload")}
        </p>
        <p className="text-xs text-[#94A3B8] mt-1">{isAr ? "يدعم: MP4, PDF, PNG, JPG, DOCX" : "Supports: MP4, PDF, PNG, JPG, DOCX"}</p>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث عن ملف..." : "Search files..."} className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]" />
          </div>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-sm border border-[#E2E8F0]/60 rounded-xl px-3 py-2 bg-white text-[#0F172A] outline-none">
              <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
              <option value="video">{isAr ? "فيديو" : "Videos"}</option>
              <option value="pdf">PDF</option>
              <option value="image">{isAr ? "صور" : "Images"}</option>
              <option value="document">{isAr ? "مستندات" : "Documents"}</option>
            </select>
            <div className="flex border border-[#E2E8F0]/60 rounded-xl overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-white" : "text-[#94A3B8] hover:bg-[#F1F5F9]"}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-white" : "text-[#94A3B8] hover:bg-[#F1F5F9]"}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] mb-4">
              <FolderOpen className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">{isAr ? "لا توجد ملفات" : "No files found"}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{isAr ? "ابدأ برفع ملفاتك" : "Start by uploading your files"}</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white"
            >
              <Upload className="w-4 h-4" /> {isAr ? "رفع ملف" : "Upload File"}
            </Button>
          </div>
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                  <th className="text-start px-5 py-3 font-semibold">{isAr ? "الملف" : "File"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "النوع" : "Type"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "الحجم" : "Size"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "رفع بواسطة" : "Uploaded By"}</th>
                  <th className="text-start px-3 py-3 font-semibold">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="text-start px-3 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
        {filtered.map(file => {
          const Icon = typeIcons[file.type] || File
                  return (
                    <tr key={file.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${typeColors[file.type] || "bg-slate-100 text-slate-700"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-[#0F172A]">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${typeColors[file.type] || "bg-slate-100 text-slate-700"}`}>{file.type.toUpperCase()}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{file.size}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{file.uploadedBy}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{file.uploadedAt}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewFile(file)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDownloadFile(file)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"><Download className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => setConfirmDelete(file.id)}
                            disabled={deleting === file.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                          >
                            {deleting === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filtered.map(file => {
              const Icon = typeIcons[file.type] || File
              return (
                <m.div key={file.id} whileHover={{ y: -2 }} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]/60 hover:shadow-md transition-all cursor-pointer group relative">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${typeColors[file.type] || "bg-slate-100 text-slate-700"} mx-auto mb-2`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-[#0F172A] text-center truncate">{file.name}</p>
                  <p className="text-[10px] text-[#94A3B8] text-center mt-0.5">{file.size}</p>
                  <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-white rounded-lg shadow-sm border border-[#E2E8F0]/60 p-0.5">
                    <button onClick={() => handleViewFile(file)} className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"><Eye className="w-3 h-3" /></button>
                    <button onClick={() => handleDownloadFile(file)} className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B]"><Download className="w-3 h-3" /></button>
                    <button onClick={() => setConfirmDelete(file.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </m.div>
              )
            })}
          </div>
        )}
      </m.div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-sm text-[#64748B] mb-6">{isAr ? "هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع." : "Are you sure you want to delete this file? This cannot be undone."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => handleDeleteFile(confirmDelete)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">{isAr ? "حذف" : "Delete"}</Button>
            </div>
          </m.div>
        </div>
      )}
    </m.div>
  )
}
