"use client"

import { useState, useRef } from "react"
import { m } from "framer-motion"
import { User, Bell, Save, Camera } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { safeStr } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { api, useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function ParentSettingsPage() {
  const { locale, dir } = useI18n()
  const { user, showToast, refreshUser } = useStore()
  const { data: profileData } = useApi(() => api.getParentProfile())
  const isRTL = dir === "rtl"
  const [activeTab, setActiveTab] = useState("profile")
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const relationshipRef = useRef<HTMLSelectElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { key: "profile", labelEn: "Profile", labelAr: "الملف الشخصي", icon: User },
    { key: "notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: Bell },
  ]

  const notificationSettings = [
    { key: "grades", labelEn: "Grade updates", labelAr: "تحديثات الدرجات", enabled: true },
    { key: "attendance", labelEn: "Attendance alerts", labelAr: "تنبيهات الحضور", enabled: true },
    { key: "messages", labelEn: "New messages from teachers", labelAr: "رسائل جديدة من المعلمين", enabled: true },
    { key: "events", labelEn: "School events & announcements", labelAr: "فعاليات وإعلانات المدرسة", enabled: false },
    { key: "reports", labelEn: "Weekly progress reports", labelAr: "تقارير التقدم الأسبوعية", enabled: true },
    { key: "assignments", labelEn: "Assignment deadlines", labelAr: "مواعيد تسليم الواجبات", enabled: true },
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
                ? "border-[#EC4899] text-[#EC4899]"
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
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-[#EC4899]/10">
                <Image src={user?.avatar || "/user-avatar.png"} alt="" fill className="object-cover" />
              </div>
              <button className="absolute -bottom-2 -end-2 h-8 w-8 rounded-full bg-[#EC4899] text-white flex items-center justify-center shadow-lg">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0F172A]">{safeStr(user?.name, locale === "ar" ? "ولي الأمر" : "Parent")}</h3>
              <p className="text-sm text-[#64748B]">{user?.email || "parent@example.com"}</p>
              <p className="text-xs text-[#EC4899] font-semibold mt-1">{locale === "ar" ? "ولي أمر" : "Parent"}</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                const res = await api.updateParentProfile({
                  name: nameRef.current?.value,
                  phone: phoneRef.current?.value,
                  relationship: relationshipRef.current?.value,
                  address: addressRef.current?.value,
                })
                if (res.success) {
                  showToast(locale === "ar" ? "تم حفظ التغييرات" : "Changes saved")
                  refreshUser()
                } else {
                  showToast(res.message || (locale === "ar" ? "فشل الحفظ" : "Save failed"), "error")
                }
              } catch {
                showToast(locale === "ar" ? "حدث خطأ" : "Something went wrong", "error")
              } finally {
                setSaving(false)
              }
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                <input
                  ref={nameRef}
                  defaultValue={safeStr(user?.name)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                <input
                  ref={emailRef}
                  type="email"
                  defaultValue={user?.email || ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "رقم الهاتف" : "Phone"}</label>
                <input
                  ref={phoneRef}
                  defaultValue={user?.phone || ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "العلاقة" : "Relationship"}</label>
                <select ref={relationshipRef} defaultValue={(profileData as { parentProfile?: { relationship?: string } })?.parentProfile?.relationship ?? ""} className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]">
                  <option value="">{locale === "ar" ? "اختر" : "Select"}</option>
                  <option value="father">{locale === "ar" ? "أب" : "Father"}</option>
                  <option value="mother">{locale === "ar" ? "أم" : "Mother"}</option>
                  <option value="guardian">{locale === "ar" ? "وصي" : "Guardian"}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{locale === "ar" ? "العنوان" : "Address"}</label>
                <input
                  ref={addressRef}
                  defaultValue={(profileData as { parentProfile?: { address?: string } })?.parentProfile?.address ?? ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899]"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={saving} className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-xl gap-2">
                <Save className="w-4 h-4" />
                {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ التغييرات" : "Save Changes")}
              </Button>
            </div>
          </form>
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
                    setting.enabled ? "bg-[#EC4899]" : "bg-[#E2E8F0]"
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
            <Button className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-xl gap-2">
              <Save className="w-4 h-4" />
              {locale === "ar" ? "حفظ التفضيلات" : "Save Preferences"}
            </Button>
          </div>
        </m.div>
      )}
    </div>
  )
}
