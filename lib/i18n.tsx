"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

export type Locale = "ar" | "en"
export type Direction = "rtl" | "ltr"

interface I18nContextType {
  locale: Locale
  dir: Direction
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}

export function useDir() {
  const { dir } = useI18n()
  return dir
}

import { translations } from "./translations"
import { getApiBase, fetchWithTimeout, isBackendMarkedDown } from "./api"
import { inter, cairo } from "./fonts"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)

  // Use stable "en"/"ltr" until mounted to avoid hydration mismatch (server vs client
  // when locale is loaded from localStorage/API after mount)
  const stableLocale = mounted ? locale : "en"
  const dir: Direction = stableLocale === "ar" ? "rtl" : "ltr"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    // Body had `inter.className` from layout — that forces Inter and blocks Cairo on children.
    // Swap Next.js font classes so Cairo actually loads and applies for Arabic.
    const body = document.body
    body.classList.remove(inter.className, cairo.className)
    if (locale === "ar") {
      body.classList.add(cairo.className)
      document.documentElement.style.fontFamily = ""
      body.style.fontFamily = ""
    } else {
      body.classList.add(inter.className)
      document.documentElement.style.fontFamily = ""
      body.style.fontFamily = ""
    }
  }, [locale, dir, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const saved = localStorage.getItem("locale") as Locale | null
    if (saved && (saved === "ar" || saved === "en")) {
      setLocaleState(saved)
      return
    }
    // When no user preference, use default from API (admin settings)
    const api = getApiBase()
    if (isBackendMarkedDown()) {
      setLocaleState("en")
      return
    }
    fetchWithTimeout(`${api}/settings/public`, undefined, 3000)
      .then((r) => r.json())
      .then((json) => {
      const def = json?.data?.default_language
      const lang = def === "ar" ? "ar" : "en"
      setLocaleState(lang)
    }).catch(() => setLocaleState("en"))
  }, [mounted])

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".")
      let value: any = translations[locale]
      for (const k of keys) {
        value = value?.[k]
      }
      return typeof value === "string" ? value : key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
