"use client"

import { CheckCircle2, XCircle, ExternalLink, Users, UserX, Trophy } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  type: string
  question: string
  options: QuestionOption[]
}

export interface SubmissionRow {
  id: string
  studentId: string
  content?: string | null
  fileUrl?: string | null
  grade?: number | null
  feedback?: string | null
  autoGraded?: boolean
  submittedAt: string
  student?: { id: string; name: string; email?: string | null } | null
}

export interface SubmissionsAssignment {
  title: string
  gradingType?: string
  totalPoints?: number | null
  content?: string | null
  submissions: SubmissionRow[]
  notSubmitted?: Array<{ id: string; name: string; email?: string | null }>
}

function parseQuestions(content?: string | null): Question[] {
  if (!content) return []
  try {
    const parsed = JSON.parse(content) as { questions?: Question[] }
    return Array.isArray(parsed.questions) ? parsed.questions : []
  } catch {
    return []
  }
}

function parseAnswers(content?: string | null): Record<string, string | string[]> {
  if (!content) return {}
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function selectedIds(answer: string | string[] | undefined): string[] {
  if (Array.isArray(answer)) return answer
  return answer ? [answer] : []
}

function isCorrect(q: Question, answer: string | string[] | undefined) {
  const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort()
  const given = selectedIds(answer).slice().sort()
  return correct.length > 0 && given.length === correct.length && given.every((id, i) => id === correct[i])
}

const fmtDate = (iso: string, ar: boolean) =>
  new Date(iso).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })

/** Read-only list of who submitted an assignment and what they answered. Auto-graded homework shows a per-question breakdown. */
export function SubmissionsView({ assignment }: { assignment: SubmissionsAssignment }) {
  const { locale } = useI18n()
  const ar = locale === "ar"
  const questions = assignment.gradingType === "AUTO" ? parseQuestions(assignment.content) : []
  const total = assignment.totalPoints ?? 100
  const graded = assignment.submissions.filter((s) => s.grade != null)
  const average = graded.length ? graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length : null
  const notSubmitted = assignment.notSubmitted ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-4">
          <Users className="mb-2 h-5 w-5 text-[#059669]" />
          <p className="text-xl font-bold text-[#0F172A]">{assignment.submissions.length}</p>
          <p className="text-xs text-[#64748B]">{ar ? "سلّموا" : "Submitted"}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-4">
          <UserX className="mb-2 h-5 w-5 text-[#F59E0B]" />
          <p className="text-xl font-bold text-[#0F172A]">{notSubmitted.length}</p>
          <p className="text-xs text-[#64748B]">{ar ? "لسه ما سلّموش" : "Not yet"}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-4">
          <Trophy className="mb-2 h-5 w-5 text-[#8B5CF6]" />
          <p className="text-xl font-bold text-[#0F172A]">{average != null ? `${Math.round(average * 10) / 10}/${total}` : "—"}</p>
          <p className="text-xs text-[#64748B]">{ar ? "متوسط الدرجات" : "Average"}</p>
        </div>
      </div>

      {assignment.submissions.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-10 text-center text-[#64748B]">
          {ar ? "لسه محدش سلّم الواجب ده" : "No one has submitted this assignment yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {assignment.submissions.map((s) => {
            const answers = parseAnswers(s.content)
            const correctCount = questions.filter((q) => isCorrect(q, answers[q.id])).length
            return (
              <details key={s.id} className="group rounded-2xl border border-[#E2E8F0]/60 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">{s.student?.name ?? "—"}</p>
                    <p className="truncate text-xs text-[#94A3B8]">
                      {s.student?.email ? `${s.student.email} · ` : ""}
                      {fmtDate(s.submittedAt, ar)}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-bold text-[#8B5CF6]">
                      {s.grade != null ? `${Math.round(s.grade * 10) / 10}/${total}` : ar ? "بدون درجة" : "Not graded"}
                    </p>
                    {questions.length > 0 && (
                      <p className="text-xs text-[#64748B]">
                        {correctCount}/{questions.length} {ar ? "صح" : "correct"}
                      </p>
                    )}
                  </div>
                </summary>

                <div className="space-y-3 border-t border-[#E2E8F0]/60 p-4">
                  {questions.length > 0 ? (
                    questions.map((q, idx) => {
                      const picked = selectedIds(answers[q.id])
                      const ok = isCorrect(q, answers[q.id])
                      return (
                        <div key={q.id} className="rounded-xl bg-[#F8FAFC] p-3">
                          <p className="mb-2 flex items-start gap-2 text-sm font-medium text-[#0F172A]">
                            {ok ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                            )}
                            <span>
                              {idx + 1}. {q.question}
                            </span>
                          </p>
                          <ul className="space-y-1">
                            {q.options.map((o) => {
                              const chosen = picked.includes(o.id)
                              const tone = o.isCorrect
                                ? "bg-[#059669]/10 text-[#047857]"
                                : chosen
                                  ? "bg-[#EF4444]/10 text-[#B91C1C]"
                                  : "text-[#64748B]"
                              return (
                                <li key={o.id} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs ${tone}`}>
                                  <span>{o.text}</span>
                                  <span className="shrink-0 font-semibold">
                                    {chosen ? (ar ? "اختياره" : "Chosen") : ""}
                                    {chosen && o.isCorrect ? " ✓" : ""}
                                    {!chosen && o.isCorrect ? (ar ? "الصح" : "Correct") : ""}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                          {picked.length === 0 && (
                            <p className="mt-1 text-xs text-[#94A3B8]">{ar ? "ما جاوبش على السؤال ده" : "No answer"}</p>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <>
                      {s.content && <p className="whitespace-pre-wrap rounded-xl bg-[#F8FAFC] p-3 text-sm text-[#334155]">{s.content}</p>}
                      {s.fileUrl && (
                        <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {ar ? "عرض الملف المرفق" : "View attached file"}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {notSubmitted.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0]/60 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-[#0F172A]">{ar ? "لسه ما سلّموش" : "Haven't submitted yet"}</h3>
          <div className="flex flex-wrap gap-2">
            {notSubmitted.map((u) => (
              <span key={u.id} className="rounded-full bg-[#FEF3C7] px-3 py-1.5 text-xs font-medium text-[#92400E]">
                {u.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
