"use client"

import { useState, useEffect, useMemo, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  User,
  Mail,
  Phone,
  Sparkles,
  Smartphone,
  Wallet,
  Banknote,
  Send,
  Tag,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { useApi, api } from "@/hooks/use-api"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AnimatedPageHero } from "@/components/ui/animated-page-hero"

type PaymentMethod = "credit-card" | "fawry" | "vodafone-cash" | "bank-transfer" | "admin-approval" | "coupon"

interface FormFields {
  name: string
  email: string
  phone: string
  address: string
  cardNumber: string
  expiry: string
  cvv: string
  fawryPhone: string
  vodafoneNumber: string
  couponCode: string
}

const emptyForm: FormFields = {
  name: "",
  email: "",
  phone: "",
  address: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  fawryPhone: "",
  vodafoneNumber: "",
  couponCode: "",
}

type CourseItem = {
  id: string
  courseId?: string
  productId?: string
  thumbnail: string
  titleAr: string
  titleEn: string
  instructorAr: string
  instructorEn: string
  instructorAvatar: string
  rating: number
  students: number
  price: number
  originalPrice: number
  quantity?: number
}

export default function CheckoutPage() {
  const { locale, dir, t } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const { cart, checkout: storeCheckout, isLoggedIn, user, refreshPurchased, showToast, clearCart } = useStore()
  const router = useRouter()
  const isRTL = dir === "rtl"

  const { data: apiCart } = useApi(
    () => (isLoggedIn ? api.getCart() : Promise.resolve({ success: false })),
    { deps: [isLoggedIn], immediate: isLoggedIn }
  )

  const { data: paymentMethodsRes } = useApi(
    () => api.getPaymentMethods(),
    { immediate: true }
  )
  const pm = (paymentMethodsRes as { stripe?: boolean; paypal?: boolean; tap?: boolean; adminApproval?: boolean; coupon?: boolean }) ?? {}

  const toStringOrName = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
      return String((val as { name: string }).name)
    return ""
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
  const cartData = apiCart as { items?: Array<{ id: string; courseId?: string; productId?: string; course?: Record<string, unknown>; product?: { id: string; title: string; titleAr?: string; thumbnail?: string; price: number; type?: string }; title?: string; calculatedPrice?: number; quantity?: number }> } | null
  const hasPhysicalProducts = useMemo(() => {
    return cartData?.items?.some((i) => {
      if (!i.productId || !i.product) return false
      const t = (i.product as { type?: string }).type?.toUpperCase?.()
      return t === "PHYSICAL"
    }) ?? false
  }, [cartData])
  const mockCartItems = useMemo((): CourseItem[] => {
    if (isLoggedIn && cartData?.items) {
      const items = cartData?.items ?? []
      const courseItems = items
        .filter((i) => i.courseId && i.course)
        .map((i) => {
          const c = i.course as Record<string, unknown>
          return {
            id: String(c.id ?? i.courseId),
            courseId: String(c.id ?? i.courseId),
            thumbnail: (c.thumbnail as string) || "/course-1.png",
            titleAr: (c.titleAr as string) || (c.title as string) || "",
            titleEn: (c.titleEn as string) || (c.title as string) || "",
            instructorAr: toStringOrName(c.instructorAr) || toStringOrName(c.instructor) || "",
            instructorEn: toStringOrName(c.instructorEn) || toStringOrName(c.instructor) || "",
            instructorAvatar: (c.instructorAvatar as string) || "/user-avatar.png",
            rating: Number(c.averageRating ?? c.rating ?? 4.5),
            students: Number(c.totalStudents ?? c.students ?? 0),
            price: i.calculatedPrice ?? Number(c.discountPrice ?? c.price ?? 0),
            originalPrice: Number(c.price ?? 0),
            quantity: i.quantity ?? 1,
          }
        })
      const productItems = items
        .filter((i) => i.productId && i.product)
        .map((i) => {
          const p = i.product!
          const imgSrc = p.thumbnail?.startsWith("http") ? p.thumbnail : p.thumbnail?.startsWith("/") ? `${API_BASE.replace(/\/api$/, "")}${p.thumbnail}` : p.thumbnail || "/course-1.png"
          return {
            id: String(p.id),
            productId: String(p.id),
            thumbnail: imgSrc,
            titleAr: p.titleAr || p.title || "",
            titleEn: p.title || "",
            instructorAr: "",
            instructorEn: "",
            instructorAvatar: "/user-avatar.png",
            rating: 0,
            students: 0,
            price: i.calculatedPrice ?? p.price,
            originalPrice: p.price,
            quantity: i.quantity ?? 1,
          }
        })
      return [...courseItems, ...productItems]
    }
    return []
  }, [isLoggedIn, apiCart])

  useEffect(() => {
    if (!isLoggedIn) router.push("/login")
  }, [isLoggedIn, router])

  const [form, setForm] = useState<FormFields>(() => ({
    ...emptyForm,
    name: user?.name ?? "",
    email: user?.email ?? "",
    couponCode: "",
  }))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit-card")
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({})
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const updateField = (field: keyof FormFields, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const markTouched = (field: keyof FormFields) =>
    setTouched((prev) => ({ ...prev, [field]: true }))

  const getRequiredFields = (): (keyof FormFields)[] => {
    const base: (keyof FormFields)[] = ["name", "email", "phone"]
    if (hasPhysicalProducts) base.push("address")
    switch (paymentMethod) {
      case "credit-card":
        return [...base, "cardNumber", "expiry", "cvv"]
      case "fawry":
        return [...base, "fawryPhone"]
      case "vodafone-cash":
        return [...base, "vodafoneNumber"]
      case "coupon":
        return [...base, "couponCode"]
      case "admin-approval":
        return base
      default:
        return base
    }
  }

  const requiredFields = getRequiredFields()

  const isFieldInvalid = (field: keyof FormFields) =>
    touched[field] && !form[field].trim()

  const isFormValid = requiredFields.every((f) => form[f].trim())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const allTouched: Partial<Record<keyof FormFields, boolean>> = {}
    requiredFields.forEach((f) => { allTouched[f] = true })
    setTouched(allTouched)
    if (!isFormValid) return
    setProcessing(true)
    try {
      if (paymentMethod === "admin-approval" && pm.adminApproval) {
        const items = mockCartItems.length > 0
          ? mockCartItems.map((i) => (i.courseId ? { courseId: i.courseId } : i.productId ? { productId: i.productId } : { courseId: i.id })).filter((x) => (x as { courseId?: string }).courseId || (x as { productId?: string }).productId)
          : cart.filter((i) => i.courseId || i.productId).map((i) => (i.courseId ? { courseId: i.courseId } : { productId: i.productId! }))
        if (items.length === 0) {
          showToast(locale === "ar" ? "السلة فارغة. أضف دورات أو منتجات أولاً" : "Cart is empty. Add courses or products first", "error")
          return
        }
        const r = await api.createPaymentRequest(items)
        if (r.success) {
          clearCart()
          window.dispatchEvent(new Event("cart-update"))
          setSuccess(true)
        } else {
          showToast(r.message ?? (locale === "ar" ? "فشل" : "Failed"), "error")
        }
      } else if (paymentMethod === "coupon" && pm.coupon && form.couponCode.trim()) {
        const couponItems = mockCartItems
          .map((i) =>
            i.courseId
              ? { courseId: i.courseId, quantity: i.quantity ?? 1 }
              : i.productId
                ? { productId: i.productId, quantity: i.quantity ?? 1 }
                : null
          )
          .filter((x): x is { courseId: string; quantity?: number } | { productId: string; quantity?: number } => x !== null)
        const r = await api.checkoutWithCoupon(form.couponCode.trim(), couponItems.length > 0 ? couponItems : undefined)
        if (r.success) {
          clearCart()
          refreshPurchased()
          window.dispatchEvent(new Event("cart-update"))
          setSuccess(true)
        } else {
          showToast(r.message ?? (locale === "ar" ? "فشل" : "Failed"), "error")
        }
      } else if (paymentMethod === "credit-card" && pm.stripe) {
        const checkoutItems = mockCartItems.map((i) => ({
          courseId: i.courseId ?? undefined,
          productId: i.productId ?? undefined,
          quantity: i.quantity ?? 1,
        })).filter((x) => x.courseId || x.productId)
        if (checkoutItems.length === 0) {
          showToast(locale === "ar" ? "السلة فارغة. أضف دورات أو منتجات أولاً" : "Cart is empty. Add courses or products first", "error")
          return
        }
        const ok = await storeCheckout(checkoutItems)
        if (ok) setSuccess(true)
      } else {
        showToast(locale === "ar" ? "اختر طريقة دفع متاحة" : "Please select an available payment method", "error")
      }
    } finally {
      setProcessing(false)
    }
  }

  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price, 0)
  const total = subtotal
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  const inputCls = (field: keyof FormFields) =>
    cn(
      "h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 transition-all focus:bg-white/10 focus:border-white/20",
      isFieldInvalid(field) && "border-red-500/50 bg-red-500/10 focus:border-red-400"
    )

  const allPaymentMethods: { value: PaymentMethod; labelAr: string; labelEn: string; icon: typeof CreditCard; color: string; description: string; enabled?: boolean }[] = [
    { value: "credit-card", labelAr: "بطاقة ائتمان", labelEn: "Credit Card", icon: CreditCard, color: "from-primary to-primary/90", description: "Visa, Mastercard", enabled: pm.stripe },
    { value: "fawry", labelAr: "فوري", labelEn: "Fawry", icon: Banknote, color: "from-[#F59E0B] to-[#F97316]", description: locale === "ar" ? "ادفع من أقرب فرع" : "Pay at nearest branch", enabled: pm.tap },
    { value: "vodafone-cash", labelAr: "فودافون كاش", labelEn: "Vodafone Cash", icon: Smartphone, color: "from-[#DC2626] to-[#EF4444]", description: locale === "ar" ? "من محفظتك الإلكترونية" : "From your e-wallet", enabled: pm.tap },
    { value: "bank-transfer", labelAr: "تحويل بنكي", labelEn: "Bank Transfer", icon: Building2, color: "from-[#059669] to-[#10B981]", description: locale === "ar" ? "تحويل مباشر" : "Direct transfer", enabled: false },
    { value: "admin-approval", labelAr: "طلب موافقة الأدمن", labelEn: "Admin Approval", icon: Send, color: "from-[#8B5CF6] to-[#A78BFA]", description: locale === "ar" ? "إرسال طلب للموافقة" : "Submit request for approval", enabled: pm.adminApproval },
    { value: "coupon", labelAr: "الشراء بكوبون", labelEn: "Pay with Coupon", icon: Tag, color: "from-[#EC4899] to-[#F472B6]", description: locale === "ar" ? "أدخل كود الكوبون" : "Enter coupon code", enabled: pm.coupon },
  ]
  const paymentMethods = allPaymentMethods.filter((m) => m.enabled !== false)

  return (
    <div dir={dir} className="min-h-screen bg-black">
      <Navbar />

      <AnimatedPageHero
        badge={locale === "ar" ? "إتمام الشراء" : "Secure Checkout"}
        title={t("checkout.title")}
        subtitle={locale === "ar" ? "أكمل بياناتك لإتمام عملية الشراء بأمان" : "Complete your information to finish your purchase securely"}
        compact
        dark
      />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8 pb-24 sm:pb-10">
        <AnimatePresence mode="wait">
          {success ? (
            <m.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-16 sm:py-24"
            >
              <div className="mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-emerald-500/80">
                <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white"
              >
                {locale === "ar" ? "تم تأكيد الطلب!" : "Order Confirmed!"}
              </h2>
              <p className="mb-8 text-white/60 text-sm sm:text-base text-center px-4"
              >
                {paymentMethod === "admin-approval"
                  ? locale === "ar"
                    ? "تم إرسال طلبك. بانتظار موافقة الأدمن."
                    : "Request submitted. Awaiting admin approval."
                  : locale === "ar"
                    ? paymentMethod === "fawry"
                      ? "سيتم إرسال كود الدفع على هاتفك. قم بالدفع في أقرب فرع فوري."
                      : "شكراً لك. ستتلقى بريداً إلكترونياً بتفاصيل طلبك."
                    : paymentMethod === "fawry"
                      ? "A payment code will be sent to your phone. Pay at any Fawry branch."
                      : "Thank you. You'll receive an email with your order details."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/dashboard/purchases">
                  <Button size="lg" className="gap-2 rounded-xl bg-primary px-8 text-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-primary-hover">
                    {locale === "ar" ? "عرض المشتريات" : "View Purchases"}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline" size="lg" className="gap-2 rounded-xl px-8 border-white/20 text-white hover:bg-white/10">
                    {t("cart.browseCourses")}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </m.div>
          ) : (
            <m.div
              key="checkout-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 sm:gap-8 lg:grid-cols-3"
            >
              {/* Form Column */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/50 overflow-x-auto pb-2">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] sm:text-xs font-bold text-black">1</span>
                    <span className="font-medium text-white truncate">{t("checkout.personalInfo")}</span>
                    <div className="h-px flex-1 min-w-[12px] bg-white/20" />
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] sm:text-xs font-bold text-black">2</span>
                    <span className="font-medium text-white truncate">{t("checkout.paymentMethod")}</span>
                  </div>

                  {/* Personal Info */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
                    <div className="mb-4 sm:mb-6 flex items-center gap-3">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">{t("checkout.personalInfo")}</h2>
                    </div>
                    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.name")}</Label>
                        <div className="relative">
                          <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} onBlur={() => markTouched("name")} placeholder={t("checkout.name")} dir={dir} className={cn(inputCls("name"), "ps-10")} />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.email")}</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} onBlur={() => markTouched("email")} placeholder={t("checkout.email")} dir="ltr" className={cn(inputCls("email"), "ps-10")} />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.phone")}</Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <Input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} onBlur={() => markTouched("phone")} placeholder={t("checkout.phone")} dir="ltr" className={cn(inputCls("phone"), "ps-10")} />
                        </div>
                      </div>
                      {hasPhysicalProducts && (
                        <div className="sm:col-span-2">
                          <Label className="mb-2 block text-sm font-medium text-white/70">{locale === "ar" ? "عنوان الشحن" : "Shipping Address"}</Label>
                          <Textarea
                            value={form.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            onBlur={() => markTouched("address")}
                            placeholder={locale === "ar" ? "العنوان الكامل للتوصيل" : "Full delivery address"}
                            dir={dir}
                            rows={3}
                            className={cn(inputCls("address"), "min-h-[80px] resize-none")}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
                    <div className="mb-4 sm:mb-6 flex items-center gap-3">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10">
                        <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">{t("checkout.paymentMethod")}</h2>
                    </div>

                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {paymentMethods.map((method) => (
                        <Label
                          key={method.value}
                          htmlFor={method.value}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 sm:gap-4 rounded-2xl border-2 p-3 sm:p-4 transition-all",
                            paymentMethod === method.value
                              ? "border-white bg-white/10"
                              : "border-white/10 hover:border-white/20"
                          )}
                        >
                          <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                          <div className={cn(
                            "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white transition-all",
                            paymentMethod === method.value ? method.color : "from-white/10 to-white/5 text-white/50"
                          )}>
                            <method.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-white">
                              {locale === "ar" ? method.labelAr : method.labelEn}
                            </span>
                            <span className="text-xs text-white/50">{method.description}</span>
                          </div>
                          {paymentMethod === method.value && (
                            <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-white">
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                            </div>
                          )}
                        </Label>
                      ))}
                    </RadioGroup>

                    <AnimatePresence mode="wait">
                      {/* Credit Card Fields */}
                      {paymentMethod === "credit-card" && (
                        <m.div
                          key="credit-card-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.cardNumber")}</Label>
                              <div className="relative">
                                <CreditCard className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input value={form.cardNumber} onChange={(e) => updateField("cardNumber", e.target.value)} onBlur={() => markTouched("cardNumber")} placeholder="0000 0000 0000 0000" dir="ltr" className={cn(inputCls("cardNumber"), "ps-10 font-mono tracking-widest")} />
                              </div>
                            </div>
                            <div>
                              <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.expiry")}</Label>
                              <Input value={form.expiry} onChange={(e) => updateField("expiry", e.target.value)} onBlur={() => markTouched("expiry")} placeholder="MM / YY" dir="ltr" className={cn(inputCls("expiry"), "font-mono tracking-widest")} />
                            </div>
                            <div>
                              <Label className="mb-2 block text-sm font-medium text-white/70">{t("checkout.cvv")}</Label>
                              <div className="relative">
                                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input value={form.cvv} onChange={(e) => updateField("cvv", e.target.value)} onBlur={() => markTouched("cvv")} placeholder="•••" dir="ltr" className={cn(inputCls("cvv"), "ps-10 font-mono tracking-widest")} />
                              </div>
                            </div>
                          </div>
                        </m.div>
                      )}

                      {/* Fawry Fields */}
                      {paymentMethod === "fawry" && (
                        <m.div
                          key="fawry-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 space-y-4">
                            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] text-white">
                                  <Banknote className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">
                                    {locale === "ar" ? "الدفع عبر فوري" : "Pay via Fawry"}
                                  </h4>
                                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                                    {locale === "ar"
                                      ? "سيتم إنشاء كود دفع فوري وإرساله على رقم هاتفك. قم بالتوجه إلى أقرب فرع فوري أو استخدم تطبيق فوري لإتمام الدفع خلال 48 ساعة."
                                      : "A Fawry payment code will be generated and sent to your phone number. Visit any Fawry outlet or use the Fawry app to complete payment within 48 hours."}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="mb-2 block text-sm font-medium text-white/70">
                                {locale === "ar" ? "رقم الهاتف لاستقبال كود فوري" : "Phone number for Fawry code"}
                              </Label>
                              <div className="relative">
                                <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input
                                  type="tel"
                                  value={form.fawryPhone}
                                  onChange={(e) => updateField("fawryPhone", e.target.value)}
                                  onBlur={() => markTouched("fawryPhone")}
                                  placeholder="01xxxxxxxxx"
                                  dir="ltr"
                                  className={cn(inputCls("fawryPhone"), "ps-10 font-mono")}
                                />
                              </div>
                            </div>
                          </div>
                        </m.div>
                      )}

                      {/* Vodafone Cash Fields */}
                      {paymentMethod === "vodafone-cash" && (
                        <m.div
                          key="vodafone-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 space-y-4">
                            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#DC2626] to-[#EF4444] text-white">
                                  <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">
                                    {locale === "ar" ? "الدفع عبر فودافون كاش" : "Pay via Vodafone Cash"}
                                  </h4>
                                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                                    {locale === "ar"
                                      ? "سيتم إرسال طلب دفع على محفظة فودافون كاش الخاصة بك. قم بتأكيد الدفع من خلال تطبيق فودافون كاش أو عبر كود *9*"
                                      : "A payment request will be sent to your Vodafone Cash wallet. Confirm the payment through the Vodafone Cash app or via *9* code."}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="mb-2 block text-sm font-medium text-white/70">
                                {locale === "ar" ? "رقم فودافون كاش" : "Vodafone Cash number"}
                              </Label>
                              <div className="relative">
                                <Smartphone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input
                                  type="tel"
                                  value={form.vodafoneNumber}
                                  onChange={(e) => updateField("vodafoneNumber", e.target.value)}
                                  onBlur={() => markTouched("vodafoneNumber")}
                                  placeholder="010xxxxxxxx"
                                  dir="ltr"
                                  className={cn(inputCls("vodafoneNumber"), "ps-10 font-mono")}
                                />
                              </div>
                            </div>
                          </div>
                        </m.div>
                      )}

                      {/* Admin Approval */}
                      {paymentMethod === "admin-approval" && (
                        <m.div
                          key="admin-approval-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/5 p-4">
                            <p className="text-sm text-white/60">
                              {locale === "ar"
                                ? "سيتم إرسال طلبك للأدمن للموافقة. ستتلقى إشعاراً عند الموافقة."
                                : "Your request will be sent to admin for approval. You will be notified when approved."}
                            </p>
                          </div>
                        </m.div>
                      )}

                      {/* Coupon */}
                      {paymentMethod === "coupon" && (
                        <m.div
                          key="coupon-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6">
                            <Label className="mb-2 block text-sm font-medium text-white/70">
                              {locale === "ar" ? "كود الكوبون" : "Coupon Code"}
                            </Label>
                            <div className="relative">
                              <Tag className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                              <Input
                                value={form.couponCode}
                                onChange={(e) => updateField("couponCode", e.target.value.toUpperCase())}
                                onBlur={() => markTouched("couponCode")}
                                placeholder="SAVE20"
                                dir="ltr"
                                className={cn(inputCls("couponCode"), "ps-10 font-mono")}
                              />
                            </div>
                            <p className="mt-2 text-xs text-white/50">
                              {locale === "ar" ? "الكوبون يجب أن يغطي المبلغ بالكامل" : "Coupon must cover full amount"}
                            </p>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile submit */}
                  <div className="lg:hidden">
                    <Button
                      type="submit"
                      disabled={processing}
                      className="h-12 w-full gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-primary-hover"
                    >
                      {processing ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{t("checkout.processing")}</>
                      ) : (
                        <>{t("checkout.placeOrder")}<ArrowIcon className="h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 lg:top-24">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="bg-white/10 px-4 sm:px-6 py-4 sm:py-6">
                      <h2 className="text-lg font-bold text-white">{t("checkout.orderSummary")}</h2>
                      <p className="mt-1 text-sm text-white/70">{mockCartItems.length} {locale === "ar" ? "دورات" : "courses"}</p>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                      {mockCartItems.map((item, idx) => (
                        <div key={item.id}>
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                              <Image src={item.thumbnail} alt={locale === "ar" ? item.titleAr : item.titleEn} fill unoptimized className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs sm:text-sm font-semibold text-white">
                                {locale === "ar" ? item.titleAr : item.titleEn}
                              </p>
                              <p className="mt-0.5 text-xs sm:text-sm font-bold text-white">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                          {idx < mockCartItems.length - 1 && <Separator className="mt-4 bg-white/10" />}
                        </div>
                      ))}

                      <Separator className="bg-white/10" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60">{t("checkout.subtotal")}</span>
                          <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white">{t("checkout.total")}</span>
                          <span className="text-xl sm:text-2xl font-extrabold text-white">{formatCurrency(total)}</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={processing}
                        onClick={handleSubmit}
                        className="hidden h-12 w-full gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-primary-hover lg:flex"
                      >
                        {processing ? (
                          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{t("checkout.processing")}</>
                        ) : (
                          <>{t("checkout.placeOrder")}<ArrowIcon className="h-4 w-4" /></>
                        )}
                      </Button>

                      {/* Payment method indicator */}
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="flex items-center gap-2.5">
                          {paymentMethods.find(m => m.value === paymentMethod) && (() => {
                            const method = paymentMethods.find(m => m.value === paymentMethod)!
                            return (
                              <>
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", method.color)}>
                                  <method.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">
                                    {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
                                  </p>
                                  <p className="text-[10px] text-white/50">
                                    {locale === "ar" ? method.labelAr : method.labelEn}
                                  </p>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>{locale === "ar" ? "دفع آمن" : "Secure"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <Lock className="h-3.5 w-3.5" />
                          <span>{locale === "ar" ? "مشفّر" : "Encrypted"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{locale === "ar" ? "ضمان" : "Guarantee"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  )
}
