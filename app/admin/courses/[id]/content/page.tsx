"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { m, AnimatePresence, Reorder } from "framer-motion"
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  GripVertical,
  PlayCircle,
  FileText,
  ClipboardList,
  Trash2,
  Edit,
  Video,
  Upload,
  Link2,
  Youtube,
  Paperclip,
  Loader2,
  FolderPlus,
  MoreHorizontal,
  Eye,
  EyeOff,
  X,
  Save,
  Check,
  BookOpen,
  Gamepad2,
  Play,
  Trophy,
  NotebookPen,
  Maximize2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useApi, api } from "@/hooks/use-api"
import { useStore } from "@/lib/store"
import QuizBuilder from "@/components/admin/courses/quiz-builder"
import GameBuilder, { type GameQuestion, type GameSettings } from "@/components/admin/courses/game-builder"
import LessonPreviewBody from "@/components/admin/courses/lesson-preview"
import SectionLeaderboard from "@/components/games/section-leaderboard"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isSavedId(id: string) {
  return UUID_REGEX.test(id)
}

interface Attachment {
  id?: string
  name: string
  type: string
  url: string
}

interface Lesson {
  id: string
  title: string
  description: string
  type: "video" | "text" | "quiz" | "pdf" | "live" | "game" | "assignment"
  videoSource: string
  videoType: "upload" | "youtube" | "url"
  content: string
  duration: number
  attachments: Attachment[]
  isPublished: boolean
  isFree: boolean
  price: number
  meetingProvider?: string
  meetingUrl?: string
  scheduledAt?: string
}

interface Subsection {
  id: string
  title: string
  isExpanded: boolean
  lessons: Lesson[]
}

interface Section {
  id: string
  title: string
  isExpanded: boolean
  lessons: Lesson[]
  subsections: Subsection[]
}

function QuestionBankPickerModal({
  data,
  onClose,
  onSelect,
}: {
  data: unknown
  onClose: () => void
  onSelect: (items: Array<{ id: string; question: string; questionAr?: string; options?: string; correctAnswer?: string; type?: string }>) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data
  const items = (list ?? []) as Array<{ id: string; question: string; questionAr?: string; options?: string; correctAnswer?: string; type?: string }>

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    const sel = items.filter((i) => selected.has(i.id))
    onSelect(sel)
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">بنك الأسئلة</h3>
            <p className="text-xs text-slate-500">اختر أسئلة لإضافة اختبار من البنك</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto flex-1">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">لا توجد أسئلة في البنك بعد</p>
            <p className="text-xs text-slate-400 mt-1">أضف أسئلة من صفحة بنك الأسئلة أولاً</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                  selected.has(item.id) ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${selected.has(item.id) ? "border-violet-500 bg-violet-500" : "border-slate-300"}`}>
                  {selected.has(item.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-800 line-clamp-2">{item.questionAr || item.question}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="p-5 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm text-slate-500">{selected.size} أسئلة محددة</span>
          <Button onClick={handleAdd} disabled={selected.size === 0} className="rounded-xl bg-violet-600 hover:bg-violet-700">
            إضافة كاختبار
          </Button>
        </div>
      )}
    </m.div>
  )
}

const emptyLesson = (): Lesson => ({
  id: generateId(),
  title: "",
  description: "",
  type: "video",
  videoSource: "",
  videoType: "youtube",
  content: "",
  duration: 0,
  attachments: [],
  isPublished: true,
  isFree: false,
  price: 0,
})

const emptySubsection = (index: number): Subsection => ({
  id: generateId(),
  title: `قسم فرعي ${index}`,
  isExpanded: true,
  lessons: [],
})

const typeMapFromApi: Record<string, Lesson["type"]> = {
  VIDEO: "video",
  TEXT: "text",
  QUIZ: "quiz",
  PDF: "pdf",
  LIVE_SESSION: "live",
  GAME: "game",
  ASSIGNMENT: "assignment",
}

function mapApiLesson(l: any): Lesson {
  return {
    id: l.id,
    title: l.titleAr ?? l.title ?? "",
    description: l.description ?? "",
    type: typeMapFromApi[l.type] ?? "video",
    videoSource: l.type === "PDF" ? (l.pdfUrl ?? "") : (l.videoUrl ?? ""),
    videoType: "youtube" as const,
    content: l.content ?? "",
    duration: l.duration ?? 0,
    meetingProvider: l.meetingProvider,
    meetingUrl: l.meetingUrl,
    scheduledAt: l.scheduledAt ? new Date(l.scheduledAt).toISOString().slice(0, 16) : undefined,
    attachments: (l.attachments ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      type: a.type || "OTHER",
    })),
    isPublished: true,
    isFree: l.isFree ?? false,
    price: 0,
  }
}

function mapApiChapter(ch: any): Section {
  return {
    id: ch.id,
    title: ch.titleAr ?? ch.title ?? "",
    isExpanded: true,
    lessons: (ch.lessons ?? []).map(mapApiLesson),
    subsections: (ch.children ?? []).map((sub: any) => ({
      id: sub.id,
      title: sub.titleAr ?? sub.title ?? "",
      isExpanded: true,
      lessons: (sub.lessons ?? []).map(mapApiLesson),
    })),
  }
}

export default function ContentBuilderPage() {
  const params = useParams()
  const courseId = params.id as string
  const { showToast } = useStore()

  const { data: courseRes, loading: courseLoading } = useApi(() => api.getCourse(courseId))
  const course = courseRes as any
  const { data: questionBankData, refetch: refetchQuestionBank } = useApi(() => api.getAdminQuestionBank(), { immediate: false })

  const [sections, setSections] = useState<Section[]>([
    {
      id: generateId(),
      title: "المقدمة",
      isExpanded: true,
      lessons: [
        {
          ...emptyLesson(),
          title: "ترحيب بالدورة",
          type: "video",
          videoType: "youtube",
          isPublished: true,
        },
      ],
      subsections: [],
    },
  ])
  const [contentLoaded, setContentLoaded] = useState(false)

  useEffect(() => {
    if (!courseId || courseLoading) return
    const loadContent = async () => {
      const res = await api.getAdminCourseChapters(courseId)
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSections(res.data.map(mapApiChapter))
      }
      setContentLoaded(true)
    }
    loadContent()
  }, [courseId, courseLoading])

  const [editingLesson, setEditingLesson] = useState<{
    sectionId: string
    subsectionId?: string
    lesson: Lesson
  } | null>(null)

  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)

  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [quizSettings, setQuizSettings] = useState({
    passingScore: 70,
    requiredToContinue: false,
    timeLimit: 30,
    timeLimitEnabled: false,
  })
  const [gameQuestions, setGameQuestions] = useState<GameQuestion[]>([])
  const [gameSettings, setGameSettings] = useState<GameSettings>({ defaultTimerSeconds: 30 })
  const [assignmentDescription, setAssignmentDescription] = useState("")
  const [assignmentDueDate, setAssignmentDueDate] = useState("")
  const [assignmentTotalPoints, setAssignmentTotalPoints] = useState(100)
  const [assignmentGradingType, setAssignmentGradingType] = useState<"MANUAL" | "AUTO">("MANUAL")
  const [assignmentQuestions, setAssignmentQuestions] = useState<any[]>([])
  const [assignmentQuizSettings, setAssignmentQuizSettings] = useState({
    passingScore: 60,
    requiredToContinue: false,
    timeLimit: 30,
    timeLimitEnabled: false,
  })

  const [editingSectionTitle, setEditingSectionTitle] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [editingSubsectionTitle, setEditingSubsectionTitle] = useState<string | null>(null)
  const [newSubsectionTitle, setNewSubsectionTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [showQuestionBank, setShowQuestionBank] = useState(false)
  const [leaderboardSectionId, setLeaderboardSectionId] = useState<string | null>(null)
  const [bankTargetSectionId, setBankTargetSectionId] = useState<string | null>(null)
  const [bankTargetSubsectionId, setBankTargetSubsectionId] = useState<string | null>(null)

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: generateId(),
        title: `القسم ${prev.length + 1}`,
        isExpanded: true,
        lessons: [],
        subsections: [],
      },
    ])
  }

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    )
    setEditingSectionTitle(null)
  }

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
  }

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    )
  }

  const addSubsection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, subsections: [...s.subsections, emptySubsection(s.subsections.length + 1)] }
          : s
      )
    )
  }

  const updateSubsectionTitle = (sectionId: string, subsectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, subsections: s.subsections.map((sub) => (sub.id === subsectionId ? { ...sub, title } : sub)) }
          : s
      )
    )
    setEditingSubsectionTitle(null)
  }

  const removeSubsection = (sectionId: string, subsectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, subsections: s.subsections.filter((sub) => sub.id !== subsectionId) }
          : s
      )
    )
  }

  const toggleSubsection = (sectionId: string, subsectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              subsections: s.subsections.map((sub) =>
                sub.id === subsectionId ? { ...sub, isExpanded: !sub.isExpanded } : sub
              ),
            }
          : s
      )
    )
  }

  const mutateSectionLessons = (
    sectionId: string,
    subsectionId: string | undefined,
    fn: (lessons: Lesson[]) => Lesson[]
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        if (!subsectionId) return { ...s, lessons: fn(s.lessons) }
        return {
          ...s,
          subsections: s.subsections.map((sub) =>
            sub.id === subsectionId ? { ...sub, lessons: fn(sub.lessons) } : sub
          ),
        }
      })
    )
  }

  const addLesson = (sectionId: string, type: Lesson["type"] = "video", subsectionId?: string) => {
    const lesson = { ...emptyLesson(), type }
    mutateSectionLessons(sectionId, subsectionId, (lessons) => [...lessons, lesson])
    setEditingLesson({ sectionId, subsectionId, lesson })
  }

  useEffect(() => {
    if (editingLesson?.lesson.type === "quiz" && editingLesson.lesson.content) {
      try {
        const parsed = JSON.parse(editingLesson.lesson.content) as { questions?: unknown[]; settings?: Record<string, unknown> }
        if (parsed.questions && Array.isArray(parsed.questions)) setQuizQuestions(parsed.questions as typeof quizQuestions)
        if (parsed.settings && typeof parsed.settings === "object") setQuizSettings((s) => ({ ...s, ...parsed.settings }))
      } catch {
        // ignore parse errors
      }
    }
    if (editingLesson?.lesson.type === "game") {
      if (editingLesson.lesson.content) {
        try {
          const parsed = JSON.parse(editingLesson.lesson.content) as { questions?: GameQuestion[]; settings?: Partial<GameSettings> }
          setGameQuestions(Array.isArray(parsed.questions) ? parsed.questions : [])
          setGameSettings((s) => ({ ...s, ...parsed.settings }))
        } catch {
          setGameQuestions([])
        }
      } else {
        setGameQuestions([])
        setGameSettings({ defaultTimerSeconds: 30 })
      }
    }
    if (editingLesson?.lesson.type === "assignment") {
      if (editingLesson.lesson.content) {
        try {
          const parsed = JSON.parse(editingLesson.lesson.content) as { description?: string; dueDate?: string; totalPoints?: number; gradingType?: string; questions?: any[] }
          setAssignmentDescription(parsed.description ?? "")
          setAssignmentDueDate(parsed.dueDate ?? "")
          setAssignmentTotalPoints(parsed.totalPoints ?? 100)
          setAssignmentGradingType(parsed.gradingType === "AUTO" ? "AUTO" : "MANUAL")
          setAssignmentQuestions(Array.isArray(parsed.questions) ? parsed.questions : [])
        } catch {
          setAssignmentDescription("")
          setAssignmentDueDate("")
          setAssignmentTotalPoints(100)
          setAssignmentGradingType("MANUAL")
          setAssignmentQuestions([])
        }
      } else {
        setAssignmentDescription("")
        setAssignmentDueDate("")
        setAssignmentTotalPoints(100)
        setAssignmentGradingType("MANUAL")
        setAssignmentQuestions([])
      }
    }
  }, [editingLesson?.lesson.id, editingLesson?.lesson.type, editingLesson?.lesson.content])

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>, subsectionId?: string) => {
    mutateSectionLessons(sectionId, subsectionId, (lessons) =>
      lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l))
    )
  }

  const removeLesson = (sectionId: string, lessonId: string, subsectionId?: string) => {
    mutateSectionLessons(sectionId, subsectionId, (lessons) => lessons.filter((l) => l.id !== lessonId))
    if (editingLesson?.lesson.id === lessonId) {
      setEditingLesson(null)
    }
  }

  const handleSaveLesson = () => {
    if (!editingLesson) return
    const lesson = { ...editingLesson.lesson }
    if (lesson.type === "quiz") {
      lesson.content = JSON.stringify({ questions: quizQuestions, settings: quizSettings })
    }
    if (lesson.type === "game") {
      lesson.content = JSON.stringify({ questions: gameQuestions, settings: gameSettings })
    }
    if (lesson.type === "assignment") {
      lesson.content = JSON.stringify({
        description: assignmentDescription,
        dueDate: assignmentDueDate,
        totalPoints: assignmentTotalPoints,
        gradingType: assignmentGradingType,
        questions: assignmentGradingType === "AUTO" ? assignmentQuestions : [],
      })
    }
    updateLesson(editingLesson.sectionId, editingLesson.lesson.id, lesson, editingLesson.subsectionId)
    setEditingLesson(null)
    showToast("تم حفظ الدرس بنجاح")
  }

  const openQuestionBank = (sectionId: string, subsectionId?: string) => {
    setBankTargetSectionId(sectionId)
    setBankTargetSubsectionId(subsectionId ?? null)
    setShowQuestionBank(true)
    refetchQuestionBank()
  }

  const addFromQuestionBank = (selected: Array<{ id: string; question: string; questionAr?: string; options?: string; correctAnswer?: string; type?: string }>) => {
    if (!bankTargetSectionId || selected.length === 0) return
    const mappedQuestions = selected.map((q) => {
      let opts: Array<{ id: string; text: string; isCorrect: boolean }> = []
      try {
        const arr = JSON.parse(q.options || "[]") as Array<{ id?: string; text?: string; textAr?: string; isCorrect?: boolean }>
        opts = (arr || []).map((o) => ({
          id: String(o.id ?? ""),
          text: o.textAr || o.text || "",
          isCorrect: o.isCorrect ?? String(o.id) === q.correctAnswer,
        }))
      } catch {
        opts = []
      }
      return {
        id: generateId(),
        type: (q.type || "multiple_choice") as "multiple_choice" | "true_false" | "multi_select",
        question: q.questionAr || q.question,
        options: opts,
      }
    })
    const newLesson: Lesson = {
      ...emptyLesson(),
      type: "quiz",
      title: "اختبار من بنك الأسئلة",
      content: JSON.stringify({
        questions: mappedQuestions,
        settings: quizSettings,
      }),
    }
    setQuizQuestions(mappedQuestions)
    const sectionId = bankTargetSectionId
    const subsectionId = bankTargetSubsectionId ?? undefined
    mutateSectionLessons(sectionId, subsectionId, (lessons) => [...lessons, newLesson])
    setShowQuestionBank(false)
    setBankTargetSectionId(null)
    setBankTargetSubsectionId(null)
    setEditingLesson({ sectionId, subsectionId, lesson: newLesson })
    showToast("تم إضافة الاختبار من بنك الأسئلة")
  }

  const buildLessonPayload = (l: Lesson) => ({
    id: l.id,
    title: l.title,
    titleAr: l.title,
    type: l.type === "live" ? "LIVE_SESSION" : l.type.toUpperCase(),
    duration: l.duration,
    isFree: l.isFree,
    videoUrl: l.type !== "live" ? (l.videoSource || undefined) : undefined,
    content: l.content || undefined,
    meetingProvider: l.type === "live" ? (l.meetingProvider || "zoom") : undefined,
    meetingUrl: l.type === "live" ? l.meetingUrl : undefined,
    scheduledAt: l.type === "live" && l.scheduledAt ? new Date(l.scheduledAt).toISOString() : undefined,
    attachments: (l.attachments ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      type: a.type || "OTHER",
    })),
  })

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const chapters = sections.map((s) => ({
        id: s.id,
        title: s.title,
        titleAr: s.title,
        lessons: s.lessons.map(buildLessonPayload),
        subsections: s.subsections.map((sub) => ({
          id: sub.id,
          title: sub.title,
          titleAr: sub.title,
          lessons: sub.lessons.map(buildLessonPayload),
        })),
      }))
      const res = await api.syncCourseContent(courseId, chapters)
      if (res.success && res.data) {
        setSections(res.data.map(mapApiChapter))
        showToast("تم حفظ المحتوى بنجاح")
      } else {
        showToast(res.message || "فشل في حفظ المحتوى", "error")
      }
    } catch {
      showToast("فشل في حفظ المحتوى", "error")
    } finally {
      setSaving(false)
    }
  }

  const lessonTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    video: { label: "فيديو", icon: PlayCircle, color: "text-primary bg-primary/10" },
    text: { label: "نص", icon: FileText, color: "text-emerald-500 bg-emerald-50" },
    quiz: { label: "اختبار", icon: ClipboardList, color: "text-violet-500 bg-violet-50" },
    pdf: { label: "PDF", icon: FileText, color: "text-red-500 bg-red-50" },
    live: { label: "حصه مباشر", icon: Video, color: "text-amber-500 bg-amber-50" },
    game: { label: "لعبة", icon: Gamepad2, color: "text-pink-500 bg-pink-50" },
    assignment: { label: "واجب", icon: NotebookPen, color: "text-orange-500 bg-orange-50" },
  }

  const renderLessonRow = (lesson: Lesson, numberLabel: string, sectionId: string, subsectionId?: string) => {
    const typeConf = lessonTypeConfig[lesson.type]
    return (
      <div
        key={lesson.id}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group"
      >
        <GripVertical className="w-4 h-4 text-slate-200 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-xs font-mono text-slate-300 w-10 text-center shrink-0">
          {numberLabel}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeConf.color} shrink-0`}>
          <typeConf.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {lesson.title || "درس بدون عنوان"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400">{typeConf.label}</span>
            {lesson.duration > 0 && (
              <span className="text-[10px] text-slate-400">
                {lesson.duration} دقيقة
              </span>
            )}
            {lesson.isFree && (
              <Badge className="text-[9px] bg-emerald-50 text-emerald-600 hover:bg-emerald-50 px-1.5 py-0">
                مجاني
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {lesson.type === "game" && isSavedId(lesson.id) && (
            <Link
              href={`/admin/games/${lesson.id}/host`}
              className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500"
              title="استضافة اللعبة"
            >
              <Play className="w-3.5 h-3.5" />
            </Link>
          )}
          <button
            onClick={() => setPreviewLesson(lesson)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
            title="معاينة"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setEditingLesson({ sectionId, subsectionId, lesson: { ...lesson } })
            }
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              updateLesson(sectionId, lesson.id, { isPublished: !lesson.isPublished }, subsectionId)
            }
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
            title={lesson.isPublished ? "منشور - اضغط للإخفاء" : "مخفي - اضغط للنشر"}
          >
            {lesson.isPublished ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => removeLesson(sectionId, lesson.id, subsectionId)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const renderAddLessonButtons = (sectionId: string, subsectionId?: string) => (
    <div className="px-4 py-3 border-t border-slate-100 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "video", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <PlayCircle className="w-3.5 h-3.5 text-primary" />
          درس فيديو
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "text", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          درس نصي
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "quiz", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <ClipboardList className="w-3.5 h-3.5 text-violet-500" />
          اختبار
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "pdf", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <FileText className="w-3.5 h-3.5 text-red-500" />
          ملف PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "live", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <Video className="w-3.5 h-3.5 text-amber-500" />
          حصه مباشر
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "game", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-pink-500" />
          لعبة
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addLesson(sectionId, "assignment", subsectionId)}
          className="gap-1.5 rounded-lg text-xs h-8"
        >
          <NotebookPen className="w-3.5 h-3.5 text-orange-500" />
          واجب
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openQuestionBank(sectionId, subsectionId)}
          className="gap-1.5 rounded-xl text-xs h-9 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 text-slate-700 hover:text-violet-700 border-slate-200"
        >
          <BookOpen className="w-4 h-4 text-violet-500" />
          من بنك الأسئلة
        </Button>
      </div>
    </div>
  )

  if (courseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-slate-400">جاري تحميل المحتوى...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            العودة للدورات
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            محتوى الدورة: {course?.titleAr || course?.title || ""}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {sections.length} أقسام — {sections.reduce((a, s) => a + s.lessons.length + s.subsections.reduce((b, sub) => b + sub.lessons.length, 0), 0)} درس
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={addSection}
            className="gap-2 rounded-xl h-10"
          >
            <FolderPlus className="w-4 h-4" />
            قسم جديد
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white h-10"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ الكل
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => (
          <m.div
            key={section.id}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
              <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0" />
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                {section.isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
                {editingSectionTitle === section.id ? (
                  <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="h-8 rounded-lg text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateSectionTitle(section.id, newSectionTitle)
                        if (e.key === "Escape") setEditingSectionTitle(null)
                      }}
                    />
                    <button
                      onClick={() => updateSectionTitle(section.id, newSectionTitle)}
                      className="p-1 rounded hover:bg-slate-200"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-900 truncate">{section.title}</span>
                )}
              </button>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {section.lessons.length + section.subsections.reduce((a, sub) => a + sub.lessons.length, 0)} درس
              </Badge>
              {isSavedId(section.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLeaderboardSectionId(section.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"
                  title="الترتيب العام"
                >
                  <Trophy className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingSectionTitle(section.id)
                  setNewSectionTitle(section.title)
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeSection(section.id)
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lessons */}
            <AnimatePresence>
              {section.isExpanded && (
                <m.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-slate-100">
                    {section.lessons.map((lesson, lessonIdx) =>
                      renderLessonRow(lesson, `${sectionIdx + 1}.${lessonIdx + 1}`, section.id)
                    )}
                  </div>

                  {/* Subsections */}
                  <div className="px-4 pt-3 space-y-2">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={sub.id} className="ms-2 rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-100/60 border-b border-slate-200">
                          <button
                            onClick={() => toggleSubsection(section.id, sub.id)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                          >
                            {sub.isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            {editingSubsectionTitle === sub.id ? (
                              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  value={newSubsectionTitle}
                                  onChange={(e) => setNewSubsectionTitle(e.target.value)}
                                  className="h-7 rounded-lg text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") updateSubsectionTitle(section.id, sub.id, newSubsectionTitle)
                                    if (e.key === "Escape") setEditingSubsectionTitle(null)
                                  }}
                                />
                                <button
                                  onClick={() => updateSubsectionTitle(section.id, sub.id, newSubsectionTitle)}
                                  className="p-1 rounded hover:bg-slate-200"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-800 truncate">{sub.title}</span>
                            )}
                          </button>
                          <Badge variant="secondary" className="text-[9px] shrink-0">
                            {sub.lessons.length} درس
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSubsectionTitle(sub.id)
                              setNewSubsectionTitle(sub.title)
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSubsection(section.id, sub.id)
                            }}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {sub.isExpanded && (
                          <>
                            <div className="divide-y divide-slate-100">
                              {sub.lessons.map((lesson, lessonIdx) =>
                                renderLessonRow(lesson, `${sectionIdx + 1}.${subIdx + 1}.${lessonIdx + 1}`, section.id, sub.id)
                              )}
                            </div>
                            {renderAddLessonButtons(section.id, sub.id)}
                          </>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addSubsection(section.id)}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة قسم فرعي
                    </button>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        ))}
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={
          editingLesson?.lesson.type === "pdf"
            ? "application/pdf"
            : editingLesson?.lesson.type === "video"
              ? "video/mp4,video/webm,video/quicktime"
              : "video/*,application/pdf"
        }
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file || !editingLesson) return
          setUploadingFile(true)
          try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await api.uploadAdminFile(formData)
            if (res.success && (res as any).data?.url) {
              const url = (res as any).data.url
              setEditingLesson({
                ...editingLesson,
                lesson: { ...editingLesson.lesson, videoSource: url },
              })
              showToast("تم رفع الملف بنجاح")
            } else {
              showToast((res as any).message || "فشل رفع الملف", "error")
            }
          } catch {
            showToast("فشل رفع الملف", "error")
          } finally {
            setUploadingFile(false)
            e.target.value = ""
          }
        }}
      />

      {/* Lesson Editor Modal */}
      <AnimatePresence>
        {editingLesson && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLesson.lesson.title ? "تعديل الدرس" : "درس جديد"}
                </h3>
                <button
                  onClick={() => setEditingLesson(null)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Lesson Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-2">
                    نوع الدرس
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {(["video", "text", "quiz", "pdf", "live", "game", "assignment"] as const).map((type) => {
                      const conf = lessonTypeConfig[type]
                      return (
                        <button
                          key={type}
                          onClick={() =>
                            setEditingLesson({
                              ...editingLesson,
                              lesson: { ...editingLesson.lesson, type },
                            })
                          }
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            editingLesson.lesson.type === type
                              ? "border-primary bg-primary/10"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <conf.icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{conf.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                    عنوان الدرس *
                  </label>
                  <Input
                    value={editingLesson.lesson.title}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: { ...editingLesson.lesson, title: e.target.value },
                      })
                    }
                    placeholder="عنوان الدرس"
                    className="rounded-xl h-11"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                    وصف الدرس
                  </label>
                  <Textarea
                    value={editingLesson.lesson.description}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: { ...editingLesson.lesson, description: e.target.value },
                      })
                    }
                    placeholder="وصف مختصر للدرس..."
                    className="rounded-xl min-h-[80px] resize-none"
                  />
                </div>

                {/* Video Source (for video type) */}
                {editingLesson.lesson.type === "video" && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-800 block">
                      مصدر الفيديو
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "youtube" as const, label: "YouTube", icon: Youtube },
                        { value: "upload" as const, label: "رفع", icon: Upload },
                        { value: "url" as const, label: "رابط", icon: Link2 },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() =>
                            setEditingLesson({
                              ...editingLesson,
                              lesson: { ...editingLesson.lesson, videoType: opt.value },
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                            editingLesson.lesson.videoType === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {editingLesson.lesson.videoType === "upload" ? (
                      <div
                        onClick={() => !uploadingFile && fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/10/30 cursor-pointer transition-all"
                      >
                        {uploadingFile ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-slate-400" />
                        )}
                        <p className="text-sm text-slate-600">
                          {uploadingFile ? "جاري الرفع..." : "اضغط لرفع فيديو (MP4, WebM)"}
                        </p>
                        {editingLesson.lesson.videoSource && (
                          <p className="text-xs text-emerald-600 truncate max-w-full">{editingLesson.lesson.videoSource}</p>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={editingLesson.lesson.videoSource}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            lesson: { ...editingLesson.lesson, videoSource: e.target.value },
                          })
                        }
                        placeholder={
                          editingLesson.lesson.videoType === "youtube"
                            ? "https://youtube.com/watch?v=..."
                            : "https://example.com/video.mp4"
                        }
                        className="rounded-xl h-11"
                        dir="ltr"
                      />
                    )}
                  </div>
                )}

                {/* Text Content (for text type) */}
                {editingLesson.lesson.type === "text" && (
                  <div>
                    <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                      محتوى الدرس
                    </label>
                    <Textarea
                      value={editingLesson.lesson.content}
                      onChange={(e) =>
                        setEditingLesson({
                          ...editingLesson,
                          lesson: { ...editingLesson.lesson, content: e.target.value },
                        })
                      }
                      placeholder="اكتب محتوى الدرس..."
                      className="rounded-xl min-h-[200px]"
                    />
                  </div>
                )}

                {/* Quiz Builder (for quiz type) */}
                {editingLesson.lesson.type === "quiz" && (
                  <QuizBuilder
                    questions={quizQuestions}
                    settings={quizSettings}
                    onQuestionsChange={setQuizQuestions}
                    onSettingsChange={setQuizSettings}
                  />
                )}

                {/* Game Builder (for game type) */}
                {editingLesson.lesson.type === "game" && (
                  <GameBuilder
                    questions={gameQuestions}
                    settings={gameSettings}
                    onQuestionsChange={setGameQuestions}
                    onSettingsChange={setGameSettings}
                  />
                )}

                {/* Assignment (for assignment type) */}
                {editingLesson.lesson.type === "assignment" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                        وصف الواجب
                      </label>
                      <Textarea
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                        placeholder="اشرح المطلوب من الطالب..."
                        className="rounded-xl min-h-[120px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                          تاريخ التسليم
                        </label>
                        <Input
                          type="date"
                          value={assignmentDueDate}
                          onChange={(e) => setAssignmentDueDate(e.target.value)}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                          الدرجة الكاملة
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={assignmentTotalPoints}
                          onChange={(e) => setAssignmentTotalPoints(Number(e.target.value) || 100)}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                        طريقة التصحيح
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignmentGradingType("MANUAL")}
                          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                            assignmentGradingType === "MANUAL"
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          يدوي (مقال / ملف)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignmentGradingType("AUTO")}
                          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                            assignmentGradingType === "AUTO"
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          تلقائي (أسئلة اختيارات)
                        </button>
                      </div>
                    </div>
                    {assignmentGradingType === "AUTO" && (
                      <div className="rounded-xl border border-orange-200/60 bg-orange-50/30 p-4">
                        <p className="text-xs text-orange-700 mb-3">
                          حط أسئلة اختيارات وحدد الإجابة الصحيحة — الطالب هيتصحح على طول لما يسلم، وتقدر تراجع الدرجة وتعدلها بعدين.
                        </p>
                        <QuizBuilder
                          questions={assignmentQuestions}
                          settings={assignmentQuizSettings}
                          onQuestionsChange={setAssignmentQuestions}
                          onSettingsChange={setAssignmentQuizSettings}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Live Session (for live type) */}
                {editingLesson.lesson.type === "live" && (
                  <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <label className="text-sm font-semibold text-slate-800 block">
                      مزود الحصة المباشرة
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setEditingLesson({
                            ...editingLesson,
                            lesson: { ...editingLesson.lesson, meetingProvider: "zoom" },
                          })
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          (editingLesson.lesson.meetingProvider || "zoom") === "zoom"
                            ? "border-amber-500 bg-amber-100 text-amber-800"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Zoom
                      </button>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                        معاد الحصة *
                      </label>
                      <input
                        type="datetime-local"
                        value={editingLesson.lesson.scheduledAt ?? ""}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            lesson: { ...editingLesson.lesson, scheduledAt: e.target.value },
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                      />
                      {editingLesson.lesson.meetingUrl && (
                        <p className="text-xs text-emerald-600 mt-1.5 truncate">
                          رابط Zoom: {editingLesson.lesson.meetingUrl}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF Source (for pdf type) */}
                {editingLesson.lesson.type === "pdf" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800 block">
                      ملف PDF
                    </label>
                    <div
                      onClick={() => !uploadingFile && fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/10/30 cursor-pointer transition-all"
                    >
                      {uploadingFile ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                      <p className="text-sm text-slate-600">
                        {uploadingFile ? "جاري الرفع..." : "اضغط لرفع ملف PDF"}
                      </p>
                      {editingLesson.lesson.videoSource && (
                        <p className="text-xs text-emerald-600 truncate max-w-full">{editingLesson.lesson.videoSource}</p>
                      )}
                    </div>
                    <Input
                      value={editingLesson.lesson.videoSource}
                      onChange={(e) =>
                        setEditingLesson({
                          ...editingLesson,
                          lesson: { ...editingLesson.lesson, videoSource: e.target.value },
                        })
                      }
                      placeholder="أو الصق رابط ملف PDF"
                      className="rounded-xl h-11"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Duration */}
                {editingLesson.lesson.type !== "quiz" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                        المدة (دقائق)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={editingLesson.lesson.duration}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            lesson: {
                              ...editingLesson.lesson,
                              duration: Number(e.target.value),
                            },
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                        سعر الدرس ($)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editingLesson.lesson.price}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            lesson: {
                              ...editingLesson.lesson,
                              price: Number(e.target.value),
                            },
                          })
                        }
                        className="rounded-xl"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-2">
                    المرفقات
                  </label>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    accept="application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !editingLesson) return
                      setUploadingAttachment(true)
                      try {
                        const formData = new FormData()
                        formData.append("file", file)
                        const res = await api.uploadAdminFile(formData)
                        if (res.success && (res as any).data?.url) {
                          const url = (res as any).data.url
                          const name = (res as any).data.name ?? file.name
                          const type = (res as any).data.type ?? "OTHER"
                          setEditingLesson({
                            ...editingLesson,
                            lesson: {
                              ...editingLesson.lesson,
                              attachments: [
                                ...(editingLesson.lesson.attachments ?? []),
                                { id: "", name, url, type },
                              ],
                            },
                          })
                          showToast("تم رفع المرفق بنجاح")
                        } else {
                          showToast((res as any).message || "فشل رفع المرفق", "error")
                        }
                      } catch {
                        showToast("فشل رفع المرفق", "error")
                      } finally {
                        setUploadingAttachment(false)
                        e.target.value = ""
                      }
                    }}
                  />
                  <div
                    onClick={() => !uploadingAttachment && attachmentInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/10/30 transition-all cursor-pointer"
                  >
                    {uploadingAttachment ? (
                      <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                    ) : (
                      <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-slate-500">
                      {uploadingAttachment ? "جاري الرفع..." : "اضغط لرفع مرفقات (PDF, ZIP, DOC, PPT)"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      حد أقصى 50 ميجابايت
                    </p>
                  </div>
                  {(editingLesson.lesson.attachments ?? []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {editingLesson.lesson.attachments.map((a, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <span className="text-sm text-slate-700 truncate flex-1">{a.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(editingLesson.lesson.attachments ?? [])]
                              list.splice(idx, 1)
                              setEditingLesson({
                                ...editingLesson,
                                lesson: { ...editingLesson.lesson, attachments: list },
                              })
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <Switch
                      checked={editingLesson.lesson.isPublished}
                      onCheckedChange={(v) =>
                        setEditingLesson({
                          ...editingLesson,
                          lesson: { ...editingLesson.lesson, isPublished: v },
                        })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className="text-sm text-slate-700">منشور</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Switch
                      checked={editingLesson.lesson.isFree}
                      onCheckedChange={(v) =>
                        setEditingLesson({
                          ...editingLesson,
                          lesson: { ...editingLesson.lesson, isFree: v },
                        })
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm text-slate-700">درس مجاني</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingLesson(null)}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSaveLesson}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ الدرس
                </Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>


      {/* Question Bank Modal */}
      {showQuestionBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <QuestionBankPickerModal
            data={questionBankData}
            onClose={() => { setShowQuestionBank(false); setBankTargetSectionId(null); setBankTargetSubsectionId(null) }}
            onSelect={(selected) => {
              addFromQuestionBank(selected)
            }}
          />
        </div>
      )}

      {/* Section Leaderboard Modal */}
      {leaderboardSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            <SectionLeaderboard chapterId={leaderboardSectionId} onClose={() => setLeaderboardSectionId(null)} />
          </div>
        </div>
      )}

      {/* Lesson Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">معاينة</p>
                <h3 className="text-lg font-bold text-slate-900">{previewLesson.title || "بدون عنوان"}</h3>
              </div>
              <button onClick={() => setPreviewLesson(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <LessonPreviewBody lesson={previewLesson} />
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
