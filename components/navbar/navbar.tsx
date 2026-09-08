"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePlatformBranding } from "@/hooks/use-platform-branding"
import { useRouter, usePathname } from "next/navigation"
import { m, AnimatePresence } from "framer-motion"
import {
  ShoppingCart,
  Menu,
  X,
  Sparkles,
  LogOut,
  User,
  BookOpen,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ShoppingBag,
  Tag,
  Phone,
  Globe,
  Users,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { cn, safeStr, getDashboardPath, getMyCoursesPath, getNavDashboardLabelKey, isLearnerRole } from "@/lib/utils"
import { getApiBase, fetchWithTimeout, isBackendMarkedDown } from "@/lib/api"
import { useMarketingSurface } from "@/components/providers/MarketingSurfaceProvider"

const INSTRUCTORS_ENABLED_KEY = "lms_instructors_enabled"

export function Navbar() {
  const { locale, dir, setLocale, t } = useI18n()
  const { user, isLoggedIn, logout, cartCount, hydrated } = useStore()
  const { branding } = usePlatformBranding()
  const router = useRouter()
  const pathname = usePathname()
  const isMds = useMarketingSurface()
  const [mdsSearch, setMdsSearch] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [instructorsEnabled, setInstructorsEnabled] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; nameEn?: string; slug: string; children?: { id: string; name: string; nameEn?: string; slug: string }[] }[]>([])
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (isBackendMarkedDown()) return
    fetchWithTimeout(`${getApiBase()}/settings/categories?service=platform`, undefined, 4000)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setCategories(json.data)
        })
        .catch(() => {})
  }, [])

  useEffect(() => {
    const checkInstructors = () => {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem(INSTRUCTORS_ENABLED_KEY)
        setInstructorsEnabled(val === "true")
      }
    }
    checkInstructors()
    if (isBackendMarkedDown()) {
      const onStorage = () => { checkInstructors() }
      window.addEventListener("instructors-toggle", checkInstructors)
      window.addEventListener("storage", onStorage)
      return () => {
        window.removeEventListener("instructors-toggle", checkInstructors)
        window.removeEventListener("storage", onStorage)
      }
    }
    fetchWithTimeout(`${getApiBase()}/settings/instructors-status`, undefined, 4000)
      .then((r) => r.json())
      .then((instJson) => {
        if (instJson?.success && instJson?.data) {
          const enabled = instJson.data.enabled === true
          setInstructorsEnabled(enabled)
          localStorage.setItem(INSTRUCTORS_ENABLED_KEY, String(enabled))
        }
      }).catch(() => {})
    const onStorage = () => { checkInstructors() }
    window.addEventListener("instructors-toggle", checkInstructors)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("instructors-toggle", checkInstructors)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (!isProfileOpen) return
    const close = () => setIsProfileOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [isProfileOpen])

  useEffect(() => {
    if (!categoriesOpen) return
    const close = () => setCategoriesOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [categoriesOpen])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    router.push("/")
  }

  const mdsNavClass = (href: string) => {
    const active =
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
    return cn(
      "text-sm font-medium tracking-tight transition-colors border-b-2 pb-1",
      active
        ? "border-red-600 font-bold text-red-600 dark:border-red-500 dark:text-red-500"
        : "border-transparent text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
    )
  }

  const submitMdsSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = mdsSearch.trim()
    router.push(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses")
    setIsMobileMenuOpen(false)
  }

  const mdsMobileLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.aboutUs") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/statistics", label: t("nav.statistics") },
    { href: "/services", label: t("nav.services") },
    { href: "/news", label: t("nav.news") },
    { href: "/contact", label: t("nav.contact") },
  ]

  const legacyMobileLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/courses", label: t("nav.courses") },
  ]

  return (
    <>
      {/* Top Bar */}
      {isMds && (
      <div className="hidden lg:block bg-mds-primary text-white text-xs">
        <div className="mx-auto max-w-screen-2xl px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a href={`tel:${branding.contactPhone}`} className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
              <Phone className="w-3 h-3" />
              {branding.contactPhone}
            </a>
            <span className="text-white/40">|</span>
            <a href={`mailto:${branding.contactEmail}`} className="hover:text-white/80 transition-colors">
              {branding.contactEmail}
            </a>
          </div>
          <div className="flex items-center gap-3">
            {branding.socialLinkedin && (
              <>
                <span className="text-white/40">|</span>
                <a href={branding.socialLinkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
                  LinkedIn
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      )}
      {!isMds && (
      <div className="hidden lg:block bg-medex-red text-white text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a href="tel:01287333308" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
              <Phone className="w-3 h-3" />
              01287333308
            </a>
            <span className="text-white/40">|</span>
            <a href="mailto:hello@pds.agency" className="hover:text-white/80 transition-colors">
              hello@pds.agency
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/70">{locale === "ar" ? "حلول طب الأسنان الرائدة في مصر والشرق الأوسط" : "Leading Dental Solutions in Egypt & Middle East"}</span>
            <span className="text-white/40">|</span>
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors font-medium"
            >
              <Globe className="w-3 h-3" />
              {locale === "ar" ? "English" : "العربية"}
            </button>
          </div>
        </div>
      </div>
      )}

      <m.header
        dir={dir}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "sticky top-0 inset-x-0 z-50 transition-all duration-500",
          isMds
            ? "mds-glass-nav border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
            : isScrolled
              ? "border-b border-gray-200/60 bg-white/95 shadow-sm backdrop-blur-xl"
              : "border-b border-gray-100 bg-white"
        )}
      >
        <div
          className={cn(
            isMds ? "mx-auto max-w-screen-2xl px-4 sm:px-8" : "container mx-auto px-4 sm:px-6 lg:px-8"
          )}
        >
          <nav
            className={cn(
              "flex items-center justify-between",
              isMds ? "min-h-[64px] py-3 lg:py-4" : "h-[68px] lg:h-[76px]"
            )}
          >
            <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5 group">
              <div className={cn("relative shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700", isMds ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11")}>
                <Image
                  src={branding.logo}
                  alt={branding.platformName}
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
              <div className={cn("min-w-0", isMds ? "block" : "hidden sm:block")}>
                {isMds ? (
                  <>
                    <span className="block text-sm font-bold tracking-tight text-mds-primary sm:text-base lg:hidden">
                      {branding.platformName}
                    </span>
                    <span className="hidden max-w-[220px] truncate text-base font-bold tracking-tight text-mds-primary lg:block xl:max-w-none xl:whitespace-normal xl:text-lg">
                      {branding.platformName}
                    </span>
                  </>
                ) : (
                  <>
                <span className="text-xl font-bold tracking-tight block leading-tight text-medex-dark font-medex">
                  {branding.platformName}
                </span>
                <span className="text-[10px] font-medium text-medex-red uppercase tracking-[0.15em]">
                  {locale === "ar" ? "تعليم · علامة رقمية · سوشيال" : "Education · Branding · Social"}
                </span>
                  </>
                )}
              </div>
            </Link>

            {isMds ? (
            <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8">
                <Link href="/" className={mdsNavClass("/")}>
                  {t("nav.home")}
                </Link>
                <Link href="/courses" className={mdsNavClass("/courses")}>
                  {t("nav.courses")}
                </Link>
                <Link href="/about" className={mdsNavClass("/about")}>
                  {t("nav.aboutUs")}
                </Link>
                <Link href="/contact" className={mdsNavClass("/contact")}>
                  {t("nav.contact")}
                </Link>
            </div>
            ) : (
            <div className="hidden lg:flex items-center">
              <div className="flex items-center gap-0.5 rounded-2xl border border-gray-100 bg-gray-50/50 p-1">
                <Link href="/" className="group relative px-5 py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 rounded-xl hover:text-medex-red hover:bg-white">
                  {t("nav.home")}
                </Link>
                <Link href="/courses" className="group relative px-5 py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 rounded-xl hover:text-medex-red hover:bg-white">
                  {t("nav.courses")}
                </Link>
                {categories.length > 0 && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className={cn(
                        "flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300",
                        categoriesOpen ? "text-medex-red bg-white" : "text-gray-500 hover:text-medex-red hover:bg-white"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {t("nav.categories")}
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", categoriesOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {categoriesOpen && (
                        <m.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1 start-0 min-w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-[100]"
                        >
                          <div className="py-2 max-h-[70vh] overflow-y-auto">
                            {categories.map((cat) => (
                              <div key={cat.id} className="group/cat">
                                {cat.children?.length ? (
                                  <>
                                    <div className="px-4 py-2.5 text-xs font-bold text-medex-red/60 uppercase tracking-wider">
                                      {cat.nameEn || cat.name}
                                    </div>
                                    {cat.children.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        href={`/courses?category=${encodeURIComponent(sub.slug)}`}
                                        onClick={() => setCategoriesOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 ms-4 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-medex-red transition-colors"
                                      >
                                        <ChevronLeft className="w-3 h-3 text-gray-300" />
                                        {sub.nameEn || sub.name}
                                      </Link>
                                    ))}
                                  </>
                                ) : (
                                  <Link
                                    href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                                    onClick={() => setCategoriesOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-medex-red transition-colors"
                                  >
                                    <Tag className="w-3.5 h-3.5 text-gray-300" />
                                    {cat.nameEn || cat.name}
                                  </Link>
                                )}
                              </div>
                            ))}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <Link href="/store" className="group relative px-5 py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 rounded-xl hover:text-medex-red hover:bg-white">
                  {t("nav.store")}
                </Link>
                {instructorsEnabled && (
                  <Link href="/instructors" className="group relative px-5 py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 rounded-xl hover:text-medex-red hover:bg-white">
                    {t("nav.instructors")}
                  </Link>
                )}
                <Link href="/community" className="group relative px-5 py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 rounded-xl hover:text-medex-red hover:bg-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {t("nav.community")}
                </Link>
              </div>
            </div>
            )}

            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
              {isMds && (
                <form onSubmit={submitMdsSearch} className="relative hidden 2xl:block">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mds-on-surface-variant" />
                  <input
                    value={mdsSearch}
                    onChange={(e) => setMdsSearch(e.target.value)}
                    placeholder={t("marketing.searchPlaceholder")}
                    className="w-56 rounded-md border-none bg-mds-surface-container-highest/30 py-2 ps-10 pe-4 text-sm text-mds-on-background outline-none transition-all focus:ring-2 focus:ring-mds-primary lg:w-64 dark:bg-slate-800/50"
                  />
                </form>
              )}
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-all hover:border-medex-red/30 hover:bg-red-50 hover:text-medex-red"
                title={locale === "ar" ? "English" : "العربية"}
              >
                <Globe className="w-[18px] h-[18px]" />
              </m.button>
              <Link href="/cart" className={cn(isMds && "hidden")}>
                <m.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-all hover:border-medex-red/30 hover:bg-red-50 hover:text-medex-red"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {mounted && cartCount > 0 && (
                    <m.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-medex-red text-[10px] font-bold text-white shadow-lg"
                    >
                      {cartCount}
                    </m.span>
                  )}
                </m.div>
              </Link>

              <div className="flex items-center gap-2 ms-1">
                {isLoggedIn && user ? (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <m.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 transition-all hover:border-medex-red/30 hover:bg-red-50"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-2 ring-medex-red/20">
                        <Image src={user.avatar} alt={safeStr(user.name)} fill className="object-cover" />
                      </div>
                      <span className="text-sm font-semibold text-medex-dark max-w-[100px] truncate">{safeStr(user.name)}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isProfileOpen && "rotate-180")} />
                    </m.button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <m.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full end-0 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                        >
                          <div className="border-b border-gray-100 px-4 py-3">
                            <p className="text-sm font-bold text-medex-dark truncate">{safeStr(user.name)}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                          <div className="py-1.5">
                            <Link
                              href={hydrated ? getDashboardPath(user?.role) : "/dashboard"}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-medex-red transition-colors"
                            >
                              {isLearnerRole(user?.role) ? (
                                <BookOpen className="w-4 h-4" />
                              ) : (
                                <LayoutDashboard className="w-4 h-4" />
                              )}
                              {t(getNavDashboardLabelKey(user?.role))}
                            </Link>
                            <Link
                              href={hydrated ? getMyCoursesPath(user?.role) : "/dashboard/courses"}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-medex-red transition-colors"
                            >
                              <User className="w-4 h-4" />
                              {t("nav.myCourses")}
                            </Link>
                          </div>
                          <div className="border-t border-gray-100 py-1.5">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t("nav.logout")}
                            </button>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="hidden rounded-xl text-gray-500 hover:text-medex-red hover:bg-red-50 font-medium px-3 h-10 xl:inline-flex">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link href="/register">
                      <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button size="sm" className="relative overflow-hidden rounded-xl bg-mds-primary text-white shadow-lg shadow-mds-primary/20 hover:opacity-90 transition-all font-semibold px-4 xl:px-6 h-10 gap-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">{t("nav.register")}</span>
                          <span className="xl:hidden">Join</span>
                          <m.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                          />
                        </Button>
                      </m.div>
                    </Link>
                  </>
                )}
              </div>
              {isMds && (
                <Link
                  href="/contact"
                  className="hidden shrink-0 rounded-md bg-mds-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 xl:inline-flex"
                >
                  {t("marketing.contactUs")}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-medex-red hover:bg-red-50 transition-colors"
                title={locale === "ar" ? "English" : "العربية"}
              >
                <Globe className="w-5 h-5" />
              </button>
              <Link href="/cart" className={cn(isMds && "hidden")}>
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-medex-red hover:bg-red-50 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-medex-red text-[9px] font-bold text-white">{cartCount}</span>
                  )}
                </div>
              </Link>
              {isLoggedIn && user && (
                <Link href={hydrated ? getDashboardPath(user.role) : "/dashboard"}>
                  <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-2 ring-medex-red/20">
                    <Image src={user.avatar} alt={safeStr(user.name)} fill className="object-cover" />
                  </div>
                </Link>
              )}
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-medex-dark hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.div key={isMobileMenuOpen ? "close" : "open"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </m.div>
                </AnimatePresence>
              </m.button>
            </div>
          </nav>
        </div>
      </m.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div dir={dir} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[60] lg:hidden">
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <m.div
              initial={{ x: dir === "rtl" ? 320 : -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir === "rtl" ? 320 : -320, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "absolute top-0 bottom-0 w-[min(320px,85vw)] bg-white flex flex-col shadow-2xl border-gray-100",
                dir === "rtl" ? "right-0 border-l" : "left-0 border-r"
              )}
            >
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16 sm:h-20 border-b border-gray-100">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex min-w-0 items-center gap-2.5">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-200">
                    <Image src={branding.logo} alt={branding.platformName} fill className="object-contain" sizes="36px" />
                  </div>
                  <span className="truncate font-bold text-base text-mds-primary sm:text-lg">
                    {branding.platformName}
                  </span>
                </Link>
                <m.button whileTap={{ scale: 0.9 }} onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </m.button>
              </div>

              {isLoggedIn && user && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-xl ring-2 ring-medex-red/20">
                    <Image src={user.avatar} alt={safeStr(user.name)} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-medex-dark truncate">{safeStr(user.name)}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-6">
                {isMds && (
                  <form onSubmit={submitMdsSearch} className="relative mb-4">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={mdsSearch}
                      onChange={(e) => setMdsSearch(e.target.value)}
                      placeholder={t("marketing.searchPlaceholder")}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 ps-10 pe-4 text-sm outline-none focus:ring-2 focus:ring-mds-primary/30"
                    />
                  </form>
                )}
                <div className="space-y-1">
                  {(isMds ? mdsMobileLinks : legacyMobileLinks).map((link, i) => (
                    <m.div key={link.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.04 }}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold rounded-xl transition-all",
                          pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                            ? "bg-red-50 text-mds-primary"
                            : "text-medex-dark hover:bg-red-50 hover:text-medex-red"
                        )}
                      >
                        {link.label}
                      </Link>
                    </m.div>
                  ))}
                  {!isMds && categories.length > 0 && (
                    <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}>
                      <div className="px-4 py-2 text-xs font-bold text-medex-red/50 uppercase tracking-wider">
                        {t("nav.categories")}
                      </div>
                      {categories.map((cat) => (
                        <div key={cat.id} className="space-y-0.5">
                          {cat.children?.length ? (
                            <>
                              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400">
                                {cat.nameEn || cat.name}
                              </div>
                              {cat.children.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/courses?category=${encodeURIComponent(sub.slug)}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium text-gray-500 rounded-xl hover:bg-red-50 hover:text-medex-red transition-all"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  {sub.nameEn || sub.name}
                                </Link>
                              ))}
                            </>
                          ) : (
                            <Link
                              href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all"
                            >
                              <Tag className="w-4 h-4 text-gray-300" />
                              {cat.nameEn || cat.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </m.div>
                  )}
                  {!isMds && (
                  <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}>
                    <Link href="/store" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all">
                      {t("nav.store")}
                    </Link>
                  </m.div>
                  )}
                  {!isMds && instructorsEnabled && (
                    <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                      <Link href="/instructors" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all">
                        {t("nav.instructors")}
                      </Link>
                    </m.div>
                  )}
                  {!isMds && (
                  <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.19 }}>
                    <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all">
                      <Users className="w-5 h-5 text-gray-400" />
                      {t("nav.community")}
                    </Link>
                  </m.div>
                  )}
                  
                  {!isMds && (
                  <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all">
                      <ShoppingCart className="w-5 h-5 text-gray-400" />
                      {t("nav.cart")}
                      {mounted && cartCount > 0 && <span className="ms-auto flex h-6 w-6 items-center justify-center rounded-full bg-medex-red text-xs font-bold text-white">{cartCount}</span>}
                    </Link>
                  </m.div>
                  )}
                  {isLoggedIn && (
                    <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                      <Link href={hydrated ? getDashboardPath(user?.role) : "/dashboard"} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-medex-dark rounded-xl hover:bg-red-50 hover:text-medex-red transition-all">
                        {isLearnerRole(user?.role) ? (
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        ) : (
                          <LayoutDashboard className="w-5 h-5 text-gray-400" />
                        )}
                        {t(getNavDashboardLabelKey(user?.role))}
                      </Link>
                    </m.div>
                  )}
                </div>
              </div>

              <div className="px-4 pb-28 pt-4 space-y-2.5 border-t border-gray-100">
                {isLoggedIn ? (
                  <Button onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }} variant="outline" className="w-full justify-center h-12 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 bg-transparent font-semibold gap-2">
                    <LogOut className="w-4 h-4" />
                    {t("nav.logout")}
                  </Button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full justify-center h-12 rounded-xl border border-gray-200 text-medex-dark hover:bg-gray-50 bg-transparent font-semibold transition-all">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button className="w-full justify-center h-12 rounded-xl bg-medex-red text-white shadow-lg shadow-red-500/20 font-semibold gap-2 hover:bg-medex-red-dark">
                        <Sparkles className="w-4 h-4" />
                        {t("nav.register")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
