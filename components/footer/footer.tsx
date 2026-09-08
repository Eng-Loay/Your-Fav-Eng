"use client"

import type { ComponentType } from "react"
import { m } from "framer-motion"
import Link from "next/link"
import { Phone, Mail, MapPin, Send, Linkedin, Instagram, MessageCircle, Facebook } from "lucide-react"
import Image from "next/image"
import { usePlatformBranding } from "@/hooks/use-platform-branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import { useMarketingSurface } from "@/components/providers/MarketingSurfaceProvider"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
}

export function Footer() {
  const { dir, t, locale } = useI18n()
  const { branding } = usePlatformBranding()
  const isMds = useMarketingSurface()
  const isAr = locale === "ar"

  const TikTokGlyph = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-5.2-1.45 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05 6.33 6.33 0 105.13 7.05V9.01a8.16 8.16 0 004.77 1.52V7.13a4.85 4.85 0 01-1-.1z" />
    </svg>
  )

  const WhatsAppGlyph = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.14-.2.29-.75.93-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.58-.9-2.16-.24-.57-.48-.5-.65-.5-.17-.01-.36-.01-.56-.01-.19 0-.51.07-.78.36-.26.29-1.02 1-1.02 2.42 0 1.42 1.05 2.8 1.19 3 .15.19 2.06 3.14 4.99 4.4.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.36.24-.67.24-1.25.17-1.36-.07-.12-.26-.19-.55-.34z" />
      <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.36 5.07L2 22l5.07-1.33A9.95 9.95 0 0012.02 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.15c-1.63 0-3.15-.44-4.46-1.21l-.32-.19-3.01.79.8-2.93-.21-.3A8.14 8.14 0 013.87 12c0-4.5 3.66-8.15 8.15-8.15S20.17 7.5 20.17 12s-3.66 8.15-8.15 8.15z" />
    </svg>
  )

  const socialLinks: {
    Icon: ComponentType<{ className?: string }>
    href: string
    label: string
  }[] = [
    { Icon: Instagram, href: "https://www.instagram.com/pds_agency0/", label: "Instagram @pds_agency0" },
    { Icon: TikTokGlyph, href: "https://www.tiktok.com/@pds.agency", label: "TikTok @pds.agency" },
    { Icon: MessageCircle, href: "https://t.me/pdsagency", label: "Telegram" },
  ]

  if (isMds) {
    return (
      <footer
        dir={dir}
        className="w-full bg-[#1345D6] px-4 pb-28 pt-10 text-white sm:px-6 lg:px-8 lg:pb-12"
      >
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-8 border-t border-white/20 pt-12 md:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-white/20">
                <Image
                  src={branding.logo}
                  alt={branding.platformName}
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                />
              </div>
              <div className="text-xl font-bold text-white">{branding.platformName}</div>
            </div>
            <p className="text-sm leading-relaxed text-white/75">{t("marketing.footerBrandBlurb")}</p>
            <div className="flex gap-4">
              {branding.socialLinkedin && (
                <a
                  href={branding.socialLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {branding.socialFacebook && (
                <a
                  href={branding.socialFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              <a
                href={`mailto:${branding.contactEmail}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              {branding.contactPhone && (
                <a
                  href={`https://wa.me/${branding.contactPhone.replace(/\D/g, "").replace(/^0/, "20")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="WhatsApp"
                >
                  <WhatsAppGlyph className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-white/90">
              {t("marketing.footerNav")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-sm text-white/75 transition-colors hover:text-white">
                  {t("nav.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-white/75 transition-colors hover:text-white">
                  {t("nav.courses")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-white/90">
              {t("marketing.footerSupport")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/contact" className="text-sm text-white/75 transition-colors hover:text-white">
                  {t("marketing.footerIsoCerts")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/75 transition-colors hover:text-white">
                  {t("marketing.footerGlobalSupport")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-white/90">
              {t("marketing.footerHq")}
            </h4>
            <p className="mb-2 text-sm text-white/75">{branding.contactEmail}</p>
            <p className="mb-6 text-sm text-white/75">{branding.contactPhone}</p>
            <div className="rounded-lg border border-white/20 bg-white/10 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                {t("marketing.footerStatus")}
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-white">{t("marketing.footerStatusOk")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-screen-2xl flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 md:flex-row">
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} {t("marketing.footerCopyright")}
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mds-on-surface-variant opacity-50">
              {t("marketing.footerTag1")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mds-on-surface-variant opacity-50">
              {t("marketing.footerTag2")}
            </span>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer dir={dir} className="relative text-white overflow-hidden pb-24 lg:pb-0 bg-medex-dark">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-medex-red/[0.05]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none bg-white/[0.02]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUp}
          custom={0}
          className="py-12 lg:py-16 border-b border-white/10"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 font-display">
              {isAr ? "ابق على اطلاع مع PDS" : "Stay updated with PDS"}
            </h3>
            <p className="text-white/40 text-sm sm:text-base mb-6">
              {isAr ? "اشترك للحصول على نصائح المحتوى، الدورات، وتحديثات المجتمع" : "Subscribe for content tips, course updates, and community news"}
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={isAr ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                className="flex-1 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-medex-red/30 focus-visible:border-medex-red/40 h-11"
                dir={dir}
              />
              <Button className="bg-medex-red text-white shadow-lg shadow-red-500/20 h-11 px-5 shrink-0 hover:bg-medex-red-dark transition-colors font-semibold">
                <Send className="w-4 h-4 mr-2" />
                {isAr ? "اشترك" : "Subscribe"}
              </Button>
            </div>
          </div>
        </m.div>

        {/* Main Grid */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand */}
            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="lg:col-span-4"
            >
              <Link href="/" className="inline-flex items-center gap-2.5 group mb-5">
                <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg transition-shadow group-hover:shadow-xl ring-1 ring-white/15">
                  <Image src={branding.logo} alt={branding.platformName} fill className="object-contain p-1" sizes="40px" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white font-medex block">
                    {branding.platformName}
                  </span>
                  <span className="text-[10px] font-medium text-medex-red uppercase tracking-[0.15em]">{isAr ? "تعليم · علامة · سوشيال" : "Education · Brand · Social"}</span>
                </div>
              </Link>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
                {isAr
                  ? "وكالة PDS مركز إبداعي: دعم تعليمي، هوية رقمية، وسوشيال ميديا. تابعنا @pds.agency على تيك توك و @pds_agency0 على إنستغرام."
                  : "PDS Agency is a creative hub for educational support, digital branding, and social media. Follow @pds.agency on TikTok and @pds_agency0 on Instagram."}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:bg-medex-red hover:text-white transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </m.div>

            {/* Quick Links */}
            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="lg:col-span-2"
            >
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">{isAr ? "روابط سريعة" : "Quick Links"}</h4>
              <ul className="space-y-3">
                {[
                  { label: isAr ? "الرئيسية" : "Home", href: "/" },
                  { label: isAr ? "المنتجات" : "Products", href: "/store" },
                  { label: isAr ? "الدورات" : "Courses", href: "/courses" },
                  { label: isAr ? "من نحن" : "About Us", href: "/about" },
                  { label: isAr ? "تواصل معنا" : "Contact", href: "/contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/40 hover:text-medex-red transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </m.div>

            {/* Product Lines */}
            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
              className="lg:col-span-3"
            >
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">{isAr ? "قنواتنا" : "Our channels"}</h4>
              <ul className="space-y-3">
                {[
                  "TikTok — @pds.agency",
                  "Instagram — @pds_agency0",
                  "WhatsApp — updates channel",
                  "Telegram — resource hub",
                  "Courses & store — on site",
                ].map((brand) => (
                  <li key={brand}>
                    <Link href="/store" className="text-sm text-white/40 hover:text-medex-red transition-colors duration-200">
                      {brand}
                    </Link>
                  </li>
                ))}
              </ul>
            </m.div>

            {/* Contact */}
            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={3}
              className="lg:col-span-3"
            >
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">{isAr ? "تواصل معنا" : "Contact Us"}</h4>
              <div className="space-y-4">
                <a href="tel:01287333308" className="flex items-start gap-3 text-sm text-white/40 hover:text-white transition-colors group">
                  <Phone className="w-4 h-4 mt-0.5 text-medex-red shrink-0" />
                  <span>01287333308</span>
                </a>
                <a href="mailto:hello@pds.agency" className="flex items-start gap-3 text-sm text-white/40 hover:text-white transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 text-medex-red shrink-0" />
                  <span>hello@pds.agency</span>
                </a>
                <div className="flex items-start gap-3 text-sm text-white/40">
                  <MapPin className="w-4 h-4 mt-0.5 text-medex-red shrink-0" />
                  <span>{isAr ? <>157 شارع السودان، الدور الثاني<br />الجيزة، مصر</> : <>157 Sudan Street, Second Floor<br />Giza, Egypt</>}</span>
                </div>
              </div>
            </m.div>
          </div>
        </div>

        {/* Bottom */}
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="py-6 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} {isAr ? "المهندس لؤي عصام. جميع الحقوق محفوظة." : "Eng. Loay Essam. All rights reserved."}
            </p>
          </div>
        </m.div>
      </div>
    </footer>
  )
}
