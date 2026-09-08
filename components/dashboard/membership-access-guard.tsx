"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useApi, api } from "@/hooks/use-api"
import { hasActiveMembership } from "@/lib/membership-utils"

export function MembershipAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data, loading } = useApi(() => api.getMyMemberships(), { immediate: true })
  const allowed = hasActiveMembership(data)

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/dashboard")
    }
  }, [loading, allowed, router])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
