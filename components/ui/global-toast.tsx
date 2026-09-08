"use client"

import { m, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Info } from "lucide-react"
import { useStore } from "@/lib/store"

const icons = { success: CheckCircle, error: XCircle, info: Info }
const colors = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
}

export function GlobalToast() {
  const { toast } = useStore()

  return (
    <AnimatePresence>
      {toast && (
        <m.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
        >
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-xl backdrop-blur-xl ${colors[toast.type]}`}>
            {(() => { const Icon = icons[toast.type]; return <Icon className="h-5 w-5 shrink-0" /> })()}
            <span className="text-sm font-semibold whitespace-nowrap">{toast.message}</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
