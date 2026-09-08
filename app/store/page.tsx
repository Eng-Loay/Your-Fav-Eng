"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Star,
  Tag,
  Package,
  X,
  ArrowLeft,
  Eye,
  FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Navbar } from "@/components/navbar/navbar"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { LoginRequiredDialog } from "@/components/ui/login-required-dialog"

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

const STORE_ENABLED_KEY = "lms_store_enabled"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

interface Product {
  id: string
  title: string
  titleAr?: string
  description?: string
  thumbnail?: string
  price: number
  currency?: string
  type?: string
  category?: string
  fileUrl?: string
  stock?: number | null
  status?: string
  seller?: { id: string; name: string; avatar?: string }
}

export default function StoreFrontPage() {
  const { locale } = useI18n()
  const { showToast, isLoggedIn } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [storeEnabled, setStoreEnabled] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  useEffect(() => {
    setStoreEnabled(localStorage.getItem(STORE_ENABLED_KEY) === "true")
    api.request("/settings/store-status").then((res) => {
      if (res.success) {
        const enabled = (res.data as any)?.enabled === true
        setStoreEnabled(enabled)
        localStorage.setItem(STORE_ENABLED_KEY, String(enabled))
      }
    }).catch(() => {})
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.request("/marketplace/products?limit=100")
      if (res.success) {
        const data = res.data as any
        const items = Array.isArray(data) ? data : data?.data || []
        setProducts(items)
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filtered = products.filter((p) => {
    const title = isAr && p.titleAr ? p.titleAr : p.title
    const matchSearch =
      !search ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  return (
    <>
      <Navbar />
      <LoginRequiredDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="bg-red-50 text-medex-red hover:bg-red-50 mb-4 text-sm px-4 py-1">
              <ShoppingBag className="w-4 h-4 ml-1" />
              {isAr ? "المتجر الإلكتروني" : "Online Store"}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {isAr ? "تسوق المنتجات" : "Shop Products"}
            </h1>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto">
              {isAr
                ? "اكتشف أفضل منتجات طب الأسنان من أشهر الماركات العالمية"
                : "Discover premium dental products from top international brands"}
            </p>
            {!storeEnabled && (
              <p className="mx-auto mt-3 max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                {isAr ? "المتجر معطل من الإعدادات حالياً، لكن التصفح متاح." : "Store is currently disabled in settings, but browsing is still available."}
              </p>
            )}
          </m.div>

          {/* Search + Filters */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-slate-200/60 shadow-sm flex-1 max-w-lg">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? "البحث في المنتجات..." : "Search products..."}
                  className="bg-transparent text-sm outline-none w-full text-slate-900 placeholder:text-slate-400"
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedCategory === cat
                        ? "border-medex-red bg-red-50 text-medex-red"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {cat === "all" ? (isAr ? "الكل" : "All") : cat}
                  </button>
                ))}
              </div>
            </div>
          </m.div>

          {/* Loading */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-slate-200 rounded-full w-1/3" />
                    <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                    <div className="h-3 bg-slate-200 rounded-full w-full" />
                    <div className="flex justify-between pt-3">
                      <div className="h-5 bg-slate-200 rounded-full w-20" />
                      <div className="h-9 bg-slate-200 rounded-lg w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">
                {isAr ? "لا توجد منتجات" : "No products found"}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {isAr ? "جرب تعديل البحث أو الفلتر" : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <m.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAr={isAr}
                  formatCurrency={formatCurrency}
                  apiBase={API_BASE}
                  onAddToCart={async () => {
                    if (!isLoggedIn) {
                      setLoginDialogOpen(true)
                      return
                    }
                    try {
                      const res = await api.addToCart({ productId: product.id, quantity: 1 })
                      if (res.success) {
                        showToast(isAr ? "تمت الإضافة للسلة" : "Added to cart")
                        window.dispatchEvent(new Event("cart-update"))
                      } else {
                        const isAuthError = res.message?.toLowerCase().includes("token") || res.message?.toLowerCase().includes("login") || res.message?.toLowerCase().includes("unauthorized")
                        if (isAuthError) setLoginDialogOpen(true)
                        else showToast(res.message || (isAr ? "حدث خطأ" : "Error"), "error")
                      }
                    } catch {
                      setLoginDialogOpen(true)
                    }
                  }}
                />
              ))}
            </m.div>
          )}
        </div>
      </div>
    </>
  )
}

function ProductCard({
  product,
  isAr,
  formatCurrency,
  apiBase,
  onAddToCart,
}: {
  product: Product
  isAr: boolean
  formatCurrency: (n: number) => string
  apiBase: string
  onAddToCart: () => void | Promise<void>
}) {
  const title = isAr && product.titleAr ? product.titleAr : product.title
  const isDigital = product.type === "DIGITAL"
  const imgSrc = product.thumbnail
    ? product.thumbnail.startsWith("http")
      ? product.thumbnail
      : product.thumbnail.startsWith("/")
        ? `${apiBase.replace(/\/api$/, "")}${product.thumbnail}`
        : product.thumbnail
    : null

  return (
    <m.div
      variants={fadeUp}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-xl hover:border-slate-300/80 transition-all duration-300"
    >
      {/* Image */}
      <Link href={`/store/${product.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-12 h-12 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {isDigital && (
            <div className="absolute top-3 start-3">
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                <FileDown className="w-3 h-3" /> {isAr ? "رقمي" : "Digital"}
              </span>
            </div>
          )}
          <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-slate-600">
              <Eye className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {product.category && (
          <Badge variant="secondary" className="text-[10px] mb-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-500">
            <Tag className="w-2.5 h-2.5 ml-0.5" /> {product.category}
          </Badge>
        )}

        <Link href={`/store/${product.id}`}>
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1.5 hover:text-medex-red transition-colors">
            {title}
          </h3>
        </Link>
        {product.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
        )}

        {product.seller?.name && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-medex-red text-[10px] font-bold">
              {product.seller.name.charAt(0)}
            </div>
            <span className="text-[11px] text-slate-400">{product.seller.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(product.price)}</span>
            {product.price === 0 && (
              <span className="text-xs text-emerald-600 font-semibold mr-1">{isAr ? "مجاني" : "Free"}</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onAddToCart()
            }}
            className="rounded-xl bg-medex-red hover:bg-medex-red-dark text-white h-9 px-4 gap-1.5 shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/25 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isAr ? "أضف للسلة" : "Add"}
          </Button>
        </div>

        {product.stock !== null && product.stock !== undefined && product.stock <= 5 && product.stock > 0 && product.type === "PHYSICAL" && (
          <p className="text-[10px] text-amber-600 font-medium mt-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {isAr ? `باقي ${product.stock} فقط!` : `Only ${product.stock} left!`}
          </p>
        )}
      </div>
    </m.div>
  )
}
