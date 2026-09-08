"use client"

import { useState, useRef, useEffect } from "react"
import { m } from "framer-motion"
import { User, Bell, Lock, Globe, Save, Camera, CreditCard, Percent } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr, compressImageFile } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useApi, api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function TeacherSettingsPage() {
  const { locale, dir } = useI18n()
  const { user, refreshUser, showToast } = useStore()
  const isRTL = dir === "rtl"
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "payment" | "notifications">("profile")

  const { data: profileData } = useApi(() => api.getTeacherProfile())
  const profile = profileData as { name?: string; email?: string; phone?: string; bio?: string; teacherProfile?: { subject?: string; specialty?: string; revenueShare?: number } } | null
  const revenueShare = profile?.teacherProfile?.revenueShare ?? 70

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? user?.name ?? "")
      setEmail(profile.email ?? user?.email ?? "")
      setPhone(profile.phone ?? (user as any)?.phone ?? "")
      setSubject(profile.teacherProfile?.subject ?? profile.teacherProfile?.specialty ?? "")
      setBio(profile.bio ?? "")
    } else if (user) {
      setName(user.name ?? "")
      setEmail(user.email ?? "")
      setPhone((user as any)?.phone ?? "")
    }
  }, [profile, user])

  const handleSaveProfile = async () => {
    const res = await api.updateTeacherProfile({ name, email, phone, subject, bio })
    if (res.success) await refreshUser?.()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    try {
      const compressed = await compressImageFile(file)
      const res = await api.uploadAvatar(compressed)
      if (res.success && res.data?.avatar) {
        await refreshUser?.()
      } else {
        setAvatarPreview(null)
        showToast?.(res.message || (locale === "ar" ? "فشل رفع الصورة" : "Failed to upload photo"), "error")
      }
    } catch {
      setAvatarPreview(null)
      showToast?.(locale === "ar" ? "حدث خطأ أثناء رفع الصورة" : "Something went wrong uploading the photo", "error")
    }
  }

  const tabs = [
    { key: "profile" as const, labelEn: "Profile", labelAr: "الملف الشخصي", icon: User },
    { key: "payment" as const, labelEn: "Payment", labelAr: "الدفع", icon: CreditCard },
    { key: "notifications" as const, labelEn: "Notifications", labelAr: "الإشعارات", icon: Bell },
  ]

  const notificationSettings = [
    { key: "email_assignments", labelEn: "New assignment submissions", labelAr: "تسليمات الواجبات الجديدة", enabled: true },
    { key: "email_messages", labelEn: "New messages", labelAr: "الرسائل الجديدة", enabled: true },
    { key: "email_schedule", labelEn: "Schedule changes", labelAr: "تغييرات الجدول", enabled: false },
    { key: "email_grades", labelEn: "Grade reports", labelAr: "تقارير الدرجات", enabled: true },
    { key: "email_admin", labelEn: "Admin announcements", labelAr: "إعلانات الإدارة", enabled: true },
  ]

  return (
    <div className="space-y-6">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-[#0F172A]">{locale === "ar" ? "الإعدادات" : "Settings"}</h2>
        <p className="text-sm text-[#64748B] mt-1">{locale === "ar" ? "إدارة ملفك الشخصي وتفضيلاتك" : "Manage your profile and preferences"}</p>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 border-b border-[#E2E8F0]/60 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-[#059669] text-[#059669]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {locale === "ar" ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </m.div>

      {activeTab === "profile" && (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-[#059669]/10">
                <Image src={avatarPreview || user?.avatar || "/user-avatar.png"} alt="" fill className="object-cover" />
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -end-2 h-8 w-8 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-lg">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0F172A]">{safeStr(user?.name, locale === "ar" ? "المعلم" : "Teacher")}</h3>
              <p className="text-sm text-[#64748B]">{user?.email || "teacher@example.com"}</p>
              <p className="text-xs text-[#059669] font-semibold mt-1">{locale === "ar" ? "معلم" : "Teacher"}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "رقم الهاتف" : "Phone"}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "التخصص" : "Subject"}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "نبذة عني" : "Bio"}</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveProfile} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-2">
              <Save className="w-4 h-4" />
              {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </div>
        </m.div>
      )}

      {activeTab === "payment" && (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <h3 className="font-bold text-lg text-[#0F172A] mb-6">{locale === "ar" ? "إعدادات الدفع" : "Payment Settings"}</h3>

          {/* Commission / Revenue Share - Read-only */}
          <div className="rounded-xl bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 border border-[#059669]/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#059669]/10">
                <Percent className="w-5 h-5 text-[#059669]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F172A]">
                  {locale === "ar" ? "نسبة العمولة" : "Commission Rate"}
                </p>
                <p className="text-xs text-[#64748B]">
                  {locale === "ar"
                    ? `حصتك من إيرادات الدورات: ${revenueShare}% • عمولة المنصة: ${100 - revenueShare}%`
                    : `Your share of course revenue: ${revenueShare}% • Platform fee: ${100 - revenueShare}%`}
                </p>
              </div>
              <span className="text-xl font-extrabold text-[#059669]">{revenueShare}%</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-2">
              {locale === "ar" ? "يتم تحديد النسبة من قبل إدارة المنصة. للاستفسار تواصل مع الدعم." : "This rate is set by the platform. Contact support for inquiries."}
            </p>
          </div>
        </m.div>
      )}

      {activeTab === "notifications" && (
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-sm p-6">
          <h3 className="font-bold text-[#0F172A] mb-4">{locale === "ar" ? "تفضيلات الإشعارات" : "Notification Preferences"}</h3>
          <div className="space-y-4">
            {notificationSettings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                <span className="text-sm font-medium text-[#0F172A]">{locale === "ar" ? setting.labelAr : setting.labelEn}</span>
                <button
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    setting.enabled ? "bg-[#059669]" : "bg-[#E2E8F0]"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      setting.enabled ? (isRTL ? "start-1" : "start-6") : "start-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl gap-2">
              <Save className="w-4 h-4" />
              {locale === "ar" ? "حفظ التفضيلات" : "Save Preferences"}
            </Button>
          </div>
        </m.div>
      )}
    </div>
  )
}
