"use client"

import { useState } from "react"
import Image from "next/image"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseImageProps {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  fallbackClassName?: string
}

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true
  if (trimmed.startsWith("/")) return true
  if (trimmed.startsWith("data:image/")) return true
  return false
}

export default function CourseImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  fallbackClassName,
}: CourseImageProps) {
  const [hasError, setHasError] = useState(false)
  const validSrc = isValidImageUrl(src) ? src! : null

  if (!validSrc || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200",
          fill ? "absolute inset-0" : "",
          fallbackClassName || className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <BookOpen className="w-8 h-8 text-slate-400" />
      </div>
    )
  }

  const isExternal = validSrc.startsWith("http")

  if (fill) {
    return (
      <Image
        src={validSrc}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        onError={() => setHasError(true)}
        unoptimized={isExternal}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    )
  }

  return (
    <Image
      src={validSrc}
      alt={alt}
      width={width || 300}
      height={height || 200}
      className={cn("object-cover", className)}
      onError={() => setHasError(true)}
      unoptimized={isExternal}
    />
  )
}
