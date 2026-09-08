"use client"

import React, { createContext, useContext, useMemo } from "react"
import { usePathname } from "next/navigation"
import { isMarketingSurfacePath } from "@/lib/marketing-surface"

const MarketingSurfaceContext = createContext(false)

export function useMarketingSurface(): boolean {
  return useContext(MarketingSurfaceContext)
}

export function MarketingSurfaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMarketing = useMemo(() => isMarketingSurfacePath(pathname), [pathname])

  return (
    <MarketingSurfaceContext.Provider value={isMarketing}>
      {isMarketing ? (
        <div className="min-h-screen bg-mds-background text-mds-on-background font-inter antialiased">
          {children}
        </div>
      ) : (
        children
      )}
    </MarketingSurfaceContext.Provider>
  )
}
