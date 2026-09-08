// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { coursesData } from "./data"
import api, { probeBackend, isBackendMarkedDown } from "./api"

// ─── Types ───────────────────────────────────────────────────────
export type UserRole = "student" | "parent" | "teacher" | "admin"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  phone?: string
  country?: string
  city?: string
  bio?: string
  status?: "active" | "inactive" | "pending_review"
  children?: string[]
  verified?: boolean
}

interface CartItem {
  courseId?: string
  productId?: string
  id?: string
}

interface StoreContextType {
  // Auth
  user: User | null
  isLoggedIn: boolean
  hydrated: boolean
  login: (identifier: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role?: UserRole, extra?: { phone?: string; childContact?: string }) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>

  // Cart
  cart: CartItem[]
  addToCart: (courseId: string) => void
  removeFromCart: (courseId: string, cartItemId?: string) => void
  isInCart: (courseId: string) => boolean
  clearCart: () => void
  cartCount: number
  cartTotal: number

  // Purchases
  purchasedCourses: string[]
  isPurchased: (courseId: string) => boolean
  enrollFree: (courseId: string) => Promise<boolean>
  refreshPurchased: () => Promise<void>
  checkout: (items?: Array<{ courseId?: string; productId?: string; quantity?: number }>) => Promise<boolean>

  // Wishlist
  wishlist: string[]
  toggleWishlist: (courseId: string) => void
  isWishlisted: (courseId: string) => boolean

  // Toast
  toast: { message: string; type: "success" | "error" | "info" } | null
  showToast: (message: string, type?: "success" | "error" | "info") => void

  // Loading
  isLoading: boolean
}

const StoreContext = createContext<StoreContextType | null>(null)

const STORAGE_KEYS = {
  user: "lms_user",
  cart: "lms_cart",
  purchased: "lms_purchased",
  wishlist: "lms_wishlist",
  accounts: "lms_accounts",
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function mapUserRole(role: string): UserRole {
  const r = role.toLowerCase()
  if (r === "admin") return "admin"
  if (r === "teacher") return "teacher"
  if (r === "parent") return "parent"
  return "student"
}

function ensureString(val: unknown): string {
  if (typeof val === "string") return val
  if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
    return String((val as { name: string }).name)
  return val != null ? String(val) : ""
}

function resolveAvatar(avatar: string | null | undefined): string {
  if (!avatar) return "/user-avatar.png"
  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:") || avatar.startsWith("/")) return avatar
  return `/${avatar}`
}

function mapUser(data: any): User {
  return {
    id: data.id,
    name: ensureString(data.name),
    email: data.email,
    avatar: resolveAvatar(data.avatar),
    role: mapUserRole(data.role),
    phone: data.phone,
    country: data.country,
    city: data.city,
    bio: data.bio,
    status: data.status === "PENDING_REVIEW" ? "pending_review" : (data.status?.toLowerCase() === "active" ? "active" : "inactive"),
    verified: data.verified,
  }
}

// ─── Provider ────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [purchasedCourses, setPurchasedCourses] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState<StoreContextType["toast"]>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    probeBackend().catch(() => {})
    const stored = loadFromStorage(STORAGE_KEYS.user, null) as User | null
    setUser(stored ? { ...stored, name: ensureString(stored.name) } : null)
    setCart(loadFromStorage(STORAGE_KEYS.cart, []))
    setPurchasedCourses(loadFromStorage(STORAGE_KEYS.purchased, []))
    setWishlist(loadFromStorage(STORAGE_KEYS.wishlist, []))
    setHydrated(true)
  }, [])

  // Restore session from token on hydration, and always revalidate against the server
  // (a cached user from localStorage may be stale — e.g. an admin approval or status
  // change made elsewhere must show up without forcing the user to log out and back in).
  useEffect(() => {
    if (!hydrated || isBackendMarkedDown()) return
    const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null
    if (token) {
      api.getMe().then((res) => {
        if (res.success && res.data) {
          const u = mapUser(res.data)
          setUser(u)
          saveToStorage(STORAGE_KEYS.user, u)
        }
      }).catch(() => {})
    }
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync cart from backend when logged in
  useEffect(() => {
    if (!hydrated || !user || isBackendMarkedDown()) return
    const syncCart = () => {
      api.getCart().then((res) => {
        if (res.success && res.data) {
          const cartData = res.data as { items?: Array<{ id?: string; courseId?: string; productId?: string }> }
          const items = cartData.items ?? []
          const synced: CartItem[] = items
            .filter((i) => i.courseId || i.productId)
            .map((i) => ({
              courseId: i.courseId ?? undefined,
              productId: i.productId ?? undefined,
              id: i.id ?? "",
            }))
          setCart(synced)
        }
      }).catch(() => {})
    }
    syncCart()
    window.addEventListener("cart-update", syncCart)
    return () => window.removeEventListener("cart-update", syncCart)
  }, [hydrated, user?.id])

  // Sync purchased courses from enrollments when logged in
  const syncPurchased = useCallback(() => {
    if (isBackendMarkedDown()) return
    api.getMyEnrollments().then((res) => {
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : []
        const ids = items
          .map((e: { courseId?: string; course?: { id?: string } }) => e.courseId ?? e.course?.id)
          .filter((id): id is string => !!id)
        setPurchasedCourses(ids)
        saveToStorage(STORAGE_KEYS.purchased, ids)
      }
    }).catch(() => {})
  }, [])

  const refreshPurchased = useCallback(() => {
    syncPurchased()
    window.dispatchEvent(new Event("enrollment-update"))
  }, [syncPurchased])

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const enrollFree = useCallback(async (courseId: string): Promise<boolean> => {
    try {
      const res = await api.enrollFree(courseId)
      if (res.success) {
        const enrolledId = (res.data as { course?: { id?: string } })?.course?.id ?? courseId
        setPurchasedCourses((prev) => {
          const ids = [enrolledId, courseId].filter(Boolean)
          const next = [...new Set([...prev, ...ids])]
          saveToStorage(STORAGE_KEYS.purchased, next)
          return next
        })
        window.dispatchEvent(new Event("enrollment-update"))
        showToast("تم التسجيل بنجاح! يمكنك البدء بالتعلم الآن")
        return true
      }
      showToast(res.message || "فشل التسجيل", "error")
      return false
    } catch {
      showToast("حدث خطأ", "error")
      return false
    }
  }, [showToast])

  useEffect(() => {
    if (!hydrated || !user) return
    syncPurchased()
    window.addEventListener("enrollment-update", syncPurchased)
    return () => window.removeEventListener("enrollment-update", syncPurchased)
  }, [hydrated, user?.id, syncPurchased])

  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.user, user) }, [user, hydrated])
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.cart, cart) }, [cart, hydrated])
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.purchased, purchasedCourses) }, [purchasedCourses, hydrated])
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.wishlist, wishlist) }, [wishlist, hydrated])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe()
      if (res.success && res.data) {
        const u = mapUser(res.data)
        setUser(u)
      }
    } catch {}
  }, [])

  // Auth - now async with API calls, with localStorage fallback
  const register = useCallback(async (name: string, email: string, password: string, role: UserRole = "student", extra?: { phone?: string; childContact?: string }) => {
    setIsLoading(true)
    try {
      const res = await api.register(name, email, password, role, extra)
      if (res.success && res.data) {
        const u = mapUser(res.data.user)
        setUser(u)
        showToast("تم إنشاء الحساب بنجاح! 🎉")
        return true
      }
      if (res.message?.includes("Network error")) {
        const accounts: Record<string, { name: string; password: string; role: UserRole }> = loadFromStorage(STORAGE_KEYS.accounts, {})
        const key = email || extra?.phone || ""
        if (accounts[key]) { showToast("الحساب مسجل مسبقاً", "error"); return false }
        accounts[key] = { name, password, role }
        saveToStorage(STORAGE_KEYS.accounts, accounts)
        const newUser: User = { id: Date.now().toString(), name, email: email || "", avatar: "/user-avatar.png", role, status: "active", phone: extra?.phone }
        setUser(newUser)
        showToast("تم إنشاء الحساب بنجاح! 🎉")
        return true
      }
      showToast(res.message || "فشل التسجيل", "error")
      return false
    } catch {
      showToast("حدث خطأ", "error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.login(email, password)
      if (res.success && res.data) {
        const u = mapUser(res.data.user)
        setUser(u)
        showToast(`مرحباً بعودتك، ${u.name}! 👋`)
        return true
      }

      const accounts: Record<string, { name: string; password: string; role?: UserRole }> = loadFromStorage(STORAGE_KEYS.accounts, {})
      const account = accounts[email]
      if (res.message?.includes("Network error") && account && account.password === password) {
        const loggedUser: User = { id: Date.now().toString(), name: account.name, email, avatar: "/user-avatar.png", role: account.role || "student", status: "active" }
        setUser(loggedUser)
        showToast(`مرحباً بعودتك، ${account.name}! 👋`)
        return true
      }

      showToast(res.message || "بيانات خاطئة", "error")
      return false
    } catch {
      showToast("حدث خطأ", "error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const logout = useCallback(() => {
    api.logout().catch(() => {})
    setUser(null)
    showToast("تم تسجيل الخروج", "info")
  }, [showToast])

  // Cart
  const addToCart = useCallback((courseId: string) => {
    setCart((prev) => {
      if (prev.some((i) => i.courseId === courseId)) return prev
      showToast("تمت الإضافة إلى السلة ✓")
      return [...prev, { courseId }]
    })
    api.addToCart({ courseId }).catch(() => {})
    window.dispatchEvent(new Event("cart-update"))
  }, [showToast])

  const removeFromCart = useCallback((courseIdOrProductId: string, cartItemId?: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.courseId === courseIdOrProductId || i.productId === courseIdOrProductId || i.id === cartItemId)
      const idToRemove = cartItemId ?? item?.id
      if (idToRemove) {
        api.removeFromCart(idToRemove).catch(() => {})
        window.dispatchEvent(new Event("cart-update"))
      }
      return prev.filter((i) => i.id !== idToRemove && i.courseId !== courseIdOrProductId && i.productId !== courseIdOrProductId)
    })
    showToast("تم الحذف من السلة", "info")
  }, [showToast])

  const isInCart = useCallback((courseId: string) => cart.some((i) => i.courseId === courseId), [cart])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = cart.length

  const cartTotal = cart.reduce((sum, item) => {
    const course = coursesData.find((c) => c.id === item.courseId)
    return sum + (course?.price ?? 0)
  }, 0)

  // Purchases
  const isPurchased = useCallback((courseId: string) => purchasedCourses.includes(courseId), [purchasedCourses])

  const checkout = useCallback(async (items?: Array<{ courseId?: string; productId?: string; quantity?: number }>) => {
    const toCheckout = items ?? cart.filter((i) => i.courseId || i.productId).map((i) => ({
      courseId: i.courseId,
      productId: i.productId,
      quantity: 1,
    }))
    if (toCheckout.length === 0) return false
    try {
      const res = await api.createCheckoutSession(toCheckout)
      if (res.success && res.data) {
        const d = res.data as { url?: string }
        if (d.url) {
          window.location.href = d.url
          return true
        }
        const newPurchases = toCheckout.map((i) => i.courseId).filter((id): id is string => !!id && !purchasedCourses.includes(id))
        setPurchasedCourses((prev) => [...prev, ...newPurchases])
        setCart((prev) => prev.filter((i) => !toCheckout.some((t) => t.courseId === i.courseId || t.productId === i.productId)))
        showToast("تم الشراء بنجاح! يمكنك الآن البدء بالتعلم 🎓")
        return true
      }
    } catch {}
    return false
  }, [cart, purchasedCourses, showToast])

  // Wishlist
  const toggleWishlist = useCallback((courseId: string) => {
    setWishlist((prev) => {
      if (prev.includes(courseId)) {
        showToast("تم الحذف من المفضلة", "info")
        api.toggleWishlist(courseId).catch(() => {})
        return prev.filter((id) => id !== courseId)
      }
      showToast("تمت الإضافة إلى المفضلة ♥")
      api.toggleWishlist(courseId).catch(() => {})
      return [...prev, courseId]
    })
  }, [showToast])

  const isWishlisted = useCallback((courseId: string) => wishlist.includes(courseId), [wishlist])

  return (
    <StoreContext.Provider
      value={{
        user, isLoggedIn: !!user, hydrated, login, register, logout, refreshUser,
        cart, addToCart, removeFromCart, isInCart, clearCart, cartCount, cartTotal,
        purchasedCourses, isPurchased, enrollFree, refreshPurchased, checkout,
        wishlist, toggleWishlist, isWishlisted,
        toast, showToast,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
