"use client"

import { useState, useEffect } from "react"
import {
  fetchPlatformCurrency,
  formatCurrency as formatCurrencyUtil,
} from "@/lib/currency"

export function usePlatformCurrency() {
  const [currency, setCurrency] = useState<string>("USD")

  useEffect(() => {
    let cancelled = false
    fetchPlatformCurrency().then((code) => {
      if (!cancelled) setCurrency(code)
    })
    return () => { cancelled = true }
  }, [])

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currency)

  return { currency, formatCurrency }
}
