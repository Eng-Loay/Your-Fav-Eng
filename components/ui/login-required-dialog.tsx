"use client"

import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useI18n } from "@/lib/i18n"

interface LoginRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginRequiredDialog({ open, onOpenChange }: LoginRequiredDialogProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const handleLogin = () => {
    onOpenChange(false)
    router.push("/login")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAr ? "يجب تسجيل الدخول" : "Login Required"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAr
              ? "أنت غير مسجل. سجّل دخولك للمتابعة وإضافة المنتجات للسلة أو إتمام الطلب."
              : "You are not logged in. Please sign in to continue, add items to cart, or complete your order."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isAr ? "إغلاق" : "Close"}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
