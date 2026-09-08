"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Circle,
  ToggleLeft,
  ListChecks,
  Type,
  Boxes,
  Shuffle,
  AlignLeft,
  Timer,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type GameQuestionType = "mc" | "ms" | "tf" | "di" | "cat" | "match" | "fill"

export interface GameOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface GameCatItem {
  id: string
  text: string
  correctCategoryId: string
}

export interface GameCategory {
  id: string
  label: string
}

export interface GameMatchItem {
  id: string
  text: string
  correctChoiceId: string
}

export interface GameChoice {
  id: string
  label: string
}

export interface GameBlank {
  key: string
  label: string
  answers: string[]
}

export interface GameQuestion {
  id: string
  type: GameQuestionType
  question: string
  points: number
  // mc / ms
  options?: GameOption[]
  // tf
  correct?: boolean
  // di
  answers?: string[]
  displayAnswer?: string
  // cat
  categories?: GameCategory[]
  items?: GameCatItem[] | GameMatchItem[]
  // match
  choices?: GameChoice[]
  // fill
  passage?: string
  blanks?: GameBlank[]
}

export interface GameSettings {
  defaultTimerSeconds: number
}

interface GameBuilderProps {
  questions: GameQuestion[]
  settings: GameSettings
  onQuestionsChange: (questions: GameQuestion[]) => void
  onSettingsChange: (settings: GameSettings) => void
}

const gameTypeConfig: Record<GameQuestionType, { label: string; icon: React.ElementType; defaultPoints: number }> = {
  mc: { label: "اختيار واحد", icon: Circle, defaultPoints: 10 },
  ms: { label: "اختيار متعدد", icon: ListChecks, defaultPoints: 15 },
  tf: { label: "صح / خطأ", icon: ToggleLeft, defaultPoints: 5 },
  di: { label: "إجابة مكتوبة", icon: Type, defaultPoints: 10 },
  cat: { label: "تصنيف", icon: Boxes, defaultPoints: 15 },
  match: { label: "توصيل", icon: Shuffle, defaultPoints: 15 },
  fill: { label: "أكمل الفراغ", icon: AlignLeft, defaultPoints: 15 },
}

const TIMER_OPTIONS = [15, 25, 40, 60, 90, 120]

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function summarizeQuestion(q: GameQuestion): string {
  switch (q.type) {
    case "mc":
    case "ms":
      return `${(q.options ?? []).length} خيارات`
    case "tf":
      return "صح / خطأ"
    case "di":
      return `${(q.answers ?? []).length} إجابات مقبولة`
    case "cat":
      return `${(q.items ?? []).length} عناصر — ${(q.categories ?? []).length} تصنيفات`
    case "match":
      return `${(q.items ?? []).length} عناصر — ${(q.choices ?? []).length} اختيارات`
    case "fill":
      return `${(q.blanks ?? []).length} فراغات`
  }
}

function makeDefaultQuestion(type: GameQuestionType): GameQuestion {
  const base = { id: generateId(), type, question: "", points: gameTypeConfig[type].defaultPoints }
  switch (type) {
    case "mc":
    case "ms":
      return {
        ...base,
        options: [
          { id: generateId(), text: "", isCorrect: false },
          { id: generateId(), text: "", isCorrect: false },
        ],
      }
    case "tf":
      return { ...base, correct: true }
    case "di":
      return { ...base, answers: [""], displayAnswer: "" }
    case "cat":
      return {
        ...base,
        categories: [
          { id: generateId(), label: "" },
          { id: generateId(), label: "" },
        ],
        items: [{ id: generateId(), text: "", correctCategoryId: "" } as GameCatItem],
      }
    case "match":
      return {
        ...base,
        choices: [
          { id: generateId(), label: "" },
          { id: generateId(), label: "" },
        ],
        items: [{ id: generateId(), text: "", correctChoiceId: "" } as GameMatchItem],
      }
    case "fill":
      return { ...base, passage: "", blanks: [] }
  }
}

/** Scans a passage for {{blank:key}} markers and syncs the blanks list to match — preserving accepted answers for keys still present. */
function syncBlanksFromPassage(passage: string, existingBlanks: GameBlank[]): GameBlank[] {
  const keys = Array.from(passage.matchAll(/\{\{blank:([a-zA-Z0-9_]+)\}\}/g)).map((m) => m[1])
  const uniqueKeys = Array.from(new Set(keys))
  return uniqueKeys.map((key) => existingBlanks.find((b) => b.key === key) ?? { key, label: "", answers: [""] })
}

export default function GameBuilder({ questions, settings, onQuestionsChange, onSettingsChange }: GameBuilderProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const addQuestion = (type: GameQuestionType) => {
    const newQ = makeDefaultQuestion(type)
    onQuestionsChange([...questions, newQ])
    setExpandedQuestion(newQ.id)
  }

  const updateQuestion = (id: string, updates: Partial<GameQuestion>) => {
    onQuestionsChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-500" />
          إعدادات اللعبة
        </h4>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">
            الوقت لكل سؤال (بالثواني)
          </label>
          <select
            value={settings.defaultTimerSeconds}
            onChange={(e) => onSettingsChange({ ...settings, defaultTimerSeconds: Number(e.target.value) })}
            className="w-full sm:w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {TIMER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} ثانية
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            كل الطلاب هياخدوا نفس الوقت لكل سؤال، والإجابة الأسرع تاخد نقاط إضافية
          </p>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const config = gameTypeConfig[q.type]
          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <config.icon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {q.question || "سؤال بدون عنوان"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {config.label} — {summarizeQuestion(q)} — {q.points} نقطة
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeQuestion(q.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {expandedQuestion === q.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {expandedQuestion === q.id && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                  <Textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder="اكتب السؤال هنا..."
                    className="rounded-lg min-h-[70px]"
                  />

                  <div className="w-32">
                    <label className="text-xs font-medium text-slate-600 block mb-1">النقاط</label>
                    <Input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) || 1 })}
                      className="rounded-lg"
                    />
                  </div>

                  {(q.type === "mc" || q.type === "ms") && (
                    <McMsEditor q={q} updateQuestion={updateQuestion} />
                  )}
                  {q.type === "tf" && <TfEditor q={q} updateQuestion={updateQuestion} />}
                  {q.type === "di" && <DiEditor q={q} updateQuestion={updateQuestion} />}
                  {q.type === "cat" && <CatMatchEditor q={q} kind="cat" updateQuestion={updateQuestion} />}
                  {q.type === "match" && <CatMatchEditor q={q} kind="match" updateQuestion={updateQuestion} />}
                  {q.type === "fill" && <FillEditor q={q} updateQuestion={updateQuestion} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Question */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(gameTypeConfig) as [GameQuestionType, typeof gameTypeConfig[GameQuestionType]][]).map(
          ([type, config]) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              onClick={() => addQuestion(type)}
              className="gap-2 rounded-xl text-sm"
            >
              <config.icon className="w-4 h-4" />
              {config.label}
            </Button>
          )
        )}
      </div>
    </div>
  )
}

function McMsEditor({
  q,
  updateQuestion,
}: {
  q: GameQuestion
  updateQuestion: (id: string, updates: Partial<GameQuestion>) => void
}) {
  const options = q.options ?? []

  const updateOption = (optionId: string, updates: Partial<GameOption>) => {
    let next = options.map((o) => (o.id === optionId ? { ...o, ...updates } : o))
    if (updates.isCorrect && q.type === "mc") {
      next = next.map((o) => (o.id === optionId ? { ...o, isCorrect: true } : { ...o, isCorrect: false }))
    }
    updateQuestion(q.id, { options: next })
  }

  const addOption = () => {
    updateQuestion(q.id, { options: [...options, { id: generateId(), text: "", isCorrect: false }] })
  }

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return
    updateQuestion(q.id, { options: options.filter((o) => o.id !== optionId) })
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">
        الخيارات {q.type === "ms" ? "(ممكن أكتر من إجابة صح)" : "(إجابة واحدة صح)"}
      </label>
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateOption(opt.id, { isCorrect: !opt.isCorrect })}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all shrink-0",
              opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-slate-400"
            )}
          >
            {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5" />}
          </button>
          <Input
            value={opt.text}
            onChange={(e) => updateOption(opt.id, { text: e.target.value })}
            placeholder="نص الخيار..."
            className="flex-1 rounded-lg"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addOption} className="text-xs rounded-lg mt-1">
        <Plus className="w-3 h-3 ml-1" /> إضافة خيار
      </Button>
    </div>
  )
}

function TfEditor({
  q,
  updateQuestion,
}: {
  q: GameQuestion
  updateQuestion: (id: string, updates: Partial<GameQuestion>) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">الإجابة الصحيحة</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => updateQuestion(q.id, { correct: true })}
          className={cn(
            "rounded-lg border-2 py-2 text-sm font-bold transition-all",
            q.correct === true ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
          )}
        >
          صح
        </button>
        <button
          type="button"
          onClick={() => updateQuestion(q.id, { correct: false })}
          className={cn(
            "rounded-lg border-2 py-2 text-sm font-bold transition-all",
            q.correct === false ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"
          )}
        >
          خطأ
        </button>
      </div>
    </div>
  )
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  const addTag = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...values, v])
    setDraft("")
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs rounded-full px-2.5 py-1"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder}
          className="rounded-lg text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} className="rounded-lg shrink-0">
          إضافة
        </Button>
      </div>
    </div>
  )
}

function DiEditor({
  q,
  updateQuestion,
}: {
  q: GameQuestion
  updateQuestion: (id: string, updates: Partial<GameQuestion>) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">
          الإجابات المقبولة (يقدر يكتب أي واحدة منها)
        </label>
        <TagInput
          values={q.answers ?? []}
          onChange={(answers) => updateQuestion(q.id, { answers })}
          placeholder="اكتب إجابة واضغط Enter..."
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">الإجابة اللي هتتعرض للطالب بعد الحل</label>
        <Input
          value={q.displayAnswer ?? ""}
          onChange={(e) => updateQuestion(q.id, { displayAnswer: e.target.value })}
          placeholder="مثال: Paris"
          className="rounded-lg"
        />
      </div>
    </div>
  )
}

function CatMatchEditor({
  q,
  kind,
  updateQuestion,
}: {
  q: GameQuestion
  kind: "cat" | "match"
  updateQuestion: (id: string, updates: Partial<GameQuestion>) => void
}) {
  const labelList = kind === "cat" ? (q.categories ?? []) : (q.choices ?? [])
  const items = (q.items ?? []) as Array<GameCatItem & GameMatchItem>
  const listKey = kind === "cat" ? "categories" : "choices"
  const correctKey = kind === "cat" ? "correctCategoryId" : "correctChoiceId"

  const updateLabels = (next: GameCategory[] | GameChoice[]) => {
    updateQuestion(q.id, { [listKey]: next } as Partial<GameQuestion>)
  }

  const updateItems = (next: typeof items) => {
    updateQuestion(q.id, { items: next } as Partial<GameQuestion>)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">
          {kind === "cat" ? "التصنيفات" : "الاختيارات المتاحة"}
        </label>
        <div className="space-y-2">
          {labelList.map((l, i) => (
            <div key={l.id} className="flex items-center gap-2">
              <Input
                value={l.label}
                onChange={(e) => {
                  const next = [...labelList]
                  next[i] = { ...next[i], label: e.target.value }
                  updateLabels(next)
                }}
                placeholder={kind === "cat" ? "اسم التصنيف..." : "اسم الاختيار..."}
                className="flex-1 rounded-lg"
              />
              {labelList.length > 2 && (
                <button
                  type="button"
                  onClick={() => updateLabels(labelList.filter((x) => x.id !== l.id))}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateLabels([...labelList, { id: generateId(), label: "" }])}
            className="text-xs rounded-lg"
          >
            <Plus className="w-3 h-3 ml-1" /> {kind === "cat" ? "إضافة تصنيف" : "إضافة اختيار"}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">العناصر</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
              <Input
                value={item.text}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], text: e.target.value }
                  updateItems(next)
                }}
                placeholder="نص العنصر..."
                className="flex-1 rounded-lg bg-white"
              />
              <select
                value={(item as any)[correctKey] ?? ""}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], [correctKey]: e.target.value } as any
                  updateItems(next)
                }}
                className="rounded-lg border border-slate-200 px-2 py-2 text-xs bg-white min-w-[140px]"
              >
                <option value="">-- اختر --</option>
                {labelList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label || "بدون اسم"}
                  </option>
                ))}
              </select>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => updateItems(items.filter((x) => x.id !== item.id))}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateItems([...items, { id: generateId(), text: "", [correctKey]: "" } as any])
            }
            className="text-xs rounded-lg"
          >
            <Plus className="w-3 h-3 ml-1" /> إضافة عنصر
          </Button>
        </div>
      </div>
    </div>
  )
}

function FillEditor({
  q,
  updateQuestion,
}: {
  q: GameQuestion
  updateQuestion: (id: string, updates: Partial<GameQuestion>) => void
}) {
  const blanks = q.blanks ?? []

  const handlePassageChange = (passage: string) => {
    const nextBlanks = syncBlanksFromPassage(passage, blanks)
    updateQuestion(q.id, { passage, blanks: nextBlanks })
  }

  const updateBlank = (key: string, updates: Partial<GameBlank>) => {
    updateQuestion(q.id, { blanks: blanks.map((b) => (b.key === key ? { ...b, ...updates } : b)) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">
          النص — اكتب <code className="bg-slate-100 px-1 rounded">{"{{blank:key}}"}</code> مكان كل فراغ
        </label>
        <Textarea
          value={q.passage ?? ""}
          onChange={(e) => handlePassageChange(e.target.value)}
          placeholder={"مثال: عاصمة فرنسا هي {{blank:city}}"}
          className="rounded-lg min-h-[90px] font-mono text-sm"
        />
      </div>
      {blanks.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">الفراغات المكتشفة</label>
          {blanks.map((b) => (
            <div key={b.key} className="bg-slate-50 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-purple-100 text-purple-700 rounded px-1.5 py-0.5">
                  {b.key}
                </span>
                <Input
                  value={b.label}
                  onChange={(e) => updateBlank(b.key, { label: e.target.value })}
                  placeholder="تلميح (اختياري)..."
                  className="flex-1 rounded-lg bg-white text-sm"
                />
              </div>
              <TagInput
                values={b.answers}
                onChange={(answers) => updateBlank(b.key, { answers })}
                placeholder="إجابة مقبولة..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
