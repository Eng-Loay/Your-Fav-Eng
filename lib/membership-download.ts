import { getApiBase } from "@/lib/api"

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

async function fetchPdfBlob(url: string, token?: string | null) {
  const res = await fetch(url, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Download failed")
  const contentType = res.headers.get("content-type") || ""
  if (
    !contentType.includes("application/pdf") &&
    !contentType.includes("application/octet-stream") &&
    !url.endsWith(".pdf")
  ) {
    throw new Error("Not a PDF response")
  }
  return res.blob()
}

export async function downloadMembershipPdf(options: {
  membershipId?: string
  membershipNo: string
  memberName?: string
}) {
  if (typeof window === "undefined") return

  const { membershipId, membershipNo, memberName } = options
  const safeName = membershipNo.replace(/[^a-zA-Z0-9-]/g, "")
  const filename = `membership-${safeName || "certificate"}.pdf`
  const token = localStorage.getItem("lms_token")
  const apiBase = getApiBase()

  let resolvedName = memberName?.trim()
  if (!resolvedName) {
    try {
      const rawUser = localStorage.getItem("lms_user")
      const user = rawUser ? JSON.parse(rawUser) : null
      resolvedName = user?.name || user?.email || undefined
    } catch {
      resolvedName = undefined
    }
  }

  const attempts: string[] = []

  if (process.env.NODE_ENV === "development") {
    const query = new URLSearchParams({
      no: membershipNo,
      ...(membershipId ? { id: membershipId } : {}),
      ...(resolvedName ? { name: resolvedName } : {}),
    })
    attempts.push(`${window.location.origin}/api/membership/download?${query}`)
  }

  if (membershipId) {
    attempts.push(`${apiBase}/membership/my/${membershipId}/download`)
  }
  attempts.push(
    `${apiBase}/membership/verify/${encodeURIComponent(membershipNo)}/download`
  )

  for (const url of attempts) {
    try {
      const blob = await fetchPdfBlob(url, token)
      triggerBlobDownload(blob, filename)
      return
    } catch {
      // try next source
    }
  }

  throw new Error("Download failed")
}
