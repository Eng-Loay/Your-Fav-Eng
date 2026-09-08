"use client"

import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { BookOpen, Users, Star, ArrowUpRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"

export default function InstructorsSection() {
  const { locale, t } = useI18n()
  const { data: apiInstructors, loading } = useApi(() => api.getFeaturedInstructors())
  const instructors = (() => {
    if (!apiInstructors || !Array.isArray(apiInstructors) || apiInstructors.length === 0) return []
    return apiInstructors.map((i: Record<string, unknown>) => ({
      id: String(i.id ?? ""),
      nameAr: (i.nameAr as string) || (i.name as string) || "",
      nameEn: (i.nameEn as string) || (i.name as string) || "",
      titleAr: (i.titleAr as string) || (i.title as string) || "",
      titleEn: (i.titleEn as string) || (i.title as string) || "",
      avatar: (i.avatar as string) || "/user-avatar.png",
      courses: Number(i.courses ?? 0),
      students: Number(i.students ?? 0),
      rating: Number(i.rating ?? 4.5),
    }))
  })()

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-red-50/40 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center lg:mb-20"
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-medex-red">
            {t("instructors.title")}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl lg:text-5xl font-display">
            {t("instructors.subtitle")}
          </h2>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
            {locale === "ar" ? "تعلم من أفضل الخبراء في رعاية وتعليم طب الأسنان" : "Learn from the best experts in dental care and education"}
          </p>
        </m.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-medex-red border-t-transparent" />
            </div>
          ) : instructors.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {locale === "ar" ? "لا يوجد مدربون متاحون" : "No instructors available"}
            </div>
          ) : instructors.map((instructor, i) => {
            const name = locale === "ar" ? instructor.nameAr : instructor.nameEn
            const title = locale === "ar" ? instructor.titleAr : instructor.titleEn

            return (
              <Link key={instructor.id} href={`/instructors/${instructor.id}`}>
              <m.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-medex-red/20 cursor-pointer"
              >
                <div className="h-20 bg-gradient-to-r from-medex-red/5 to-red-50 relative overflow-hidden">
                  <div className="absolute -top-4 -end-4 h-16 w-16 rounded-full bg-medex-red/10" />
                </div>

                <div className="flex justify-center -mt-10">
                  <m.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: "backOut" }}
                    className="relative"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-gray-100 transition-all duration-300 group-hover:ring-medex-red/20">
                      <Image
                        src={instructor.avatar}
                        alt={name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -end-0.5 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-400" />
                  </m.div>
                </div>

                <div className="px-5 pb-6 pt-4 text-center">
                  <h3 className="mb-1 text-lg font-bold text-medex-dark transition-colors group-hover:text-medex-red">
                    {name}
                  </h3>
                  <p className="mb-4 text-sm font-medium text-gray-400">{title}</p>

                  <div className="mb-4 flex items-center justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${
                          idx < Math.round(instructor.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="ms-1.5 text-sm font-bold text-medex-dark">{instructor.rating}</span>
                  </div>

                  <div className="flex items-center justify-center gap-5 rounded-xl bg-gray-50 px-4 py-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-medex-red/50" />
                        <span className="text-base font-bold text-medex-dark">{instructor.courses}</span>
                      </div>
                      <p className="text-[10px] font-medium text-gray-400">{t("instructors.coursesCount")}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5 text-medex-red/50" />
                        <span className="text-base font-bold text-medex-dark">
                          {instructor.students >= 1000 ? `${(instructor.students / 1000).toFixed(1)}K` : instructor.students}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-gray-400">{t("instructors.studentsCount")}</p>
                    </div>
                  </div>
                </div>

                <m.div
                  className="absolute end-3 top-24 flex h-8 w-8 items-center justify-center rounded-full bg-medex-red/10 text-medex-red opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  whileHover={{ scale: 1.1 }}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </m.div>
              </m.div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
