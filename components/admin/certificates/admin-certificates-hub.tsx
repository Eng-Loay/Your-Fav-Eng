"use client"

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { m, AnimatePresence } from "framer-motion"
import {
  Award,
  Search,
  Download,
  CheckCircle,
  FileText,
  Eye,
  Shield,
  Hash,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import CertificateTemplateEditor, {
  MEMBERSHIP_SHORTCODES,
  type OverlayField,
} from "@/components/admin/certificates/certificate-template-editor"
import { getMembershipShortUrl } from "@/lib/membership-links"
import { downloadMembershipPdf } from "@/lib/membership-download"
import {
  getDevMembershipTemplate,
  saveDevMembershipTemplate,
  parseMembershipOverlayFields,
} from "@/lib/dev-membership-template-store"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.05 } } }
const PAGE_SIZE = 10

type HubVariant = "course" | "membership"

interface TemplateRow {
  id: string
  name: string
  nameAr?: string
  imageUrl?: string
  overlayFields?: string
  isDefault?: boolean
}

interface IssuedRow {
  id: string
  refNo: string
  person: string
  context: string
  secondary: string
  issuedDate: string
  badge: string
  verified: boolean
  pdfUrl?: string
}

export function AdminCertificatesHub({ variant }: { variant: HubVariant }) {
  const isMembership = variant === "membership"
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { showToast } = useStore()

  const [search, setSearch] = useState("")
  const [verifyId, setVerifyId] = useState("")
  const [verifyResult, setVerifyResult] = useState<"found" | "notfound" | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [viewRow, setViewRow] = useState<IssuedRow | null>(null)
  const [page, setPage] = useState(1)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateNameAr, setTemplateNameAr] = useState("")
  const [templateImage, setTemplateImage] = useState(
    isMembership ? "/brand/loay/poster-programming-ai.png" : ""
  )
  const [templateOverlay, setTemplateOverlay] = useState<OverlayField[]>([])
  const templateOverlayRef = useRef<OverlayField[]>([])
  const overlaySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [templateSaving, setTemplateSaving] = useState(false)

  const applyOverlayFields = useCallback((fields: OverlayField[]) => {
    templateOverlayRef.current = fields
    setTemplateOverlay(fields)
  }, [])

  const fetchMembershipTemplate = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/membership-template", { cache: "no-store" })
      if (!res.ok) return getDevMembershipTemplate()
      const json = await res.json()
      const template = json?.data?.[0] ?? json?.data
      if (template) {
        saveDevMembershipTemplate(template)
        return template
      }
    } catch {
      // ignore
    }
    return getDevMembershipTemplate()
  }, [])

  const persistMembershipTemplate = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/admin/membership-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.success) {
        throw new Error(json?.message || "Save failed")
      }
      if (json.data) saveDevMembershipTemplate(json.data)
      return json.data
    },
    []
  )

  const handleOverlayChange = useCallback(
    (fields: OverlayField[]) => {
      applyOverlayFields(fields)
    },
    [applyOverlayFields]
  )

  const handleOverlayCommit = useCallback(
    async (fields: OverlayField[]) => {
      applyOverlayFields(fields)
      if (!isMembership) return
      try {
        const current = await fetchMembershipTemplate()
        await persistMembershipTemplate({
          ...current,
          overlayFields: JSON.stringify(fields),
        })
      } catch {
        // ignore drag-time persistence errors
      }
    },
    [applyOverlayFields, fetchMembershipTemplate, isMembership, persistMembershipTemplate]
  )

  useEffect(() => {
    return () => {
      if (overlaySaveTimerRef.current) clearTimeout(overlaySaveTimerRef.current)
    }
  }, [])

  const { data: listRes, loading, error, refetch } = useApi(
    () => (isMembership ? api.getAdminMemberships() : api.getAdminCertificates()),
    { immediate: true }
  )

  const { data: templatesRes, refetch: refetchTemplates } = useApi(
    () => (isMembership ? api.getAdminMembershipTemplates() : api.getAdminCertificateTemplates()),
    { immediate: true }
  )

  const issuedList = useMemo((): IssuedRow[] => {
    const raw = listRes as any
    const list = Array.isArray(raw) ? raw : raw?.data ?? []

    if (isMembership) {
      return list.map((m: any) => {
        const userName = typeof m.user === "string" ? m.user : m.user?.name ?? ""
        const pkg = m.package
        const packageTitle = typeof pkg === "object"
          ? (isAr ? pkg?.titleAr ?? pkg?.title ?? "" : pkg?.title ?? pkg?.titleAr ?? "")
          : (pkg ?? "")
        return {
          id: m.id,
          refNo: m.membershipNo ?? m.id,
          person: userName,
          context: packageTitle,
          secondary: typeof pkg === "object" ? pkg?.level ?? "" : "",
          issuedDate: m.issuedAt ? new Date(m.issuedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US") : "",
          badge: typeof pkg === "object" ? pkg?.level ?? m.status ?? "" : (m.status ?? ""),
          verified: String(m.status ?? "").toUpperCase() === "ACTIVE" || !!m.verifiedAt,
          pdfUrl: m.pdfUrl,
        }
      })
    }

    return list.map((c: any) => {
      const userName = typeof c.user === "string" ? c.user : c.user?.name ?? ""
      const courseVal = c.course
      const courseTitle = typeof courseVal === "object" ? (courseVal?.titleAr ?? courseVal?.title ?? "") : (courseVal ?? "")
      const instructorVal = typeof courseVal === "object" ? courseVal?.instructor : null
      const instructorName = typeof instructorVal === "string" ? instructorVal : instructorVal?.name ?? ""
      return {
        id: c.id ?? c.certificateNo,
        refNo: c.certificateNo ?? c.id,
        person: c.student ?? userName,
        context: courseTitle,
        secondary: c.instructor ?? instructorName,
        issuedDate: c.issuedDate ?? (c.issuedAt ? new Date(c.issuedAt).toLocaleDateString("ar-EG") : ""),
        badge: c.grade != null ? String(c.grade) : "",
        verified: !!c.verifiedAt,
      }
    })
  }, [listRes, isMembership, isAr])

  const templatesList = useMemo(() => {
    const raw = templatesRes as any
    return Array.isArray(raw) ? raw : raw?.data ?? []
  }, [templatesRes])

  const filtered = issuedList.filter((row) =>
    row.person?.toLowerCase().includes(search.toLowerCase()) ||
    row.refNo?.toLowerCase().includes(search.toLowerCase()) ||
    row.context?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const labels = isMembership
    ? {
        title: isAr ? "إدارة شهادات العضوية" : "Membership Certificates Management",
        subtitle: isAr ? "إدارة قوالب وشهادات العضوية" : "Manage membership certificate templates and issued memberships",
        issued: isAr ? "شهادات العضوية الصادرة" : "Issued Membership Certificates",
        verified: isAr ? "شهادات عضوية موثقة" : "Verified Membership Certificates",
        templates: isAr ? "قوالب شهادات العضوية" : "Membership Certificate Templates",
        verifyTitle: isAr ? "التحقق من شهادة العضوية" : "Verify Membership Certificate",
        verifyPlaceholder: isAr ? "أدخل رقم العضوية..." : "Enter membership ID...",
        verifyOk: isAr ? "شهادة العضوية صالحة وموثقة" : "Membership certificate is valid and verified",
        verifyFail: isAr ? "لم يتم العثور على عضوية بهذا الرقم" : "No membership found with this ID",
        searchPlaceholder: isAr ? "بحث عن عضوية..." : "Search memberships...",
        emptyTitle: isAr ? "لا توجد شهادات عضوية" : "No membership certificates found",
        emptySearch: isAr ? "لا توجد نتائج تطابق بحثك. حاول تعديل الكلمات المفتاحية." : "No results match your search. Try adjusting your keywords.",
        emptyDefault: isAr ? "لم يتم إصدار أي شهادات عضوية بعد." : "No membership certificates have been issued yet.",
        colId: isAr ? "رقم العضوية" : "Membership ID",
        colPerson: isAr ? "العضو" : "Member",
        colContext: isAr ? "الباقة" : "Package",
        colSecondary: isAr ? "المستوى" : "Level",
        colBadge: isAr ? "المستوى" : "Level",
        createTemplate: isAr ? "إنشاء قالب شهادة عضوية" : "Create Membership Certificate Template",
        templateNamePh: isAr ? "مثال: شهادة عضوية" : "e.g. Membership Certificate",
        detailsTitle: isAr ? "تفاصيل شهادة العضوية" : "Membership Certificate Details",
        detailContext: isAr ? "الباقة" : "Package",
        detailSecondary: isAr ? "المستوى" : "Level",
        detailBadge: isAr ? "المستوى" : "Level",
        download: isAr ? "تحميل شهادة العضوية" : "Download Membership Certificate",
      }
    : {
        title: isAr ? "إدارة الشهادات" : "Certificates Management",
        subtitle: isAr ? "إدارة قوالب وشهادات المنصة" : "Manage certificate templates and issued certificates",
        issued: isAr ? "الشهادات الصادرة" : "Issued Certificates",
        verified: isAr ? "شهادات موثقة" : "Verified Certificates",
        templates: isAr ? "قوالب الشهادات" : "Certificate Templates",
        verifyTitle: isAr ? "التحقق من شهادة" : "Verify Certificate",
        verifyPlaceholder: isAr ? "أدخل رقم الشهادة..." : "Enter certificate ID...",
        verifyOk: isAr ? "الشهادة صالحة وموثقة" : "Certificate is valid and verified",
        verifyFail: isAr ? "لم يتم العثور على شهادة بهذا الرقم" : "No certificate found with this ID",
        searchPlaceholder: isAr ? "بحث عن شهادة..." : "Search certificates...",
        emptyTitle: isAr ? "لا توجد شهادات" : "No certificates found",
        emptySearch: isAr ? "لا توجد نتائج تطابق بحثك. حاول تعديل الكلمات المفتاحية." : "No results match your search. Try adjusting your keywords.",
        emptyDefault: isAr ? "لم يتم إصدار أي شهادات بعد." : "No certificates have been issued yet.",
        colId: isAr ? "رقم الشهادة" : "Certificate ID",
        colPerson: isAr ? "الطالب" : "Student",
        colContext: isAr ? "الدورة" : "Course",
        colSecondary: isAr ? "المدرب" : "Instructor",
        colBadge: isAr ? "التقدير" : "Grade",
        createTemplate: isAr ? "إنشاء قالب شهادة" : "Create Certificate Template",
        templateNamePh: isAr ? "مثال: شهادة إتمام" : "e.g. Completion Certificate",
        detailsTitle: isAr ? "تفاصيل الشهادة" : "Certificate Details",
        detailContext: isAr ? "الدورة" : "Course",
        detailSecondary: isAr ? "المدرب" : "Instructor",
        detailBadge: isAr ? "التقدير" : "Grade",
        download: isAr ? "تحميل الشهادة" : "Download Certificate",
      }

  const handleVerify = async () => {
    if (!verifyId) return
    setVerifying(true)
    try {
      const result = isMembership
        ? await api.verifyMembership(verifyId)
        : await api.verifyCertificate(verifyId)
      if (result.success) {
        setVerifyResult("found")
        showToast(labels.verifyOk, "success")
      } else {
        setVerifyResult("notfound")
        showToast(labels.verifyFail, "error")
      }
    } catch {
      setVerifyResult("notfound")
      showToast(labels.verifyFail, "error")
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = (row: IssuedRow) => {
    if (isMembership) {
      void downloadMembershipPdf({
        membershipId: row.id,
        membershipNo: row.refNo,
      }).catch(() => {
        window.open(getMembershipShortUrl(row.refNo), "_blank")
      })
      return
    }
    const base = typeof window !== "undefined" ? window.location.origin.replace(":3000", ":5001") : "http://localhost:5001"
    window.open(`${base}/api/certificates/${row.id}/download`, "_blank")
  }

  const openCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateName("")
    setTemplateNameAr("")
    setTemplateImage(isMembership ? "/brand/loay/poster-programming-ai.png" : "")
    setTemplateOverlay([])
    templateOverlayRef.current = []
    setShowTemplateModal(true)
  }

  const openEditTemplate = async (t: TemplateRow) => {
    const source = isMembership ? await fetchMembershipTemplate() : t
    const row = isMembership ? { ...t, ...source, id: t.id || source.id } : t
    const fields = isMembership
      ? parseMembershipOverlayFields(row.overlayFields)
      : (() => {
          try {
            return row.overlayFields ? JSON.parse(row.overlayFields) : []
          } catch {
            return []
          }
        })()

    setEditingTemplate(row)
    setTemplateName(row.name || "")
    setTemplateNameAr(row.nameAr ?? "")
    setTemplateImage(
      row.imageUrl ?? (isMembership ? "/brand/loay/poster-programming-ai.png" : "")
    )
    applyOverlayFields(fields)
    setEditSessionKey((key) => key + 1)
    setShowTemplateModal(true)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showToast(isAr ? "اسم القالب مطلوب" : "Template name required", "error")
      return
    }
    setTemplateSaving(true)
    try {
      const overlayToSave = templateOverlayRef.current
      const overlayJson = JSON.stringify(overlayToSave)
      const payload = {
        name: templateName.trim(),
        nameAr: templateNameAr.trim() || undefined,
        imageUrl: templateImage || undefined,
        overlayFields: overlayJson,
        ...(isMembership && !editingTemplate ? { isDefault: templatesList.length === 0 } : {}),
      }

      if (isMembership) {
        const saved = await persistMembershipTemplate({
          id: editingTemplate?.id || "mtpl-dev",
          ...payload,
          isDefault: true,
        })

        const savedFields = parseMembershipOverlayFields(saved?.overlayFields)
        if (JSON.stringify(savedFields) !== overlayJson) {
          throw new Error("Template positions were not persisted")
        }
      }

      let res: { success?: boolean; message?: string } = { success: true }
      if (!isMembership) {
        if (editingTemplate) {
          res = await api.updateAdminCertificateTemplate(editingTemplate.id, payload)
        } else {
          res = await api.createAdminCertificateTemplate(payload)
        }
      } else if (!editingTemplate) {
        res = await api.createAdminMembershipTemplate(payload)
      }

      if (!res?.success) {
        throw new Error(res?.message || "Save failed")
      }

      await refetchTemplates()
      setShowTemplateModal(false)
      showToast(
        editingTemplate
          ? isAr
            ? "تم تحديث القالب"
            : "Template updated"
          : isAr
            ? "تم إنشاء القالب"
            : "Template created",
        "success"
      )
    } catch {
      showToast(isAr ? "فشل الحفظ" : "Save failed", "error")
    } finally {
      setTemplateSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(isAr ? "حذف هذا القالب؟" : "Delete this template?")) return
    try {
      if (isMembership) await api.deleteAdminMembershipTemplate(id)
      else await api.deleteAdminCertificateTemplate(id)
      showToast(isAr ? "تم الحذف" : "Deleted", "success")
      refetchTemplates()
    } catch {
      showToast(isAr ? "فشل الحذف" : "Delete failed", "error")
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

  return (
    <m.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <m.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[#0F172A]">{labels.title}</h1>
        <p className="text-sm text-[#64748B] mt-1">{labels.subtitle}</p>
      </m.div>

      <m.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><Award className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{issuedList.length}</p>
          <p className="text-xs text-[#94A3B8]">{labels.issued}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669] mb-3"><CheckCircle className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{issuedList.filter((r) => r.verified).length}</p>
          <p className="text-xs text-[#94A3B8]">{labels.verified}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-3"><FileText className="w-5 h-5" /></div>
          <p className="text-2xl font-bold text-[#0F172A]">{templatesList.length}</p>
          <p className="text-xs text-[#94A3B8]">{isAr ? "القوالب المتاحة" : "Available Templates"}</p>
        </div>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0F172A]">{labels.templates}</h3>
          <Button onClick={openCreateTemplate} size="sm" className="gap-1.5 rounded-xl bg-primary">
            <Plus className="w-4 h-4" /> {isAr ? "إنشاء قالب" : "Create Template"}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templatesList.map((t: TemplateRow) => (
            <div key={t.id} className={`relative rounded-xl border-2 p-4 transition-all ${t.isDefault ? "border-primary shadow-md" : "border-[#E2E8F0]/60 hover:border-primary/30"}`}>
              <div className="h-24 rounded-lg flex items-center justify-center mb-3 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => void openEditTemplate(t)}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Award className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">{isAr ? (t.nameAr || t.name) : t.name}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-lg gap-1" onClick={() => void openEditTemplate(t)}>
                  <Edit className="w-3 h-3" /> {isAr ? "تعديل" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg text-red-500 hover:bg-red-50" onClick={() => handleDeleteTemplate(t.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {t.isDefault && (
                <span className="absolute top-2 end-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {isAr ? "افتراضي" : "Default"}
                </span>
              )}
            </div>
          ))}
        </div>
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-3">{labels.verifyTitle}</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 flex-1 max-w-md">
            <Hash className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={verifyId}
              onChange={(e) => { setVerifyId(e.target.value); setVerifyResult(null) }}
              placeholder={labels.verifyPlaceholder}
              className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
          <Button onClick={handleVerify} disabled={verifying || !verifyId} className="rounded-xl bg-primary hover:bg-primary-hover text-white gap-2">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} {isAr ? "تحقق" : "Verify"}
          </Button>
        </div>
        {verifyResult === "found" && (
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> {labels.verifyOk}
          </m.p>
        )}
        {verifyResult === "notfound" && (
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-red-500 font-semibold">
            {labels.verifyFail}
          </m.p>
        )}
      </m.div>

      <m.div variants={fadeUp} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]/60">
          <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-2 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={labels.searchPlaceholder}
              className="bg-transparent text-sm outline-none w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F9] mb-4">
              <Award className="w-7 h-7 text-[#94A3B8]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">{labels.emptyTitle}</p>
            <p className="text-xs text-[#94A3B8] text-center max-w-xs">
              {search ? labels.emptySearch : labels.emptyDefault}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]/40">
                    <th className="text-start px-5 py-3 font-semibold">{labels.colId}</th>
                    <th className="text-start px-3 py-3 font-semibold">{labels.colPerson}</th>
                    <th className="text-start px-3 py-3 font-semibold">{labels.colContext}</th>
                    <th className="text-start px-3 py-3 font-semibold">{labels.colSecondary}</th>
                    <th className="text-start px-3 py-3 font-semibold">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="text-start px-3 py-3 font-semibold">{labels.colBadge}</th>
                    <th className="text-start px-3 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row.id} className="border-t border-[#E2E8F0]/40 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-medium text-primary">{row.refNo}</td>
                      <td className="px-3 py-3 text-sm font-medium text-[#0F172A]">{row.person}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{row.context}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{row.secondary}</td>
                      <td className="px-3 py-3 text-sm text-[#64748B]">{row.issuedDate}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary">{row.badge}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewRow(row)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownload(row)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0]/40">
                <p className="text-xs text-[#94A3B8]">
                  {isAr
                    ? `عرض ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} من ${filtered.length}`
                    : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#0F172A] min-w-[60px] text-center">{currentPage} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0]/60 text-[#64748B] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </m.div>

      <AnimatePresence>
        {showTemplateModal && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowTemplateModal(false)}>
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#E2E8F0]/60 my-8">
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {editingTemplate ? (isAr ? "تعديل القالب" : "Edit Template") : labels.createTemplate}
                </h3>
                <button onClick={() => setShowTemplateModal(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">{isAr ? "اسم القالب" : "Template Name"}</label>
                    <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder={labels.templateNamePh} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">{isAr ? "الاسم بالعربية" : "Name (Arabic)"}</label>
                    <Input value={templateNameAr} onChange={(e) => setTemplateNameAr(e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} className="rounded-xl" />
                  </div>
                </div>
                <CertificateTemplateEditor
                  key={editSessionKey}
                  imageUrl={templateImage}
                  overlayFields={templateOverlay}
                  onImageChange={setTemplateImage}
                  onOverlayChange={handleOverlayChange}
                  onOverlayCommit={handleOverlayCommit}
                  isAr={isAr}
                  shortcodes={isMembership ? MEMBERSHIP_SHORTCODES : undefined}
                />
              </div>
              <div className="p-5 border-t border-[#E2E8F0]/60 flex gap-3 justify-end sticky bottom-0 bg-white z-10 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
                <Button variant="outline" onClick={() => setShowTemplateModal(false)} className="rounded-xl">{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleSaveTemplate} disabled={templateSaving} className="rounded-xl bg-primary gap-2">
                  {templateSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewRow && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewRow(null)}>
            <m.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0]/60">
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]/60">
                <h3 className="text-sm font-bold text-[#0F172A]">{labels.detailsTitle}</h3>
                <button onClick={() => setViewRow(null)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{viewRow.person}</p>
                    <p className="text-xs text-[#94A3B8] font-mono">{viewRow.refNo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{labels.detailContext}</p>
                    <p className="text-sm font-medium text-[#0F172A]">{viewRow.context}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{labels.detailSecondary}</p>
                    <p className="text-sm font-medium text-[#0F172A]">{viewRow.secondary}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{isAr ? "تاريخ الإصدار" : "Issued Date"}</p>
                    <p className="text-sm font-medium text-[#0F172A]">{viewRow.issuedDate}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{labels.detailBadge}</p>
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary">{viewRow.badge}</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{isAr ? "الحالة" : "Status"}</p>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${viewRow.verified ? "text-green-600" : "text-amber-500"}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {viewRow.verified ? (isAr ? "موثقة" : "Verified") : (isAr ? "غير موثقة" : "Not Verified")}
                  </span>
                </div>
              </div>
              <div className="p-5 pt-0">
                <Button onClick={() => handleDownload(viewRow)} className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white gap-2">
                  <Download className="w-4 h-4" /> {labels.download}
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
