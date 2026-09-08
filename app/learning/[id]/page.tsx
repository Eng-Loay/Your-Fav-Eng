"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { m, AnimatePresence } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import { safeStr } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  CheckCircle2,
  FileText,
  Download,
  StickyNote,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  Trophy,
  Sparkles,
  ChevronDown,
  BarChart3,
  MessageSquare,
  Bookmark,
  Share2,
  ThumbsUp,
  Zap,
  ClipboardCheck,
  Gamepad2,
  NotebookPen,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import CustomVideoPlayer from "@/components/ui/custom-video-player"
import PDFViewer from "@/components/ui/pdf-viewer"
import { LessonQuiz } from "@/components/learning/lesson-quiz"
import VideoWatermark from "@/components/learning/video-watermark"
import AiTutorPanel from "@/components/learning/ai-tutor-panel"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, "") || "http://localhost:5001"

function formatDuration(seconds: number): string {
  const m = Math.floor((seconds ?? 0) / 60)
  const s = Math.floor((seconds ?? 0) % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getFullUrl(path: string | null | undefined): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  // Use same-origin for iframe/embed (PDF, video) so Next.js proxy works - avoids "localhost refused to connect"
  if (typeof window !== "undefined") {
    return window.location.origin + normalized
  }
  return `${UPLOADS_BASE}${normalized}`
}

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(url) ? url : null
}

function LessonVideoPlayer({
  videoUrl,
  title,
  onEnded,
  studentPhone,
  watermarkEnabled,
}: {
  videoUrl: string | null | undefined
  title: string
  onEnded?: () => void
  studentPhone?: string | null
  watermarkEnabled?: boolean
}) {
  const { locale } = useI18n()
  const ytId = extractYouTubeId(videoUrl)
  const streamUrl = videoUrl && !ytId ? getFullUrl(videoUrl) : null
  const showWatermark = watermarkEnabled && studentPhone

  const wrapWithWatermark = (el: React.ReactNode) => (
    <div className="relative aspect-video w-full overflow-hidden">
      {el}
      <VideoWatermark phone={studentPhone} enabled={!!showWatermark} />
    </div>
  )

  if (ytId) {
    return wrapWithWatermark(<CustomVideoPlayer videoId={ytId} title={title} onEnded={onEnded} />)
  }
  if (streamUrl) {
    return wrapWithWatermark(
      <div className="relative aspect-video w-full bg-black">
        <video
          className="h-full w-full object-contain"
          src={streamUrl}
          controls
          onEnded={onEnded}
          playsInline
        >
          {locale === "ar" ? "المتصفح لا يدعم الفيديو" : "Your browser does not support the video tag."}
        </video>
      </div>
    )
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-[#1a1a2e]">
      <p className="text-white/60">{locale === "ar" ? "لا يوجد فيديو لهذا الدرس" : "No video for this lesson"}</p>
    </div>
  )
}

function ProgressRing({ value, size = 40, strokeWidth = 3.5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(37,99,235,0.15)" strokeWidth={strokeWidth} />
      <m.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function LearningPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isPurchased, isLoggedIn, user } = useStore()
  const { locale, dir, t } = useI18n()
  const isRTL = dir === "rtl"

  const { data: apiCourse } = useApi(() => api.getCourse(id as string), { deps: [id], immediate: !!id })
  const purchased = id ? isPurchased(id as string) : false
  const { data: apiCurriculum } = useApi(() => api.getCourseCurriculum(id as string), { deps: [id, isLoggedIn, purchased], immediate: !!id })
  const { data: progressData } = useApi(() => api.getCourseProgress(id as string), { deps: [id], immediate: !!id })
  const { data: watermarkStatus } = useApi(() => api.getVideoWatermarkStatus(), { immediate: isLoggedIn })

  const course = useMemo(() => {
    if (!apiCourse || typeof apiCourse !== "object") return null
    const c = apiCourse as Record<string, unknown>
    const inst = c.instructor
    const name = typeof inst === "string" ? inst : (inst && typeof inst === "object" && "name" in inst && typeof (inst as { name?: string }).name === "string" ? (inst as { name: string }).name : "")
    return {
      id: String(c.id ?? id),
      titleAr: (c.titleAr as string) ?? (c.title as string) ?? "",
      titleEn: (c.titleEn as string) ?? (c.title as string) ?? "",
      descriptionAr: (c.descriptionAr as string) ?? (c.description as string) ?? "",
      descriptionEn: (c.descriptionEn as string) ?? (c.description as string) ?? "",
      instructorAr: name,
      instructorEn: name,
      thumbnail: (c.thumbnail as string) ?? "/course-1.png",
      rating: Number(c.averageRating ?? c.rating ?? 4.5),
      students: Number(c.totalStudents ?? c.students ?? 0),
    }
  }, [apiCourse, id])

  const curriculum = useMemo(() => {
    type ApiLesson = {
      id?: string
      title?: string
      titleAr?: string
      titleEn?: string
      type?: string
      duration?: number
      isFree?: boolean
      isPreview?: boolean
      videoUrl?: string
      content?: string
      pdfUrl?: string
      description?: string
      attachments?: Array<{ id?: string; name?: string; url?: string; type?: string; size?: number }>
    }
    type ApiChapter = {
      id?: string
      title?: string
      titleAr?: string
      titleEn?: string
      lessons?: ApiLesson[]
      children?: Array<{ title?: string; titleAr?: string; titleEn?: string; lessons?: ApiLesson[] }>
    }
    const raw = apiCurriculum as { chapters?: ApiChapter[] } | null
    const mapLesson = (l: ApiLesson) => ({
      id: (l.id as string) || "",
      titleAr: (l.titleAr as string) || (l.title as string) || "",
      titleEn: (l.titleEn as string) || (l.title as string) || "",
      type: (l.type as string) || "VIDEO",
      duration: formatDuration(Number(l.duration ?? 0)),
      durationSeconds: Number(l.duration ?? 0),
      free: (l.isFree ?? false) || (l.isPreview ?? false),
      videoUrl: l.videoUrl ?? null,
      content: l.content ?? l.description ?? "",
      pdfUrl: l.pdfUrl ?? null,
      attachments: (l.attachments || []).map((a) => ({
        id: a.id ?? "",
        name: a.name ?? "",
        url: getFullUrl(a.url),
        type: a.type ?? "file",
        size: a.size ?? 0,
      })),
    })
    if (!raw?.chapters || !Array.isArray(raw.chapters)) return []
    return raw.chapters.map((s) => ({
      id: s.id,
      titleAr: s.titleAr || s.title || "",
      titleEn: s.titleEn || s.title || "",
      lessons: (s.lessons || []).map(mapLesson),
      subsections: (s.children || []).map((sub) => ({
        titleAr: sub.titleAr || sub.title || "",
        titleEn: sub.titleEn || sub.title || "",
        lessons: (sub.lessons || []).map(mapLesson),
      })),
    }))
  }, [apiCurriculum])

  const allLessons = useMemo(
    () => curriculum.flatMap((section) => [...section.lessons, ...section.subsections.flatMap((sub) => sub.lessons)]),
    [curriculum]
  )

  useEffect(() => {
    if (!isLoggedIn) { router.push("/login"); return }
    if (id && !isPurchased(id as string)) { router.push(`/courses/${id}`); return }
  }, [isLoggedIn, isPurchased, id, router])

  const [currentLessonId, setCurrentLessonId] = useState("")
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    const prog = progressData as { progress?: Array<{ lessonId?: string; completed?: boolean }> } | null
    if (prog?.progress && Array.isArray(prog.progress)) {
      setCompletedLessons(new Set(prog.progress.filter((p) => p.completed && p.lessonId).map((p) => p.lessonId!)))
    }
  }, [progressData])

  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) setCurrentLessonId(allLessons[0].id)
  }, [allLessons, currentLessonId])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteSaveStatus, setNoteSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const { data: notesData } = useApi(
    () => api.getLessonNotes(currentLessonId),
    { deps: [currentLessonId] }
  )
  useEffect(() => {
    if (notesData && typeof notesData === "object" && "content" in notesData) {
      setNotes((prev) => ({ ...prev, [currentLessonId]: (notesData as { content?: string }).content || "" }))
    }
  }, [notesData, currentLessonId])

  const { data: quizData } = useApi(
    () => api.getLessonQuiz(currentLessonId),
    { deps: [currentLessonId] }
  )
  const quizQuestions = useMemo(() => {
    if (quizData && typeof quizData === "object" && "questions" in quizData) {
      const q = (quizData as { questions?: Array<{ id?: string; type?: string; questionAr?: string; questionEn?: string; options?: Array<{ id?: string; textAr?: string; textEn?: string; isCorrect?: boolean }> }> }).questions
      if (q && Array.isArray(q)) {
        return q.map((qq) => ({
          id: qq.id || "",
          type: (qq.type || "mcq") as "mcq" | "true_false" | "mcq_image" | "image_select",
          questionAr: qq.questionAr || "",
          questionEn: qq.questionEn || "",
          options: (qq.options || []).map((o) => ({
            id: o.id || "",
            textAr: o.textAr || "",
            textEn: o.textEn || "",
            isCorrect: o.isCorrect ?? false,
          })),
        }))
      }
    }
    return []
  }, [quizData, currentLessonId])
  const [activeTab, setActiveTab] = useState("description")
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  useEffect(() => {
    if (curriculum.length > 0) setExpandedSections(new Set(curriculum.map((_, i) => i)))
  }, [curriculum])

  const progressValue = useMemo(
    () => (allLessons.length > 0 ? Math.round((completedLessons.size / allLessons.length) * 100) : 0),
    [completedLessons, allLessons.length]
  )

  const sectionProgress = useMemo(() => {
    return curriculum.map((section) => {
      const sectionLessons = [...section.lessons, ...section.subsections.flatMap((sub) => sub.lessons)]
      const completed = sectionLessons.filter((l) => completedLessons.has(l.id)).length
      return { completed, total: sectionLessons.length, pct: Math.round((completed / sectionLessons.length) * 100) }
    })
  }, [completedLessons, curriculum])

  const goToLesson = useCallback((lessonId: string) => {
    setCurrentLessonId(lessonId)
    setNoteSaveStatus("idle")
  }, [])

  const goNext = () => {
    if (currentIndex < allLessons.length - 1) goToLesson(allLessons[currentIndex + 1].id)
  }
  const goPrev = () => {
    if (currentIndex > 0) goToLesson(allLessons[currentIndex - 1].id)
  }

  const toggleComplete = useCallback((lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
        api.completeLesson(lessonId).catch(() => {})
      }
      return next
    })
  }, [])

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const renderLessonItem = (lesson: (typeof allLessons)[number]) => {
    const isActive = lesson.id === currentLessonId
    const isComplete = completedLessons.has(lesson.id)
    return (
      <li key={lesson.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => goToLesson(lesson.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToLesson(lesson.id) } }}
          className={cn(
            "group flex w-full cursor-pointer items-center gap-3 py-2.5 text-start transition-all",
            isRTL ? "pe-4 ps-10" : "ps-10 pe-4",
            isActive
              ? "bg-primary/[0.06] border-e-2 border-primary"
              : "hover:bg-[#F8FAFC]"
          )}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); toggleComplete(lesson.id) }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); toggleComplete(lesson.id) } }}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              isComplete
                ? "border-emerald-500 bg-emerald-500 text-white"
                : isActive
                  ? "border-primary bg-primary/10"
                  : "border-[#D1D5DB] group-hover:border-[#94A3B8]"
            )}
          >
            {isComplete && <CheckCircle className="h-3 w-3" />}
            {isActive && !isComplete && <Play className="h-2.5 w-2.5 text-primary" fill="currentColor" />}
          </span>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "truncate text-xs transition-colors",
              isActive ? "font-bold text-primary" : isComplete ? "text-[#94A3B8] line-through" : "text-[#475569] group-hover:text-[#0F172A]"
            )}>
              {locale === "ar" ? lesson.titleAr : lesson.titleEn}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Clock className="h-2.5 w-2.5 text-[#CBD5E1]" />
              <span className="text-[10px] text-[#CBD5E1]">{lesson.duration}</span>
            </div>
          </div>

          {lesson.free && !isActive && (
            <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600">
              {locale === "ar" ? "مجاني" : "FREE"}
            </span>
          )}
        </div>
      </li>
    )
  }

  const handleSaveNote = useCallback(async () => {
    setNoteSaveStatus("saving")
    try {
      const content = notes[currentLessonId] ?? ""
      const res = await api.saveLessonNotes(currentLessonId, content)
      if (res.success) {
        setNoteSaveStatus("saved")
      } else {
        setNoteSaveStatus("idle")
      }
    } catch {
      setNoteSaveStatus("idle")
    }
  }, [notes, currentLessonId])

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft
  const NextIcon = isRTL ? ChevronLeft : ChevronRight
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId)
  const currentLesson = allLessons[currentIndex] ?? allLessons[0]
  if (!currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-[#64748B]">{locale === "ar" ? "لا توجد دروس" : "No lessons available"}</p>
      </div>
    )
  }

  const currentSectionName = (() => {
    const sec = curriculum.find(
      (s) => s.lessons.some((l) => l.id === currentLessonId) || s.subsections.some((sub) => sub.lessons.some((l) => l.id === currentLessonId))
    )
    return sec ? (locale === "ar" ? sec.titleAr : sec.titleEn) : ""
  })()

  const courseTitle = locale === "ar" ? course.titleAr : course.titleEn
  const lessonTitle = locale === "ar" ? currentLesson.titleAr : currentLesson.titleEn

  return (
    <div className="flex h-screen flex-col bg-[#F8FAFC]" dir={dir}>
      {/* Top Bar */}
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[#E2E8F0] bg-white px-3 shadow-sm sm:h-16 sm:gap-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl text-[#64748B] hover:bg-primary/5 hover:text-primary lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link
          href={`/courses/${id}`}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-primary/5 hover:text-primary"
        >
          <BackIcon className="h-4 w-4" />
          <span className="hidden max-w-[150px] truncate sm:inline lg:max-w-[220px]">{courseTitle}</span>
        </Link>

        <div className="mx-2 hidden h-5 w-px bg-[#E2E8F0] sm:block" />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
              <m.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/90"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="relative flex shrink-0 items-center justify-center">
            <ProgressRing value={progressValue} size={36} strokeWidth={3} />
            <span className="absolute text-[9px] font-bold text-primary">{progressValue}%</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-lg px-2 text-xs text-[#64748B] hover:bg-primary/5 hover:text-primary"
            disabled={currentIndex === 0}
            onClick={goPrev}
          >
            <PrevIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t("learning.prevLesson")}</span>
          </Button>
          <span className="mx-1 text-[10px] font-semibold text-[#94A3B8]">
            {currentIndex + 1}/{allLessons.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-lg px-2 text-xs text-[#64748B] hover:bg-primary/5 hover:text-primary"
            disabled={currentIndex === allLessons.length - 1}
            onClick={goNext}
          >
            <span className="hidden md:inline">{t("learning.nextLesson")}</span>
            <NextIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Main layout: sidebar uses CSS logical properties via dir, no flex-row-reverse needed */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar - positioned using logical properties via dir on root */}
        <AnimatePresence>
          {sidebarOpen && (
            <m.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "min(340px, 85vw)", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-y-0 z-[40] flex w-[340px] max-w-[85vw] flex-col border-e border-[#E2E8F0] bg-white shadow-xl lg:relative lg:z-auto lg:max-w-none lg:shadow-none"
              style={{ [isRTL ? "right" : "left"]: 0 }}
            >
              {/* Sidebar Header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/90">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#0F172A]">{t("learning.courseContent")}</h2>
                    <p className="text-[10px] text-[#94A3B8]">{completedLessons.size}/{allLessons.length} {locale === "ar" ? "مكتمل" : "completed"}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-primary/5 hover:text-primary lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Course Mini Card */}
              <div className="border-b border-[#E2E8F0] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={course.thumbnail} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#0F172A]">{courseTitle}</p>
                    <p className="mt-0.5 text-[10px] text-[#94A3B8]">{safeStr(locale === "ar" ? course.instructorAr : course.instructorEn)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                    <m.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/90"
                      animate={{ width: `${progressValue}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-primary">{progressValue}%</span>
                </div>
              </div>

              {/* Sections List */}
              <ScrollArea className="flex-1">
                <div className="py-1">
                  {curriculum.map((section, sIdx) => {
                    const isExpanded = expandedSections.has(sIdx)
                    const sp = sectionProgress[sIdx]
                    const sectionHasActive =
                      section.lessons.some((l) => l.id === currentLessonId) ||
                      section.subsections.some((sub) => sub.lessons.some((l) => l.id === currentLessonId))

                    return (
                      <div key={sIdx}>
                        <button
                          onClick={() => toggleSection(sIdx)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-start transition-colors",
                            sectionHasActive ? "bg-primary/[0.04]" : "hover:bg-[#F1F5F9]"
                          )}
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                            sp.pct === 100
                              ? "bg-emerald-100 text-emerald-600"
                              : sectionHasActive
                                ? "bg-primary/10 text-primary"
                                : "bg-[#F1F5F9] text-[#94A3B8]"
                          )}>
                            {sp.pct === 100 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{sIdx + 1}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs font-semibold truncate", sectionHasActive ? "text-[#0F172A]" : "text-[#64748B]")}>
                              {locale === "ar" ? section.titleAr : section.titleEn}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1 w-14 overflow-hidden rounded-full bg-[#E2E8F0]">
                                <div
                                  className={cn("h-full rounded-full transition-all", sp.pct === 100 ? "bg-emerald-500" : "bg-primary")}
                                  style={{ width: `${sp.pct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-[#94A3B8]">{sp.completed}/{sp.total}</span>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 shrink-0 text-[#94A3B8] transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </button>
                        {section.id && (
                          <Link
                            href={`/learning/${id}/leaderboard/${section.id}`}
                            className="mx-4 -mt-1 mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-amber-600 hover:text-amber-700"
                          >
                            <Trophy className="h-3 w-3" />
                            {locale === "ar" ? "الترتيب العام" : "Overall leaderboard"}
                          </Link>
                        )}

                        <AnimatePresence>
                          {isExpanded && (
                            <m.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <ul className="pb-1">
                                {section.lessons.map(renderLessonItem)}
                              </ul>
                              {section.subsections.map((sub, subIdx) => (
                                <div key={subIdx}>
                                  <p className={cn(
                                    "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide",
                                    isRTL ? "pe-4 ps-10" : "ps-10 pe-4"
                                  )}>
                                    {locale === "ar" ? sub.titleAr : sub.titleEn}
                                  </p>
                                  <ul className="pb-1">
                                    {sub.lessons.map(renderLessonItem)}
                                  </ul>
                                </div>
                              ))}
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {progressValue >= 50 && (
                <div className="border-t border-[#E2E8F0] p-4">
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-3 py-2.5">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-700">{locale === "ar" ? "أنت في منتصف الطريق!" : "Halfway there!"}</p>
                      <p className="text-[9px] text-amber-600/60">{locale === "ar" ? "استمر بالتعلم" : "Keep going!"}</p>
                    </div>
                  </div>
                </div>
              )}
            </m.aside>
          )}
        </AnimatePresence>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[35] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-[#F8FAFC]">
          {currentLesson.type === "QUIZ" ? (
            /* Quiz Card - no video, show start button */
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500">
                    <ClipboardCheck className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-[#0F172A]">{lessonTitle}</h2>
                  <p className="mb-6 text-sm text-[#64748B]">
                    {locale === "ar"
                      ? "هذا الدرس يحتوي على اختبار. اضغط ابدأ للإجابة على الأسئلة."
                      : "This lesson contains a quiz. Click Start to answer the questions."}
                  </p>
                  <p className="mb-6 text-xs text-[#94A3B8]">
                    {quizQuestions.length} {locale === "ar" ? "أسئلة" : "questions"}
                  </p>
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-primary px-8 font-bold hover:bg-primary-hover"
                    onClick={() => router.push(`/learning/${id}/quiz/${currentLessonId}`)}
                  >
                    {locale === "ar" ? "ابدأ الاختبار" : "Start Quiz"}
                  </Button>
                </div>
              </m.div>
            </div>
          ) : currentLesson.type === "GAME" ? (
            /* Live Game Card - no video, show join button */
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500">
                    <Gamepad2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-[#0F172A]">{lessonTitle}</h2>
                  <p className="mb-6 text-sm text-[#64748B]">
                    {locale === "ar"
                      ? "لعبة تنافسية حية — انضم وانتظر المعلم يبدأ اللعبة للجميع"
                      : "A live competitive game — join and wait for the teacher to start it for everyone."}
                  </p>
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-8 font-bold text-white hover:opacity-90"
                    onClick={() => router.push(`/learning/${id}/game/${currentLessonId}`)}
                  >
                    <Gamepad2 className="h-4 w-4" />
                    {locale === "ar" ? "انضم للعبة" : "Join Game"}
                  </Button>
                </div>
              </m.div>
            </div>
          ) : currentLesson.type === "ASSIGNMENT" ? (
            /* Assignment Card - no video, link to student assignments page */
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500">
                    <NotebookPen className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-[#0F172A]">{lessonTitle}</h2>
                  <p className="mb-6 text-sm text-[#64748B]">
                    {locale === "ar"
                      ? "هذا الدرس يحتوي على واجب. اذهب لصفحة الواجبات لتسليمه."
                      : "This lesson has a homework assignment. Go to the assignments page to submit it."}
                  </p>
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 font-bold text-white hover:opacity-90"
                    onClick={() => router.push(`/dashboard/assignments`)}
                  >
                    <NotebookPen className="h-4 w-4" />
                    {locale === "ar" ? "عرض الواجب" : "View Assignment"}
                  </Button>
                </div>
              </m.div>
            </div>
          ) : currentLesson.type === "PDF" && currentLesson.pdfUrl ? (
            /* PDF Lesson - show PDF preview */
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
              <PDFViewer
                src={getFullUrl(currentLesson.pdfUrl)}
                title={lessonTitle}
              />
            </div>
          ) : (
            /* Video Player */
            <div className="relative w-full bg-[#0a0a0a]">
              <div className="mx-auto max-w-6xl">
                <LessonVideoPlayer
                  videoUrl={currentLesson.videoUrl}
                  title={lessonTitle}
                  onEnded={() => {
                    toggleComplete(currentLessonId)
                    goNext()
                  }}
                  studentPhone={user?.phone || user?.email || (user?.id ? `#${user.id.slice(-6)}` : "")}
                  watermarkEnabled={watermarkStatus?.enabled === true}
                />
              </div>
            </div>
          )}

          {/* Lesson Info Strip */}
          <div className="border-b border-[#E2E8F0] bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {currentSectionName}
                  </span>
                  <span className="text-[10px] text-[#CBD5E1]">•</span>
                  <span className="text-[10px] font-medium text-[#94A3B8]">
                    {locale === "ar" ? `الدرس ${currentIndex + 1} من ${allLessons.length}` : `Lesson ${currentIndex + 1} of ${allLessons.length}`}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-[#0F172A] sm:text-xl">{lessonTitle}</h1>
              </div>

              <div className="flex items-center gap-2">
                <m.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all",
                    isLiked ? "border-primary bg-primary/10 text-primary" : "border-[#E2E8F0] text-[#94A3B8] hover:border-primary/30 hover:text-primary"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                </m.button>
                <m.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all",
                    isBookmarked ? "border-amber-400 bg-amber-50 text-amber-500" : "border-[#E2E8F0] text-[#94A3B8] hover:border-amber-300 hover:text-amber-500"
                  )}
                >
                  <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
                </m.button>
                <Button
                  size="sm"
                  onClick={() => toggleComplete(currentLessonId)}
                  className={cn(
                    "h-10 gap-2 rounded-xl px-5 text-xs font-bold transition-all",
                    completedLessons.has(currentLessonId)
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                      : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25"
                  )}
                >
                  {completedLessons.has(currentLessonId) ? (
                    <><CheckCircle2 className="h-4 w-4" />{t("learning.completed")}</>
                  ) : (
                    <><Zap className="h-4 w-4" />{t("learning.complete")}</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
              <TabsList className="mb-6 w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-[#F1F5F9] p-1.5">
                <TabsTrigger
                  value="description"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("learning.description")}</span>
                  <span className="sm:hidden">{locale === "ar" ? "الوصف" : "Info"}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="materials"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{locale === "ar" ? "المواد التعليمية" : "Materials"}</span>
                  <span className="sm:hidden">PDF</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("learning.attachments")}</span>
                  <span className="sm:hidden">{locale === "ar" ? "ملفات" : "Files"}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("learning.notes")}</span>
                  <span className="sm:hidden">{locale === "ar" ? "ملاحظات" : "Notes"}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="quiz"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("learning.quiz")}</span>
                  <span className="sm:hidden">{locale === "ar" ? "اختبار" : "Quiz"}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-tutor"
                  className="gap-2 rounded-xl text-xs font-semibold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{locale === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-0">
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      {locale === "ar" ? "عن هذا الدرس" : "About This Lesson"}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#64748B] whitespace-pre-wrap">
                      {(currentLesson.type !== "QUIZ" && currentLesson.content) || (locale === "ar" ? course.descriptionAr : course.descriptionEn) || (locale === "ar" ? "لا يوجد وصف" : "No description available")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: Clock, label: locale === "ar" ? "المدة" : "Duration", value: currentLesson.duration, color: "from-primary to-primary/90" },
                      { icon: Layers, label: locale === "ar" ? "القسم" : "Section", value: currentSectionName, color: "from-[#8B5CF6] to-[#A78BFA]" },
                      { icon: BarChart3, label: t("learning.progress"), value: `${progressValue}%`, color: "from-[#06B6D4] to-[#22D3EE]" },
                      { icon: Trophy, label: locale === "ar" ? "مكتمل" : "Done", value: `${completedLessons.size}/${allLessons.length}`, color: "from-[#F59E0B] to-[#FBBF24]" },
                    ].map((stat, i) => (
                      <m.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-md"
                      >
                        <div className={cn("mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", stat.color)}>
                          <stat.icon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-[10px] font-medium text-[#94A3B8]">{stat.label}</p>
                        <p className="mt-0.5 truncate text-sm font-bold text-[#0F172A]">{stat.value}</p>
                      </m.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition-all",
                        isBookmarked
                          ? "border-amber-300 bg-amber-50 text-amber-600"
                          : "border-[#E2E8F0] text-[#64748B] hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={isBookmarked ? "currentColor" : "none"} />
                      {locale === "ar" ? "حفظ الدرس" : "Bookmark"}
                    </button>
                    <button className="flex items-center gap-2 rounded-xl border-2 border-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#64748B] transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary">
                      <Share2 className="h-3.5 w-3.5" />
                      {locale === "ar" ? "مشاركة" : "Share"}
                    </button>
                  </div>
                </m.div>
              </TabsContent>

              <TabsContent value="materials" className="mt-0">
                <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  {currentLesson.pdfUrl ? (
                    <PDFViewer
                      src={getFullUrl(currentLesson.pdfUrl)}
                      title={locale === "ar" ? "المادة التعليمية للدورة" : "Course Study Material"}
                    />
                  ) : (
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
                      <p className="text-[#94A3B8]">{locale === "ar" ? "لا توجد مواد PDF لهذا الدرس" : "No PDF materials for this lesson"}</p>
                    </div>
                  )}
                </m.div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-0">
                <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
                    currentLesson.attachments.map((file, idx) => {
                      const ext = (file.name?.split(".").pop() || "FILE").toUpperCase().slice(0, 4)
                      const sizeStr = file.size ? (file.size >= 1024 ? `${(file.size / 1024).toFixed(1)} MB` : `${file.size.toFixed(0)} KB`) : ""
                      const colorMap: Record<string, string> = {
                        PDF: "from-[#EF4444] to-[#F87171]",
                        ZIP: "from-[#F59E0B] to-[#FBBF24]",
                        DOC: "from-primary to-primary/90",
                        DOCX: "from-primary to-primary/90",
                      }
                      const color = colorMap[ext] || "from-[#06B6D4] to-[#22D3EE]"
                      return (
                        <m.a
                          key={file.id || idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-primary/20 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", color)}>
                              <span className="text-[9px] font-black text-white">{ext}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0F172A]">{file.name}</p>
                              {sizeStr && <p className="text-[11px] text-[#94A3B8]">{sizeStr}</p>}
                            </div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#E2E8F0] text-[#94A3B8] transition-all group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
                            <Download className="h-4 w-4" />
                          </div>
                        </m.a>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
                      <p className="text-[#94A3B8]">{locale === "ar" ? "لا توجد مرفقات لهذا الدرس" : "No attachments for this lesson"}</p>
                    </div>
                  )}
                </m.div>
              </TabsContent>

              <TabsContent value="quiz" className="mt-0">
                <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <LessonQuiz
                    questions={quizQuestions}
                    locale={locale}
                    dir={dir}
                    onSubmitAnswer={(questionId, answer) => api.submitQuizAnswer(currentLessonId, questionId, answer).catch(() => {})}
                  />
                </m.div>
              </TabsContent>

              <TabsContent value="ai-tutor" className="mt-0">
                <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <AiTutorPanel lessonId={currentLessonId} />
                </m.div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-[#0F172A]">{locale === "ar" ? "ملاحظاتك على هذا الدرس" : "Your Notes for This Lesson"}</h3>
                    </div>
                    <Textarea
                      placeholder={t("learning.addNote")}
                      value={notes[currentLessonId] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [currentLessonId]: e.target.value }))
                      }
                      className="min-h-[200px] resize-none rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#CBD5E1]"
                      dir={dir}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs">
                        {noteSaveStatus === "saving" && <span className="text-primary font-medium">{t("learning.savingNote")}</span>}
                        {noteSaveStatus === "saved" && <span className="text-emerald-500 font-medium">{t("learning.noteSaved")}</span>}
                      </p>
                      <Button
                        onClick={handleSaveNote}
                        size="sm"
                        disabled={noteSaveStatus === "saving"}
                        className="h-10 gap-2 rounded-xl bg-primary px-5 text-xs font-bold hover:bg-primary-hover shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {noteSaveStatus === "saving" ? t("learning.savingNote") : noteSaveStatus === "saved" ? t("learning.noteSaved") : t("learning.saveNote")}
                      </Button>
                    </div>
                  </div>
                </m.div>
              </TabsContent>
            </Tabs>

            {/* Bottom Navigation */}
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#E2E8F0] pb-8 pt-6">
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-2 border-[#E2E8F0] text-[#64748B] hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                disabled={currentIndex === 0}
                onClick={goPrev}
              >
                <PrevIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t("learning.prevLesson")}</span>
              </Button>

              {currentIndex < allLessons.length - 1 && (
                <div className="hidden text-center sm:block">
                  <p className="text-[10px] font-medium text-[#94A3B8]">{locale === "ar" ? "الدرس التالي" : "Up Next"}</p>
                  <p className="mt-0.5 max-w-[200px] truncate text-xs font-semibold text-[#64748B]">
                    {locale === "ar" ? allLessons[currentIndex + 1].titleAr : allLessons[currentIndex + 1].titleEn}
                  </p>
                </div>
              )}

              <Button
                className="gap-2 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20"
                disabled={currentIndex === allLessons.length - 1}
                onClick={goNext}
              >
                <span className="hidden sm:inline">{t("learning.nextLesson")}</span>
                <NextIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
