"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Upload, Link2, X, Loader2, ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MediaUploaderProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  maxSizeMB?: number
  label?: string
  hint?: string
  className?: string
}

type UploadMode = "upload" | "url"

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,.webp"

export default function MediaUploader({
  value,
  onChange,
  accept = ACCEPTED_IMAGE_TYPES,
  maxSizeMB = 5,
  label = "صورة الغلاف",
  hint,
  className,
}: MediaUploaderProps) {
  const [mode, setMode] = useState<UploadMode>("upload")
  const [urlInput, setUrlInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError("")

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`حجم الملف يجب أن لا يتجاوز ${maxSizeMB} ميجابايت`)
        return
      }

      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
      if (!validTypes.includes(file.type)) {
        setError("نوع الملف غير مدعوم. يرجى استخدام PNG, JPG, أو WEBP")
        return
      }

      setUploading(true)
      try {
        const reader = new FileReader()
        reader.onloadend = () => {
          onChange(reader.result as string)
          setUploading(false)
        }
        reader.readAsDataURL(file)
      } catch {
        setError("فشل في رفع الملف")
        setUploading(false)
      }
    },
    [maxSizeMB, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    setError("")
    try {
      new URL(urlInput)
      onChange(urlInput.trim())
      setUrlInput("")
    } catch {
      setError("رابط غير صالح")
    }
  }

  const handleRemove = () => {
    onChange("")
    setError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              mode === "upload"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Upload className="w-3 h-3 inline-block ml-1" />
            رفع
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              mode === "url"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Link2 className="w-3 h-3 inline-block ml-1" />
            رابط
          </button>
        </div>
      </div>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
          <div className="relative aspect-video">
            <Image
              src={value}
              alt="معاينة"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : mode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  اسحب الصورة هنا أو اضغط للرفع
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, WEBP — حد أقصى {maxSizeMB} ميجابايت
                </p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-xl text-left"
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            إضافة
          </Button>
        </div>
      )}

      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}
