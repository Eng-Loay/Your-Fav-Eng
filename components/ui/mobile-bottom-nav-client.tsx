"use client"

import dynamic from "next/dynamic"

const MobileBottomNav = dynamic(
  () => import("./mobile-bottom-nav").then((m) => m.MobileBottomNav),
  { ssr: false }
)

export function MobileBottomNavClient() {
  return <MobileBottomNav />
}

