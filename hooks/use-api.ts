"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import api from "@/lib/api"

interface UseApiOptions {
  immediate?: boolean
  deps?: unknown[]
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T>(
  fetcher: () => Promise<{ success: boolean; data?: T; message?: string }>,
  options: UseApiOptions = { immediate: true }
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(options.immediate !== false)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcherRef.current()
      if (res.success && res.data !== undefined) {
        setData(res.data)
      } else {
        setError(res.message || "Failed to fetch data")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (options.immediate !== false) {
      refetch()
    }
  }, [options.immediate, refetch, ...(options.deps ?? [])])

  return { data, loading, error, refetch }
}

export { api }
