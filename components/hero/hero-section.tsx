"use client"

import { m } from "framer-motion"
import Image from "next/image"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import Link from "next/link"

const particles = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  x: ((i * 17 + 13) % 97) + 1,
  y: ((i * 23 + 7) % 93) + 2,
  size: 1.5 + ((i * 11) % 11) / 10,
  duration: 6 + ((i * 7) % 5),
  delay: (i * 3) % 4,
}))

export default function HeroSection() {
  const { t } = useI18n()

  const textReveal = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  }

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }

  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-black">
      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Gradient orbs */}
        <m.div
          className="absolute -top-40 start-[-15%] h-[600px] w-[600px] rounded-full bg-white/[0.03] blur-[120px]"
          style={{ willChange: "opacity" }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute -bottom-32 end-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px]"
          style={{ willChange: "opacity" }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Floating particles */}
        {particles.map((p) => (
          <m.div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, willChange: "transform, opacity" }}
            animate={{ y: [0, -20, 0], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Radial gradient center */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 70%)"
        }} />
      </div>

      {/* Top accent line */}
      <m.div
        className="absolute top-0 inset-x-0 h-[1px]"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />

      <div className="container relative mx-auto flex min-h-[100vh] flex-col items-center px-4 pb-8 pt-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-16 lg:pt-28">
        {/* Text content */}
        <m.div
          className="relative z-10 flex-1 text-center lg:text-start"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Badge */}
          <m.div
            variants={textReveal}
            custom={0}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm"
          >
            <m.div
              style={{ willChange: "transform" }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-white/50" />
            </m.div>
            Dental Graphics Education
          </m.div>

          {/* Platform Name */}
          <m.div
            variants={textReveal}
            custom={1}
            className="mb-4"
          >
            <span className="font-display text-lg font-medium tracking-[0.3em] uppercase text-white/40">
              AY DentVision
            </span>
          </m.div>

          {/* Main heading */}
          <m.h1
            variants={textReveal}
            custom={2}
            className="mb-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] xl:text-6xl"
          >
            <span className="block">Create. Innovate.</span>
            <span className="block mt-1">
              Dominate{" "}
                <span className="relative inline-block">
                <span className="gradient-text-accent">Dental Content</span>
                <m.span
                  className="absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
                />
              </span>
              .
            </span>
          </m.h1>

          {/* Subtitle */}
          <m.p
            variants={textReveal}
            custom={3}
            className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-white/50 lg:mx-0 sm:text-lg"
          >
            {t("hero.subtitle")}
          </m.p>

          {/* Buttons */}
          <m.div
            variants={textReveal}
            custom={4}
            className="flex flex-wrap items-center justify-center gap-4 lg:justify-start mb-16"
          >
            <Button
              asChild
              size="lg"
              className="group relative h-14 min-w-[180px] overflow-hidden rounded-xl bg-white px-10 text-base font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:scale-[1.02]"
            >
              <Link href="/courses" className="flex items-center justify-center gap-2.5">
                <m.span
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-black/5 to-white/0"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                />
                {t("hero.browseCourses")}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group h-14 min-w-[180px] rounded-xl border-2 border-white/20 bg-white/5 px-10 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:scale-[1.02]"
            >
              <Link href="/courses" className="flex items-center justify-center gap-2.5">
                <Play className="h-5 w-5 fill-current shrink-0" />
                {t("hero.startLearning")}
              </Link>
            </Button>
          </m.div>

          {/* Stats */}
          <m.div
            variants={textReveal}
            custom={5}
            className="flex items-center justify-center gap-10 lg:justify-start"
          >
            {[
              { value: "500+", label: "Students" },
              { value: "10+", label: "Courses" },
              { value: "4.9", label: "Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center lg:text-start">
                <p className="text-2xl font-bold text-white font-display">{stat.value}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Character image area */}
        <m.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative mt-16 flex flex-1 justify-center lg:mt-0 lg:max-w-[55%]"
        >
          <div className="relative flex h-[560px] w-full max-w-[480px] items-end justify-center lg:h-[680px] lg:max-w-[560px]">
            {/* Glow behind character */}
            <div className="absolute bottom-[10%] start-1/2 -translate-x-1/2 h-[320px] w-[420px] rounded-full bg-indigo-500/[0.08] blur-[80px]" />

            {/* Main backdrop shape */}
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute bottom-0 h-[400px] w-[380px] rounded-3xl sm:h-[420px] sm:w-[400px] lg:h-[500px] lg:w-[480px]"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(99,102,241,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="absolute inset-0 rounded-3xl opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
            </m.div>

            {/* Orbit ring */}
            <m.div
              className="pointer-events-none absolute bottom-[25%] start-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full border border-white/[0.04] sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]"
              style={{ willChange: "transform" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute -top-1 start-1/2 h-2 w-2 rounded-full bg-white/20" />
            </m.div>

            {/* Floating badge - courses */}
            <m.div
              initial={{ opacity: 0, x: -40, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 1, ease: "backOut" }}
              className="absolute -start-2 top-[35%] z-20 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:-start-6"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">DentPresentX</p>
                  <p className="text-xs text-white/40">Featured Course</p>
                </div>
              </div>
            </m.div>

            {/* Floating badge - AI */}
            <m.div
              initial={{ opacity: 0, x: 40, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 1.2, ease: "backOut" }}
              className="absolute -end-2 top-[18%] z-20 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:-end-6"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                  <Play className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AI Dental Creator</p>
                  <p className="text-xs text-white/40">New Course</p>
                </div>
              </div>
            </m.div>

            {/* Character image */}
            <m.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 flex w-full justify-center"
            >
              <div className="relative h-[480px] w-[380px] sm:h-[540px] sm:w-[420px] lg:h-[620px] lg:w-[500px]">
                <Image
                  src="/hero-character.png"
                  alt="AY DentVision"
                  fill
                  className="object-contain object-bottom drop-shadow-[0_20px_60px_rgba(99,102,241,0.15)]"
                  sizes="(max-width: 1024px) 420px, 500px"
                  priority
                />

                <div
                  className="absolute -bottom-2 start-1/2 -translate-x-1/2 h-8 w-[60%] rounded-full bg-indigo-500/10 blur-xl"
                />
              </div>
            </m.div>
          </div>
        </m.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </section>
  )
}
