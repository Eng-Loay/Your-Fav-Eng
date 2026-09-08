"use client"

import { useRef, useState, useEffect, type ReactNode } from "react"

interface LazyWhenVisibleProps {
  children: ReactNode
  /** Min height placeholder before load (avoids layout shift) */
  minHeight?: number | string
  /** Root margin for IntersectionObserver - load earlier when scrolling */
  rootMargin?: string
  /** Only enable on mobile - desktop loads immediately */
  mobileOnly?: boolean
}

export function LazyWhenVisible({ children, minHeight = 200, rootMargin = "150px", mobileOnly = false }: LazyWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!mobileOnly) {
      setVisible(true)
      return
    }
    const mobile = window.matchMedia("(max-width: 768px)")
    if (!mobile.matches) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true)
      },
      { rootMargin, threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mobileOnly, rootMargin])

  if (visible) return <>{children}</>

  return <div ref={ref} style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }} aria-hidden />
}
