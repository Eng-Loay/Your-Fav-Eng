"use client"

import { useEffect, useState, type ReactNode } from "react"
import { m } from "framer-motion"
import { Sparkles, BookOpen, GraduationCap, Star, TrendingUp } from "lucide-react"

// Deterministic values (no Math.random) to avoid hydration mismatch between server and client
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: ((i * 13 + 7) % 97) + 1.5,
  y: ((i * 17 + 11) % 97) + 1.5,
  size: 2 + ((i * 5) % 16) * 0.1,
  duration: 5 + ((i * 3) % 21) * 0.1,
  delay: ((i * 7) % 13) * 0.25,
}))

const textReveal = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}
const textRevealInstant = { hidden: { opacity: 1 }, visible: { opacity: 1 } }

interface AnimatedPageHeroProps {
  badge?: string
  title: string
  subtitle?: string
  children?: ReactNode
  compact?: boolean
  dark?: boolean
}

export function AnimatedPageHero({
  badge,
  title,
  subtitle,
  children,
  compact = false,
  dark = false,
}: AnimatedPageHeroProps) {
  const [reduceMotion, setReduceMotion] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mobile = window.matchMedia("(max-width: 768px)")
    setReduceMotion(mq.matches)
    setIsMobile(mobile.matches)
    const fn = () => setReduceMotion(mq.matches)
    const fnM = () => setIsMobile(mobile.matches)
    mq.addEventListener("change", fn)
    mobile.addEventListener("change", fnM)
    return () => { mq.removeEventListener("change", fn); mobile.removeEventListener("change", fnM) }
  }, [])
  const skipAnimations = reduceMotion || isMobile
  const bg = dark
    ? "bg-gradient-to-br from-[#081A4D] via-[#0B2F8C] to-[#1345D6]"
    : "bg-[#FAFBFC]"
  const textColor = dark ? "text-white" : "text-[#0F172A]"
  const subtitleColor = dark ? "text-white/70" : "text-[#64748B]"
  const badgeStyle = dark
    ? "border-white/20 bg-white/10 text-white backdrop-blur-sm"
    : "border-primary/20 bg-white/90 text-primary shadow-[0_4px_16px_-2px_rgba(var(--color-primary-rgb), 0.12)] backdrop-blur-sm"
  const particleColor = dark ? "bg-white/20" : "bg-primary/20"
  const orbColor1 = dark ? "bg-white/[0.05]" : "bg-primary/[0.08]"
  const orbColor2 = dark ? "bg-white/[0.04]" : "bg-primary/[0.07]"
  const gridOpacity = dark ? "opacity-[0.04]" : "opacity-[0.025]"
  const gridColor = dark ? "rgba(255,255,255,1)" : "rgba(var(--color-primary-rgb), 1)"
  const iconColor1 = dark ? "text-white/40" : "text-primary/60"
  const iconColor2 = dark ? "text-white/30" : "text-primary/60"
  const iconBorder1 = dark ? "border-white/10 bg-white/10" : "border-primary/15 bg-white/90"
  const iconBorder2 = dark ? "border-white/10 bg-white/10" : "border-primary/20 bg-white/90"
  const lineColor1 = dark ? "#ffffff" : "var(--color-primary)"
  const lineColor2 = dark ? "#ffffff" : "var(--color-primary)"

  // Render particles only after mount to avoid hydration mismatch with Framer Motion animations
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className={`relative overflow-hidden ${bg} ${compact ? "pt-28 pb-16" : "pt-28 pb-20"}`}>
      {/* Multi-layer animated background */}
      <div className="pointer-events-none absolute inset-0">
        {!dark && (
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 30% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 55%),
                radial-gradient(ellipse 60% 50% at 75% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 55%),
                linear-gradient(180deg, #FAFBFC 0%, #F0F4FA 100%)
              `,
            }}
          />
        )}

        {/* Animated gradient orbs - skip on mobile or reduced motion */}
        {!skipAnimations && (
          <>
            <m.div
              className={`absolute -top-32 start-[-8%] h-[450px] w-[450px] rounded-full ${orbColor1} blur-[120px]`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5], x: [0, 40, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <m.div
              className={`absolute -bottom-20 end-[-6%] h-[400px] w-[400px] rounded-full ${orbColor2} blur-[100px]`}
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4], x: [0, -30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </>
        )}

        {/* Floating particles - skip on mobile to reduce load */}
        {mounted && !isMobile &&
          particles.map((p) => (
          <m.div
            key={p.id}
            className={`absolute rounded-full ${particleColor}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{
              y: [0, -30, 0],
              x: [0, p.id % 2 === 0 ? 15 : -15, 0],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Grid pattern */}
        <div
          className={`absolute inset-0 ${gridOpacity}`}
          style={{
            backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating decorative icons */}
      <m.div
        className={`pointer-events-none absolute end-[8%] top-[15%] hidden h-14 w-14 rounded-2xl border shadow-xl backdrop-blur-md lg:block ${iconBorder1}`}
        animate={{ y: [0, -20, 0], rotate: [0, 6, -3, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-full items-center justify-center">
          <BookOpen className={`h-6 w-6 ${iconColor1}`} />
        </div>
      </m.div>
      <m.div
        className={`pointer-events-none absolute start-[6%] top-[25%] hidden h-12 w-12 rounded-2xl border shadow-lg backdrop-blur-md lg:block ${iconBorder2}`}
        animate={{ y: [0, 15, 0], rotate: [0, -5, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <div className="flex h-full items-center justify-center">
          <GraduationCap className={`h-5 w-5 ${iconColor2}`} />
        </div>
      </m.div>
      <m.div
        className="pointer-events-none absolute end-[18%] bottom-[18%] hidden h-11 w-11 rounded-full border border-amber-200 bg-amber-50/80 shadow-md lg:block"
        animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <div className="flex h-full items-center justify-center">
          <Star className="h-5 w-5 text-amber-400" />
        </div>
      </m.div>
      <m.div
        className="pointer-events-none absolute start-[14%] bottom-[15%] hidden h-10 w-10 rounded-full border border-emerald-200 bg-emerald-50/80 shadow-md lg:block"
        animate={{ y: [0, 10, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="flex h-full items-center justify-center">
          <TrendingUp className="h-4 w-4 text-emerald-500/70" />
        </div>
      </m.div>

      {/* Dashed lines */}
      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" style={{ opacity: dark ? 0.06 : 0.05 }}>
        <m.line
          x1="8%" y1="25%" x2="92%" y2="75%"
          stroke={lineColor1} strokeWidth="1" strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 0.8, ease: "easeInOut" }}
        />
        <m.line
          x1="88%" y1="20%" x2="12%" y2="80%"
          stroke={lineColor2} strokeWidth="1" strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 1.2, ease: "easeInOut" }}
        />
      </svg>

      {/* Main content - instant when reduced motion or mobile */}
      <m.div
        className="container relative mx-auto px-4"
        initial={skipAnimations ? false : "hidden"}
        animate="visible"
        variants={skipAnimations ? textRevealInstant : { hidden: {}, visible: {} }}
      >
        <div className="mx-auto max-w-3xl text-center">
          {badge && (
            <m.div
              variants={skipAnimations ? textRevealInstant : textReveal}
              custom={0}
              className={`mb-6 inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-semibold ${badgeStyle}`}
            >
              <m.div
                animate={skipAnimations ? {} : { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4" />
              </m.div>
              {badge}
            </m.div>
          )}

          <m.h1
            variants={skipAnimations ? textRevealInstant : textReveal}
            custom={1}
            className={`mb-5 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl ${textColor}`}
          >
            {title}
          </m.h1>

          {subtitle && (
            <m.p
              variants={skipAnimations ? textRevealInstant : textReveal}
              custom={2}
              className={`mx-auto max-w-xl text-lg leading-relaxed ${subtitleColor}`}
            >
              {subtitle}
            </m.p>
          )}

          {children && (
            <m.div variants={skipAnimations ? textRevealInstant : textReveal} custom={3} className="mt-8">
              {children}
            </m.div>
          )}
        </div>
      </m.div>
    </section>
  )
}
