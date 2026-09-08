"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { m, AnimatePresence } from "framer-motion"
import { BookOpen, Users, Star, Sparkles, GraduationCap, School } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { resolveImageUrl } from "@/lib/utils"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

type RoleFilter = "all" | "INSTRUCTOR" | "TEACHER"

export default function InstructorsPage() {
  const { locale, dir, t } = useI18n()
  const router = useRouter()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [instructorsEnabled, setInstructorsEnabled] = useState(true)

  useEffect(() => {
    api.getInstructorsStatus().then((r) => {
      if (r.success && r.data) setInstructorsEnabled(r.data.enabled === true)
    }).catch(() => {})
    const onToggle = () => api.getInstructorsStatus().then((r) => r.success && r.data && setInstructorsEnabled(r.data.enabled === true))
    window.addEventListener("instructors-toggle", onToggle)
    return () => window.removeEventListener("instructors-toggle", onToggle)
  }, [])

  useEffect(() => {
    if (!instructorsEnabled) router.replace("/")
  }, [instructorsEnabled, router])

  const { data: apiInstructors, loading } = useApi(
    () => api.listInstructors({ role: roleFilter === "all" ? undefined : roleFilter, limit: 100 }),
    { deps: [roleFilter] }
  )

  const instructors = (() => {
    if (!apiInstructors || !Array.isArray(apiInstructors)) return []
    return apiInstructors.map((i: Record<string, unknown>) => ({
      id: String(i.id ?? ""),
      nameAr: (i.nameAr as string) || (i.name as string) || "",
      nameEn: (i.nameEn as string) || (i.name as string) || "",
      titleAr: (i.titleAr as string) || (i.title as string) || "",
      titleEn: (i.titleEn as string) || (i.title as string) || "",
      avatar: (i.avatar as string) || "/user-avatar.png",
      role: (i.role as string) || "INSTRUCTOR",
      courses: Number(i.courses ?? 0),
      students: Number(i.students ?? 0),
      rating: Number(i.rating ?? 4.5),
    }))
  })()

  const roleFilters: { value: RoleFilter; labelAr: string; labelEn: string }[] = [
    { value: "all", labelAr: "الكل", labelEn: "All" },
    { value: "INSTRUCTOR", labelAr: "مدربون", labelEn: "Instructors" },
    { value: "TEACHER", labelAr: "مدرسون", labelEn: "Teachers" },
  ]

  if (!instructorsEnabled) return null

  return (
    <div dir={dir} className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1d2856]/5 to-transparent" />
        <div className="container relative mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/90 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {locale === "ar" ? "المدربون والمدرسون" : "Instructors & Teachers"}
            </div>
            <h1 className="mb-4 text-4xl font-extrabold text-[#1d2856]">
              {locale === "ar" ? "تعرف على خبرائنا" : "Meet Our Experts"}
            </h1>
            <p className="mx-auto max-w-xl text-lg text-[#64748B]">
              {locale === "ar"
                ? "خبراء ميكانيكا يتحدثون الفرنسية ويقدمون أمثلة من الواقع العملي"
                : "Mechanics experts who speak French and provide real-world examples"}
            </p>
          </m.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-24">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {roleFilters.map((f) => {
            const active = roleFilter === f.value
            return (
              <m.button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
                  active
                    ? "bg-[#1d2856] text-white shadow-lg"
                    : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#1d2856]/35 hover:text-[#1d2856]"
                }`}
              >
                {locale === "ar" ? f.labelAr : f.labelEn}
              </m.button>
            )
          })}
        </m.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1d2856] border-t-transparent" />
            </div>
          ) : instructors.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white border border-[#E2E8F0]"
            >
              <GraduationCap className="h-16 w-16 text-[#94A3B8] mb-4" />
              <p className="text-xl font-bold text-[#0F172A]">
                {locale === "ar" ? "لا يوجد مدربون أو مدرسون" : "No instructors or teachers found"}
              </p>
            </m.div>
          ) : (
            <m.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {instructors.map((instructor, i) => {
                const name = locale === "ar" ? instructor.nameAr : instructor.nameEn
                const title = locale === "ar" ? instructor.titleAr : instructor.titleEn
                return (
                  <m.div
                    key={instructor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/instructors/${instructor.id}`}>
                      <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                            <Image
                              src={resolveImageUrl(instructor.avatar, "/user-avatar.png")}
                              alt={name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                              {instructor.role === "TEACHER" ? (
                                <School className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <GraduationCap className="h-3 w-3 text-blue-600" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-[#0F172A] group-hover:text-primary transition-colors truncate">
                              {name}
                            </h3>
                            <p className="text-sm text-[#64748B] truncate">{title}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-[#94A3B8]">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" /> {instructor.courses}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> {instructor.students}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {instructor.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                )
              })}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
