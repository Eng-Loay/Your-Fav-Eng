"use client"

import Image from "next/image"
import { m } from "framer-motion"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { MEDEX_MARKETING_IMAGES } from "@/components/marketing/medex-marketing-images"

type FacultyRow = {
  id: string
  name: string
  role: string
  bio: string
  avatar: string
  offset?: boolean
}

export function MarketingFacultySection() {
  const { locale, t } = useI18n()
  const { data: apiInstructors, loading } = useApi(() => api.getFeaturedInstructors())

  const faculty: FacultyRow[] = (() => {
    if (apiInstructors && Array.isArray(apiInstructors) && apiInstructors.length >= 2) {
      return apiInstructors.slice(0, 2).map((raw: Record<string, unknown>, i: number) => ({
        id: String(raw.id ?? i),
        name:
          locale === "ar"
            ? String(raw.nameAr ?? raw.name ?? "")
            : String(raw.nameEn ?? raw.name ?? ""),
        role:
          locale === "ar"
            ? String(raw.titleAr ?? raw.title ?? "")
            : String(raw.titleEn ?? raw.title ?? ""),
        bio:
          locale === "ar"
            ? String(raw.bioAr ?? raw.bio ?? "").slice(0, 220) ||
              String(raw.titleAr ?? raw.title ?? "")
            : String(raw.bioEn ?? raw.bio ?? "").slice(0, 220) ||
              String(raw.titleEn ?? raw.title ?? ""),
        avatar: (raw.avatar as string) || "/user-avatar.png",
        offset: i === 1,
      }))
    }
    return [
      {
        id: "s1",
        name: t("marketing.facultyStatic1Name"),
        role: t("marketing.facultyStatic1Role"),
        bio: t("marketing.facultyStatic1Bio"),
        avatar: MEDEX_MARKETING_IMAGES.faculty1,
        offset: false,
      },
      {
        id: "s2",
        name: t("marketing.facultyStatic2Name"),
        role: t("marketing.facultyStatic2Role"),
        bio: t("marketing.facultyStatic2Bio"),
        avatar: MEDEX_MARKETING_IMAGES.faculty2,
        offset: true,
      },
    ]
  })()

  return (
    <section className="mds-tonal-layering-2 overflow-hidden py-24">
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <m.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-mds-primary">
              {t("marketing.facultyEyebrow")}
            </span>
            <h2 className="mb-8 text-4xl font-bold tracking-tight text-mds-on-background md:text-5xl">
              {t("marketing.facultyTitle")}
            </h2>
            <div className="space-y-8">
              {loading ? (
                <div className="flex py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-mds-primary border-t-transparent" />
                </div>
              ) : (
                faculty.map((person) => (
                  <div
                    key={person.id}
                    className={`flex items-start gap-6 rounded-lg border border-mds-outline-variant/10 bg-mds-surface-container-lowest p-6 shadow-sm ${
                      person.offset ? "lg:translate-x-4 rtl:lg:-translate-x-4" : ""
                    }`}
                  >
                    <Image
                      src={person.avatar}
                      alt=""
                      width={96}
                      height={96}
                      className="h-24 w-24 shrink-0 rounded-md object-cover"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-mds-on-background">{person.name}</h4>
                      <p className="mb-2 text-xs font-bold text-mds-primary">{person.role}</p>
                      <p className="text-sm text-mds-on-surface-variant">{person.bio}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </m.div>

          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-full bg-mds-primary opacity-5 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <m.div
                className="aspect-[4/5] overflow-hidden rounded-xl shadow-2xl lg:translate-y-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={MEDEX_MARKETING_IMAGES.facultyGrid1}
                  alt=""
                  width={400}
                  height={500}
                  className="h-full w-full object-cover"
                />
              </m.div>
              <m.div
                className="aspect-[4/5] overflow-hidden rounded-xl shadow-2xl"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Image
                  src={MEDEX_MARKETING_IMAGES.facultyGrid2}
                  alt=""
                  width={400}
                  height={500}
                  className="h-full w-full object-cover"
                />
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
