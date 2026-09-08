"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Package,
  ChevronLeft,
  FileDown,
  Shield,
  Truck,
  Check,
  Minus,
  Plus,
  ArrowLeft,
  Loader2,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Navbar } from "@/components/navbar/navbar"
import { api } from "@/hooks/use-api"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { LoginRequiredDialog } from "@/components/ui/login-required-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
  createdAt?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useI18n()
  const { showToast, isLoggedIn } = useStore()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [address, setAddress] = useState({ fullAddress: "", city: "", phone: "" })

  useEffect(() => {
    if (!params.id) return
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await api.request(`/marketplace/products/${params.id}`)
      if (res.success && res.data) {
        setProduct(res.data as Product)

        const prod = res.data as Product
        if (prod.category) {
          const relRes = await api.request(`/marketplace/products?category=${prod.category}&limit=4`)
          if (relRes.success) {
            const items = ((relRes.data as any)?.data || []).filter((p: Product) => p.id !== params.id)
            setRelatedProducts(items.slice(0, 3))
          }
        }
      } else {
        router.push("/store")
      }
    } catch {
      router.push("/store")
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = async (addressData?: { fullAddress: string; city: string; phone: string }) => {
    if (!product) return
    if (!isLoggedIn) {
      setLoginDialogOpen(true)
      return
    }
    const isPhysical = product.type === "PHYSICAL"
    if (isPhysical && !addressData) {
      setAddressDialogOpen(true)
      return
    }
    setOrdering(true)
    try {
      const body: { quantity: number; address?: Record<string, string> } = { quantity }
      if (isPhysical && addressData) {
        body.address = addressData
      }
      const res = await api.request(`/marketplace/products/${product.id}/order`, {
        method: "POST",
        body,
      })
      if (res.success) {
        showToast(isAr ? "تم الطلب بنجاح!" : "Order placed successfully!")
        if (product.type === "DIGITAL" && (res.data as any)?.product?.fileUrl) {
          window.open((res.data as any).product.fileUrl, "_blank")
        }
        setAddressDialogOpen(false)
        router.push("/store")
      } else {
        const isAuthError = (res.message as string)?.toLowerCase().includes("token") || (res.message as string)?.toLowerCase().includes("login") || (res.message as string)?.toLowerCase().includes("unauthorized")
        if (isAuthError) setLoginDialogOpen(true)
        else showToast(res.message || (isAr ? "حدث خطأ" : "Error"), "error")
      }
    } catch {
      setLoginDialogOpen(true)
    } finally {
      setOrdering(false)
    }
  }

  const handleAddressSubmit = () => {
    if (!address.fullAddress.trim() || !address.city.trim() || !address.phone.trim()) {
      showToast(isAr ? "يرجى إدخال جميع بيانات الشحن" : "Please enter all shipping details", "error")
      return
    }
    handleOrder(address)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aspect-square bg-slate-200 rounded-2xl" />
              <div className="space-y-4 py-4">
                <div className="h-4 bg-slate-200 rounded-full w-24" />
                <div className="h-8 bg-slate-200 rounded-full w-3/4" />
                <div className="h-4 bg-slate-200 rounded-full w-full" />
                <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                <div className="h-10 bg-slate-200 rounded-xl w-40 mt-6" />
                <div className="h-12 bg-slate-200 rounded-xl w-full mt-4" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!product) return null

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
  const title = isAr && product.titleAr ? product.titleAr : product.title
  const isDigital = product.type === "DIGITAL"
  const imgSrc = product.thumbnail
    ? product.thumbnail.startsWith("http")
      ? product.thumbnail
      : product.thumbnail.startsWith("/")
        ? `${API_BASE.replace(/\/api$/, "")}${product.thumbnail}`
        : product.thumbnail
    : null
  const inStock = product.type === "PHYSICAL" ? (product.stock ?? 0) > 0 : true

  return (
    <>
      <Navbar />
      <LoginRequiredDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "بيانات الشحن" : "Shipping Address"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullAddress">{isAr ? "العنوان الكامل" : "Full Address"}</Label>
              <Input
                id="fullAddress"
                value={address.fullAddress}
                onChange={(e) => setAddress((a) => ({ ...a, fullAddress: e.target.value }))}
                placeholder={isAr ? "الشارع، الحي، الرمز البريدي" : "Street, District, Postal Code"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">{isAr ? "المدينة" : "City"}</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                placeholder={isAr ? "المدينة" : "City"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input
                id="phone"
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                placeholder={isAr ? "05xxxxxxxx" : "05xxxxxxxx"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddressSubmit} disabled={ordering}>
              {ordering ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تأكيد الطلب" : "Confirm Order")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Breadcrumb */}
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-slate-500 mb-8"
          >
            <Link href="/store" className="hover:text-medex-red transition-colors">
              {isAr ? "المتجر" : "Store"}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" style={{ transform: isAr ? "" : "rotate(180deg)" }} />
            <span className="text-slate-900 font-medium truncate max-w-xs">{title}</span>
          </m.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Product Image */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 shadow-sm">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-24 h-24 text-slate-200" />
                  </div>
                )}
              </div>
              {isDigital && (
                <div className="absolute top-4 start-4">
                  <span className="px-3 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-500/25">
                    <FileDown className="w-4 h-4" /> {isAr ? "منتج رقمي" : "Digital Product"}
                  </span>
                </div>
              )}
            </m.div>

            {/* Product Details */}
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              {product.category && (
                <Badge variant="secondary" className="text-xs mb-3 bg-slate-100 hover:bg-slate-100 w-fit">
                  <Tag className="w-3 h-3 ml-1" /> {product.category}
                </Badge>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{title}</h1>

              {product.seller && (
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-medex-red text-sm font-bold">
                    {product.seller.name.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-500">{product.seller.name}</span>
                </div>
              )}

              {product.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{product.description}</p>
              )}

              {/* Price */}
              <div className="bg-gradient-to-l from-red-50/50 to-white rounded-xl border border-red-100 p-5 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
                  {product.price === 0 && (
                    <span className="text-sm text-emerald-600 font-bold">{isAr ? "مجاني" : "Free"}</span>
                  )}
                </div>
                {!isDigital && product.stock !== null && product.stock !== undefined && (
                  <p className={`text-xs mt-1.5 ${inStock ? "text-emerald-600" : "text-red-500"}`}>
                    {inStock
                      ? isAr ? `متوفر (${product.stock} بالمخزون)` : `In stock (${product.stock} available)`
                      : isAr ? "نفذ المخزون" : "Out of stock"
                    }
                  </p>
                )}
              </div>

              {/* Quantity (for physical) */}
              {!isDigital && inStock && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-slate-700">{isAr ? "الكمية" : "Quantity"}</span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex items-center justify-center w-10 h-10 hover:bg-slate-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                      className="flex items-center justify-center w-10 h-10 hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mb-8">
                <Link href="/contact" className="flex-1">
                  <Button className="w-full gap-2 rounded-xl bg-mds-primary hover:opacity-90 text-white h-12 text-sm font-bold">
                    {isAr ? "تواصل للطلب" : "Contact to Order"}
                  </Button>
                </Link>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isDigital ? (
                  <>
                    <Feature icon={FileDown} text={isAr ? "تحميل فوري" : "Instant Download"} />
                    <Feature icon={Shield} text={isAr ? "دفع آمن" : "Secure Payment"} />
                    <Feature icon={Check} text={isAr ? "وصول دائم" : "Lifetime Access"} />
                  </>
                ) : (
                  <>
                    <Feature icon={Truck} text={isAr ? "شحن سريع" : "Fast Shipping"} />
                    <Feature icon={Shield} text={isAr ? "دفع آمن" : "Secure Payment"} />
                    <Feature icon={Check} text={isAr ? "ضمان الجودة" : "Quality Guarantee"} />
                  </>
                )}
              </div>
            </m.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {isAr ? "منتجات مشابهة" : "Related Products"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((p) => (
                  <Link key={p.id} href={`/store/${p.id}`}>
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={isAr && p.titleAr ? p.titleAr : p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-10 h-10 text-slate-200" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {isAr && p.titleAr ? p.titleAr : p.title}
                        </h3>
                        <p className="text-sm font-bold text-medex-red mt-2">{formatCurrency(p.price)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </m.div>
          )}
        </div>
      </div>
    </>
  )
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <Icon className="w-4 h-4 text-medex-red shrink-0" />
      <span className="text-xs text-slate-600 font-medium">{text}</span>
    </div>
  )
}
