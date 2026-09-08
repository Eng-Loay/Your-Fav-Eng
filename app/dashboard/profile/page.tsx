"use client"

import { useState, useEffect, useRef } from "react"
import { m } from "framer-motion"
import { Camera, Check, Lock, User as UserIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr, compressImageFile } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"

export default function ProfilePage() {
  const { locale, dir, t } = useI18n()
  const { user, showToast, refreshUser } = useStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(user?.name ?? (locale === "ar" ? "أحمد الشمري" : "Ahmed Al-Shammari"))
  const [email, setEmail] = useState(user?.email ?? "ahmed@example.com")
  const [phone, setPhone] = useState(user?.phone ?? "+966 50 123 4567")
  const [city, setCity] = useState(user?.city ?? (locale === "ar" ? "الرياض" : "Riyadh"))
  const [bio, setBio] = useState(user?.bio ?? (locale === "ar" ? "مطور ويب شغوف بالتعلّم المستمر وبناء تطبيقات ويب حديثة." : "Passionate web developer who loves continuous learning and building modern web applications."))
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setEmail(user.email ?? "")
      setPhone(user.phone ?? "")
      setCity(user.city ?? "")
      setBio(user.bio ?? "")
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.updateProfile({ name, email, phone, city, bio })
      if (res.success) {
        await refreshUser()
        setSaved(true)
        showToast(locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully", "success")
        setTimeout(() => setSaved(false), 3000)
      } else {
        showToast(res.message ?? (locale === "ar" ? "فشل الحفظ" : "Failed to save"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "حدث خطأ" : "Something went wrong", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setUploadingAvatar(true)
    try {
      const compressed = await compressImageFile(file)
      const res = await api.uploadAvatar(compressed)
      if (res.success) {
        await refreshUser()
        showToast(locale === "ar" ? "تم تحديث الصورة الشخصية" : "Profile photo updated", "success")
      } else {
        setAvatarPreview(null)
        showToast(res.message ?? (locale === "ar" ? "فشل رفع الصورة" : "Failed to upload photo"), "error")
      }
    } catch {
      setAvatarPreview(null)
      showToast(locale === "ar" ? "حدث خطأ أثناء رفع الصورة" : "Something went wrong uploading the photo", "error")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showToast(locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match", "error")
      return
    }
    if (!currentPassword || !newPassword) {
      showToast(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields", "error")
      return
    }
    setChangingPassword(true)
    try {
      const res = await api.changePassword(currentPassword, newPassword)
      if (res.success) {
        showToast(locale === "ar" ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully", "success")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        showToast(res.message ?? (locale === "ar" ? "فشل تحديث كلمة المرور" : "Failed to update password"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "حدث خطأ" : "Something went wrong", "error")
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div dir={dir}>
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.profileSettings")}</h2>

      {saved && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
        >
          <Check className="w-5 h-5" />
          <span>{locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully"}</span>
        </m.div>
      )}

      <div className="space-y-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] border border-border p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview ?? user?.avatar ?? undefined} />
                <AvatarFallback className="text-2xl">
                  <UserIcon className="w-10 h-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -end-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg">{safeStr(user?.name, locale === "ar" ? "أحمد الشمري" : "Ahmed Al-Shammari")}</h3>
              <p className="text-muted-foreground text-sm">{user?.email ?? "ahmed@example.com"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{locale === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-12" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "رقم الهاتف" : "Phone"}</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-12" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "المدينة" : "City"}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{locale === "ar" ? "نبذة عنك" : "Bio"}</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-primary/90 text-white px-8"
            >
              {saving
                ? locale === "ar" ? "جاري الحفظ..." : "Saving..."
                : t("dashboard.save")}
            </Button>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[20px] border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-bold text-lg">{locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>{locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl h-12" />
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" className="rounded-xl" onClick={handlePasswordChange} disabled={changingPassword}>
              {changingPassword ? (locale === "ar" ? "جاري التحديث..." : "Updating...") : (locale === "ar" ? "تحديث كلمة المرور" : "Update Password")}
            </Button>
          </div>
        </m.div>
      </div>
    </div>
  )
}
