"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { Maximize2, Minimize2, BookOpen, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { portraitAwareObjectClass } from "@/lib/brand-assets"

interface ImageFlipbookProps {
  pages: readonly string[]
  isRtl?: boolean
  className?: string
}

export function ImageFlipbook({ pages, isRtl = false, className }: ImageFlipbookProps) {
  const [index, setIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "x",
    direction: isRtl ? "rtl" : "ltr",
    dragFree: false,
    containScroll: "trimSnaps",
    duration: 28,
  })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit({ direction: isRtl ? "rtl" : "ltr" })
  }, [emblaApi, isRtl])

  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [fullscreen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        fullscreen && "fixed inset-0 z-50 justify-center bg-black/85 p-3 sm:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "relative mx-auto w-full select-none",
          fullscreen ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100 to-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-slate-300/40" aria-hidden />

          <div
            ref={emblaRef}
            className="overflow-hidden"
            style={{ touchAction: "pan-y pinch-zoom" }}
          >
            <div className="flex">
              {pages.map((src, i) => (
                <div key={`${src}-${i}`} className="min-w-0 shrink-0 grow-0 basis-full">
                  <div className="relative aspect-[3/4] w-full cursor-grab active:cursor-grabbing">
                    <Image
                      src={src}
                      alt=""
                      fill
                      unoptimized
                      priority={i < 2}
                      className={cn(portraitAwareObjectClass(src), "pointer-events-none")}
                      sizes="(max-width: 768px) 92vw, 512px"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur-sm">
            <BookOpen className="h-4 w-4 text-primary/70" />
            <span className="text-xs font-medium text-slate-600">
              {index + 1} / {pages.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {!fullscreen && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Hand className="h-4 w-4 shrink-0 text-primary/70" />
          <p className="text-center">
            {isRtl
              ? "اسحب بإصبعك يميناً أو يساراً لتقليب الصفحة"
              : "Swipe with your finger left or right to flip pages"}
          </p>
        </div>
      )}
    </div>
  )
}
