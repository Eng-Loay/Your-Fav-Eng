"use client"

import { CheckCircle2, XCircle, FileText, PlayCircle, Video } from "lucide-react"

interface PreviewOption {
  id?: string
  text?: string
  isCorrect?: boolean
}

interface PreviewQuestion {
  id?: string
  type?: string
  question?: string
  options?: PreviewOption[]
  correct?: boolean
  items?: Array<{ id?: string; text?: string; correctCategoryId?: string; correctChoiceId?: string }>
  categories?: Array<{ id?: string; label?: string }>
  choices?: Array<{ id?: string; label?: string }>
}

interface PreviewLesson {
  title: string
  type: string
  content: string
  videoSource: string
  description?: string
}

function QuestionCard({ q, index }: { q: PreviewQuestion; index: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">
        {index + 1}. {q.question || "بدون نص"}
      </p>

      {(q.type === "mc" || q.type === "ms" || q.type === "multiple_choice" || q.type === "multi_select") && Array.isArray(q.options) && (
        <div className="space-y-1.5">
          {q.options.map((o, i) => (
            <div
              key={o.id || i}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                o.isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600"
              }`}
            >
              {o.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0 text-slate-300" />}
              {o.text}
            </div>
          ))}
        </div>
      )}

      {(q.type === "tf" || q.type === "true_false") && (
        <div className="flex gap-2">
          {q.options && Array.isArray(q.options) ? (
            q.options.map((o, i) => (
              <div
                key={o.id || i}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm flex-1 ${
                  o.isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600"
                }`}
              >
                {o.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : null}
                {o.text}
              </div>
            ))
          ) : (
            <div className={`rounded-lg px-3 py-2 text-sm ${q.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              الإجابة الصحيحة: {q.correct ? "صح" : "خطأ"}
            </div>
          )}
        </div>
      )}

      {q.type === "cat" && Array.isArray(q.items) && Array.isArray(q.categories) && (
        <div className="space-y-1.5">
          {q.items.map((it, i) => {
            const cat = q.categories?.find((c) => c.id === it.correctCategoryId)
            return (
              <div key={it.id || i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{it.text}</span>
                <span className="text-emerald-700 font-medium shrink-0">{cat?.label || "—"}</span>
              </div>
            )
          })}
        </div>
      )}

      {q.type === "match" && Array.isArray(q.items) && Array.isArray(q.choices) && (
        <div className="space-y-1.5">
          {q.items.map((it, i) => {
            const choice = q.choices?.find((c) => c.id === it.correctChoiceId)
            return (
              <div key={it.id || i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{it.text}</span>
                <span className="text-emerald-700 font-medium shrink-0">{choice?.label || "—"}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LessonPreviewBody({ lesson }: { lesson: PreviewLesson }) {
  if (lesson.type === "quiz" || lesson.type === "game") {
    let parsed: { questions?: PreviewQuestion[] } = {}
    try {
      parsed = lesson.content ? JSON.parse(lesson.content) : {}
    } catch {
      parsed = {}
    }
    const questions = Array.isArray(parsed.questions) ? parsed.questions : []
    if (questions.length === 0) {
      return <p className="text-sm text-slate-400 text-center py-8">مفيش أسئلة لسه اتضافت لهذا الدرس.</p>
    }
    return (
      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionCard key={q.id || i} q={q} index={i} />
        ))}
      </div>
    )
  }

  if (lesson.type === "assignment") {
    let parsed: { description?: string; dueDate?: string; totalPoints?: number; gradingType?: string; questions?: PreviewQuestion[] } = {}
    try {
      parsed = lesson.content ? JSON.parse(lesson.content) : {}
    } catch {
      parsed = {}
    }
    return (
      <div className="space-y-4">
        {parsed.description && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">{parsed.description}</div>
        )}
        <div className="flex gap-4 text-xs text-slate-500">
          {parsed.dueDate && <span>تاريخ التسليم: {parsed.dueDate}</span>}
          <span>الدرجة الكاملة: {parsed.totalPoints ?? 100}</span>
          <span>{parsed.gradingType === "AUTO" ? "تصحيح تلقائي" : "تصحيح يدوي"}</span>
        </div>
        {parsed.gradingType === "AUTO" && Array.isArray(parsed.questions) && parsed.questions.length > 0 && (
          <div className="space-y-3">
            {parsed.questions.map((q, i) => (
              <QuestionCard key={q.id || i} q={q} index={i} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (lesson.type === "text") {
    return (
      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
        {lesson.content || <span className="text-slate-400">مفيش محتوى نصي لسه.</span>}
      </div>
    )
  }

  if (lesson.type === "pdf") {
    return lesson.videoSource ? (
      <a href={lesson.videoSource} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
        <FileText className="w-4 h-4" /> فتح ملف PDF
      </a>
    ) : (
      <p className="text-sm text-slate-400 text-center py-8">مفيش رابط PDF لسه.</p>
    )
  }

  if (lesson.type === "video") {
    return lesson.videoSource ? (
      <a href={lesson.videoSource} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
        <PlayCircle className="w-4 h-4" /> فتح الفيديو
      </a>
    ) : (
      <p className="text-sm text-slate-400 text-center py-8">مفيش فيديو لسه.</p>
    )
  }

  if (lesson.type === "live") {
    return <p className="text-sm text-slate-500">حصة مباشرة — {lesson.description || "من غير تفاصيل إضافية"}</p>
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
      <Video className="w-4 h-4" /> مفيش معاينة متاحة لهذا النوع من الدروس.
    </div>
  )
}
