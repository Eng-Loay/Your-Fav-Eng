"use client"

import { useState } from "react"
import { m } from "framer-motion"
import { FileText, ZoomIn, ZoomOut, Maximize, Minimize, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PDFViewerProps {
  src: string
  title?: string
  className?: string
}

export default function PDFViewer({ src, title, className }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    const el = document.getElementById("pdf-viewer-container")
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <m.div
      id="pdf-viewer-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white",
        isFullscreen && "fixed inset-0 z-[9999] rounded-none border-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
            <FileText className="h-5 w-5 text-red-500" />
          </div>
          {title && (
            <span className="text-sm font-semibold text-[#0F172A]">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-primary/10 hover:text-primary"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF embed */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-[#64748B]">جاري تحميل الملف...</span>
            </div>
          </div>
        )}
        <iframe
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          className={cn(
            "w-full border-0",
            isFullscreen ? "h-[calc(100vh-52px)]" : "h-[600px] sm:h-[700px] lg:h-[800px]"
          )}
          onLoad={() => setIsLoading(false)}
          title={title ?? "PDF Document"}
        />
      </div>
    </m.div>
  )
}
