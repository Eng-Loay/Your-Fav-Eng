"use client"

import { useEffect } from "react"
import {
  fetchPlatformAppearance,
  applyAppearanceToDocument,
  getDefaultAppearance,
  clearAppearanceCache,
} from "@/lib/platform-appearance"

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAppearanceToDocument(getDefaultAppearance())
    let cancelled = false
    fetchPlatformAppearance().then((data) => {
      if (!cancelled) applyAppearanceToDocument(data)
    }).catch(() => {
      if (!cancelled) applyAppearanceToDocument(getDefaultAppearance())
    })
    const apply = () => {
      clearAppearanceCache()
      fetchPlatformAppearance().then(applyAppearanceToDocument).catch(() => applyAppearanceToDocument(getDefaultAppearance()))
    }
    window.addEventListener("appearance-update", apply)
    return () => {
      cancelled = true
      window.removeEventListener("appearance-update", apply)
    }
  }, [])

  return <>{children}</>
}
