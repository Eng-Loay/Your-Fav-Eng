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
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type QuizType = "multiple_choice" | "true_false" | "multi_select"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuizQuestion {
  id: string
  type: QuizType
  question: string
  options: QuizOption[]
  explanation?: string
}

interface QuizSettings {
  passingScore: number
  requiredToContinue: boolean
  timeLimit: number
  timeLimitEnabled: boolean
}

interface QuizBuilderProps {
  questions: QuizQuestion[]
  settings: QuizSettings
  onQuestionsChange: (questions: QuizQuestion[]) => void
  onSettingsChange: (settings: QuizSettings) => void
}

const quizTypeConfig: Record<QuizType, { label: string; icon: React.ElementType }> = {
  multiple_choice: { label: "اختيار واحد", icon: Circle },
  true_false: { label: "صح / خطأ", icon: ToggleLeft },
  multi_select: { label: "اختيار متعدد", icon: ListChecks },
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export default function QuizBuilder({
  questions,
  settings,
  onQuestionsChange,
  onSettingsChange,
}: QuizBuilderProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const addQuestion = (type: QuizType) => {
    const defaultOptions: QuizOption[] =
      type === "true_false"
        ? [
            { id: generateId(), text: "صح", isCorrect: true },
            { id: generateId(), text: "خطأ", isCorrect: false },
          ]
        : [
            { id: generateId(), text: "", isCorrect: false },
            { id: generateId(), text: "", isCorrect: false },
          ]

    const newQ: QuizQuestion = {
      id: generateId(),
      type,
      question: "",
      options: defaultOptions,
    }
    onQuestionsChange([...questions, newQ])
    setExpandedQuestion(newQ.id)
  }

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    onQuestionsChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id))
  }

  const addOption = (questionId: string) => {
    const q = questions.find((q) => q.id === questionId)
    if (!q) return
    updateQuestion(questionId, {
      options: [...q.options, { id: generateId(), text: "", isCorrect: false }],
    })
  }

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuizOption>) => {
    const q = questions.find((q) => q.id === questionId)
    if (!q) return

    let newOptions = q.options.map((o) => (o.id === optionId ? { ...o, ...updates } : o))

    if (updates.isCorrect && q.type === "multiple_choice") {
      newOptions = newOptions.map((o) =>
        o.id === optionId ? { ...o, isCorrect: true } : { ...o, isCorrect: false }
      )
    }

    updateQuestion(questionId, { options: newOptions })
  }

  const removeOption = (questionId: string, optionId: string) => {
    const q = questions.find((q) => q.id === questionId)
    if (!q || q.options.length <= 2) return
    updateQuestion(questionId, { options: q.options.filter((o) => o.id !== optionId) })
  }

  return (
    <div className="space-y-6">
      {/* Quiz Settings */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          إعدادات الاختبار
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              درجة النجاح (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.passingScore}
              onChange={(e) =>
                onSettingsChange({ ...settings, passingScore: Number(e.target.value) })
              }
              className="rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200/60 p-3">
            <div>
              <p className="text-xs font-medium text-slate-700">مطلوب للمتابعة</p>
              <p className="text-[10px] text-slate-400">يجب اجتياز الاختبار للانتقال</p>
            </div>
            <Switch
              checked={settings.requiredToContinue}
              onCheckedChange={(v) => onSettingsChange({ ...settings, requiredToContinue: v })}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200/60 p-3 flex-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">حد زمني</span>
            </div>
            <Switch
              checked={settings.timeLimitEnabled}
              onCheckedChange={(v) => onSettingsChange({ ...settings, timeLimitEnabled: v })}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
          {settings.timeLimitEnabled && (
            <div className="w-32">
              <Input
                type="number"
                min={1}
                value={settings.timeLimit}
                onChange={(e) =>
                  onSettingsChange({ ...settings, timeLimit: Number(e.target.value) })
                }
                className="rounded-lg"
                placeholder="دقائق"
              />
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white rounded-xl border border-slate-200/60 overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
            >
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {q.question || "سؤال بدون عنوان"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {quizTypeConfig[q.type].label} — {q.options.length} خيارات
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
                  className="rounded-lg min-h-[80px]"
                />

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">الخيارات</label>
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateOption(q.id, opt.id, { isCorrect: !opt.isCorrect })
                        }
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all shrink-0",
                          opt.isCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 hover:border-slate-400"
                        )}
                      >
                        {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                        placeholder="نص الخيار..."
                        className="flex-1 rounded-lg"
                        disabled={q.type === "true_false"}
                      />
                      {q.type !== "true_false" && q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(q.id, opt.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.type !== "true_false" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(q.id)}
                      className="text-xs rounded-lg mt-1"
                    >
                      <Plus className="w-3 h-3 ml-1" /> إضافة خيار
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    شرح الإجابة (اختياري)
                  </label>
                  <Input
                    value={q.explanation || ""}
                    onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                    placeholder="شرح يظهر بعد الإجابة..."
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(quizTypeConfig) as [QuizType, typeof quizTypeConfig[QuizType]][]).map(
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
