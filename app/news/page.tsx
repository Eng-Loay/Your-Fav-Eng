"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { m } from "framer-motion"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { useI18n } from "@/lib/i18n"
import { api } from "@/hooks/use-api"
import { ArrowRight, Calendar } from "lucide-react"

interface NewsItem {
  id: string
  title: string
  content?: string
  image?: string
  createdAt: string
  slug?: string
}

export default function NewsPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<NewsItem[]>([])

  useEffect(() => {
    api.request("/settings/content?type=BLOG&limit=20")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || []
        setItems(list)
      })
      .catch(() => {})
  }, [])

  const news = items

  return (
    <main>
      <Navbar />
      <section className="mds-tonal-layering-1 pt-28 pb-16">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mds-tertiary">News</p>
            <h1 className="mb-4 font-display text-4xl font-bold text-mds-on-background md:text-5xl">
              {t("marketing.newsTitle")}
            </h1>
            <p className="max-w-2xl text-lg text-mds-on-surface-variant">{t("marketing.newsSubtitle")}</p>
          </m.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          {news.length === 0 && (
            <p className="text-center text-mds-on-surface-variant">
              {t("marketing.noNews")}
            </p>
          )}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item, i) => (
              <m.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group flex flex-col overflow-hidden rounded-lg border border-mds-outline-variant/30 bg-white shadow-sm"
              >
                {item.image ? (
                  <div className="relative h-48">
                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="400px" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-mds-primary/10 to-mds-tertiary/10" />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center gap-2 text-xs text-mds-on-surface-variant">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <h2 className="mb-3 text-lg font-bold text-mds-on-background group-hover:text-mds-primary">{item.title}</h2>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-mds-on-surface-variant line-clamp-3">
                    {item.content}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-mds-primary">
                    {t("marketing.readMore")}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </m.article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
