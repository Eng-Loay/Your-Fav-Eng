"use client"

import { useEffect, useState } from "react"
import { m } from "framer-motion"

interface VideoWatermarkProps {
  /** Student identifier: phone, email, or ID (fallback order) */
  phone?: string | null
  enabled: boolean
  className?: string
}

export default function VideoWatermark({ phone, enabled, className = "" }: VideoWatermarkProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 })

  useEffect(() => {
    if (!enabled || !phone?.trim()) return
    const interval = setInterval(() => {
      setPosition((prev) => ({
        x: Math.random() * 70 + 10,
        y: Math.random() * 70 + 10,
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [enabled, phone])

  if (!enabled || !phone?.trim()) return null

  const displayText = phone.trim()

  return (
    <m.div
      className={`pointer-events-none absolute z-20 ${className}`}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 0.7,
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      transition={{
        left: { duration: 4, ease: "easeInOut" },
        top: { duration: 4, ease: "easeInOut" },
      }}
      style={{
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        color: "rgba(255,255,255,0.9)",
        fontSize: "clamp(10px, 2vw, 14px)",
        fontWeight: 600,
      }}
    >
      {displayText}
    </m.div>
  )
}
