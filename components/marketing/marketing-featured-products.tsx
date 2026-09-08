"use client"

import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { Box, ChevronRight, Package, ShoppingBag } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useApi, api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { MEDEX_MARKETING_IMAGES } from "@/components/marketing/medex-marketing-images"

const FALLBACK_IMAGES = [
  MEDEX_MARKETING_IMAGES.course1,
  MEDEX_MARKETING_IMAGES.course2,
  MEDEX_MARKETING_IMAGES.course3,
] as const

type RowProduct = {
  id: string
  href: string
  title: string
  description: string
  image: string
  categoryLine: string
  typeLine: string
  price: number
}

export function MarketingFeaturedProducts() {
  const { locale, dir } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const { data: apiProducts, loading } = useApi(() => api.getProducts({ featured: true, limit: 24 }))
  const isAr = locale === "ar"

  const rows: RowProduct[] = (() => {
    const list = Array.isArray(apiProducts)
      ? (apiProducts as Record<string, unknown>[])
      : apiProducts && typeof apiProducts === "object" && Array.isArray((apiProducts as { data?: unknown[] }).data)
        ? ((apiProducts as { data: Record<string, unknown>[] }).data)
        : []
    const featuredOnly = list.filter((p) => p && typeof p === "object" && p.featured === true)
    const source = featuredOnly.length > 0 ? featuredOnly : list

    if (source.length > 0) {
      return source.slice(0, 3).map((p: Record<string, unknown>, i: number) => {
        const id = String(p.id ?? "")
        const title = isAr ? String(p.titleAr ?? p.title ?? "") : String(p.title ?? p.titleAr ?? "")
        const description = String(p.description ?? "—").slice(0, 160)
        const image = (p.thumbnail as string) || FALLBACK_IMAGES[i % 3]
        const categoryLine = String(p.category ?? (isAr ? "منتج رقمي" : "Digital product"))
        const typeLine = String(p.type ?? "DIGITAL").toUpperCase() === "PHYSICAL"
          ? (isAr ? "منتج مادي" : "Physical")
          : (isAr ? "منتج رقمي" : "Digital")
        return {
          id,
          href: `/store/${id}`,
          title: title || (isAr ? "منتج" : "Product"),
          description,
          image,
          categoryLine,
          typeLine,
          price: Number(p.price ?? 0),
        }
      })
    }

    return [
      {
        id: "p1",
        href: "/store",
        title: isAr ? "حزمة قوالب المحتوى" : "Content Templates Bundle",
        description: isAr ? "مجموعة قوالب جاهزة تساعدك على إنتاج محتوى أسرع." : "A ready-made templates set to create content faster.",
        image: FALLBACK_IMAGES[0],
        categoryLine: isAr ? "قوالب" : "Templates",
        typeLine: isAr ? "منتج رقمي" : "Digital",
        price: 79,
      },
      {
        id: "p2",
        href: "/store",
        title: isAr ? "دليل الهوية البصرية" : "Brand Identity Guide",
        description: isAr ? "ملف عملي لتنظيم الألوان والخطوط والهوية بسهولة." : "A practical guide to organize colors, typography, and identity.",
        image: FALLBACK_IMAGES[1],
        categoryLine: isAr ? "أدلة" : "Guides",
        typeLine: isAr ? "منتج رقمي" : "Digital",
        price: 49,
      },
      {
        id: "p3",
        href: "/store",
        title: isAr ? "حزمة مجتمع واتساب" : "WhatsApp Community Kit",
        description: isAr ? "نماذج ورسائل جاهزة لإدارة مجتمعك باحترافية." : "Ready-to-use assets and scripts for community management.",
        image: FALLBACK_IMAGES[2],
        categoryLine: isAr ? "مجتمعات" : "Community",
        typeLine: isAr ? "منتج رقمي" : "Digital",
        price: 99,
      },
    ]
  })()

  return (
    <section className="py-24 mds-tonal-layering-1">
      <div className="mx-auto max-w-screen-2xl px-8">
        <m.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-mds-primary">
            {isAr ? "منتجات مميزة" : "FEATURED PRODUCTS"}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tighter text-mds-on-background md:text-6xl">
            {isAr ? "منتجات مختارة لتنمية مشروعك" : "Curated products for your brand growth"}
          </h2>
        </m.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-mds-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {rows.map((product, i) => (
              <m.article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-lg bg-mds-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-2xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute start-4 top-4 rounded-md bg-white/90 px-3 py-1 text-[10px] font-bold text-mds-primary backdrop-blur">
                    {product.typeLine}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-mds-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Box className="h-3.5 w-3.5" />
                      {product.categoryLine}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {product.typeLine}
                    </span>
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-mds-on-background transition-colors group-hover:text-mds-primary">
                    {product.title}
                  </h3>
                  <p className="mb-8 line-clamp-3 text-sm text-mds-on-surface-variant">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-mds-surface-container-low pt-6">
                    <span className="text-lg font-bold text-mds-on-background">
                      {product.price > 0 ? formatCurrency(product.price) : (isAr ? "مجاني" : "Free")}
                    </span>
                    <Link
                      href={product.href}
                      className="flex items-center gap-1 text-sm font-bold text-mds-primary"
                    >
                      {isAr ? "تسوق الآن" : "Shop now"}
                      <ChevronRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                </div>
              </m.article>
            ))}
          </div>
        )}

        <m.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-md bg-mds-primary px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" />
            {isAr ? "تصفح كل المنتجات" : "Browse all products"}
          </Link>
        </m.div>
      </div>
    </section>
  )
}
