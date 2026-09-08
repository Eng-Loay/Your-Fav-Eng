"use client"

import { useState, useEffect } from "react"
import {
  fetchPlatformBranding,
  getDefaultBranding,
  type PlatformBranding,
} from "@/lib/platform-config"

export function usePlatformBranding() {
  const [branding, setBranding] = useState<PlatformBranding>(getDefaultBranding())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPlatformBranding().then((data) => {
      if (!cancelled) setBranding(data)
    }).catch(() => {
      if (!cancelled) setBranding(getDefaultBranding())
    })
    return () => { cancelled = true }
  }, [])

  return { branding, loading }
}
