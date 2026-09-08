"use client"

import { m } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type CategoryGroup = {
  id: string
  title: string
  origin: string
  color: string
  items: string[]
  href: string
}

const categoryGroups: CategoryGroup[] = [
  {
    id: "bb",
    title: "B&B Dental",
    origin: "Italy",
    color: "from-red-500 to-rose-600",
    items: ["Implant Systems", "Titanium Abutments", "Digital Dentistry", "Surgical Kits", "Multi-Unit Solutions"],
    href: "/store",
  },
  {
    id: "macros",
    title: "Macros Implants",
    origin: "Turkey",
    color: "from-blue-500 to-indigo-600",
    items: ["Implant Fixtures", "Abutments", "Healing Caps", "Impression Copings", "Surgical Tools"],
    href: "/store",
  },
  {
    id: "powerbone",
    title: "Powerbone",
    origin: "Turkey",
    color: "from-emerald-500 to-teal-600",
    items: ["Implant Fixtures", "Abutments", "Healing Caps", "Multi-Unit Solutions", "Surgical Kits"],
    href: "/store",
  },
  {
    id: "mctbio",
    title: "MCTBIO Mplant",
    origin: "Korea",
    color: "from-violet-500 to-purple-600",
    items: ["Implant Fixtures", "Titanium Abutments", "Healing Caps", "Digital Dentistry", "Multi-Unit"],
    href: "/store",
  },
  {
    id: "biomaterials",
    title: "Biomaterials",
    origin: "Turkey & Italy",
    color: "from-amber-500 to-orange-600",
    items: ["Dora Allograft", "B&B Membrane & Bone", "Powerbone Bone Graft"],
    href: "/store",
  },
]

export function HomeCategoryGrid() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  return (
    <section className="relative bg-gray-50 py-16 sm:py-20 lg:py-24" aria-labelledby="medex-categories-heading">
      <div className="container relative mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center lg:mb-16"
        >
          <span className="inline-block mb-4 text-sm font-semibold uppercase tracking-wider text-medex-red">
            {isAr ? "خطوط منتجاتنا" : "Our Product Lines"}
          </span>
          <h2
            id="medex-categories-heading"
            className="font-medex text-3xl font-bold tracking-tight text-medex-dark sm:text-4xl lg:text-5xl"
          >
            {isAr ? "حلول طب الأسنان المتميزة" : "Premium Dental Solutions"}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            {isAr ? "استكشف مجموعتنا الشاملة من منتجات طب الأسنان من مصنعين عالميين" : "Explore our comprehensive range of dental products from world-class manufacturers"}
          </p>
        </m.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryGroups.map((group, index) => (
            <m.div
              key={group.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Link
                href={group.href}
                className="group flex h-full flex-col rounded-2xl bg-white border border-gray-200/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-medex-red/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${group.color} px-3 py-1.5`}>
                    <span className="text-xs font-bold text-white">{group.title}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{group.origin}</span>
                </div>
                <ul className="flex-1 space-y-2 mb-4">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-medex-red/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-sm font-semibold text-medex-red group-hover:gap-2 transition-all">
                  {isAr ? "عرض المنتجات" : "View Products"}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-xl bg-medex-red px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-medex-red-dark"
          >
            {isAr ? "عرض جميع المنتجات" : "View All Products"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </m.div>
      </div>
    </section>
  )
}
