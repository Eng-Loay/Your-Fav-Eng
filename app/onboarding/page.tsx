"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  User,
  FileText,
  Briefcase,
  Globe,
  Twitter,
  ArrowRight,
  ArrowLeft,
  School,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { api } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const router = useRouter()
  const { locale, dir } = useI18n()
  const { user, isLoggedIn, hydrated, refreshUser } = useStore()
  const isRTL = dir === "rtl"
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const [bio, setBio] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [experience, setExperience] = useState("")
  const [website, setWebsite] = useState("")
  const [twitter, setTwitter] = useState("")
  const [avatar, setAvatar] = useState("")

  const isTeacher = user?.role === "teacher"
  const isEligible = isTeacher

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn || !user) {
      router.replace("/login?redirect=/onboarding")
      return
    }
    if (!isEligible) {
      router.replace("/")
      return
    }
    setBio(user.bio || "")
    setAvatar(user.avatar || "")
  }, [hydrated, isLoggedIn, user, isEligible, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const profileData: Record<string, string> = {
        specialty: specialty.trim() || undefined,
        experience: experience.trim() || undefined,
        website: website.trim() || undefined,
        twitter: twitter.trim() || undefined,
      }
      if (isTeacher) {
        (profileData as any).subject = specialty.trim() || undefined
      }

      await api.updateProfile({ bio: bio.trim() || undefined, avatar: avatar.trim() || undefined })
      await api.updateTeacherProfile(profileData)
      await refreshUser?.()
      setDone(true)
      setTimeout(() => {
        router.push("/teacher-dashboard")
      }, 1500)
    } catch (err) {
      setError(locale === "ar" ? "فشل في حفظ البيانات" : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || !isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="w-8 h-8 animate-spin text-[#f65404]" />
      </div>
    )
  }

  if (!isEligible) {
    return null
  }

  const Icon = School

  return (
    <div dir={dir} className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1d2856]/30">
              <Icon className="h-6 w-6 text-[#f65404]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {locale === "ar" ? "أكمل بياناتك" : "Complete Your Profile"}
              </h1>
              <p className="text-sm text-white/50">
                {locale === "ar"
                  ? "أضف معلوماتك المهنية لتسريع المراجعة"
                  : "Add your professional info to speed up review"}
              </p>
            </div>
          </div>

          {done ? (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {locale === "ar" ? "بياناتك قيد المراجعة" : "Your Data is Under Review"}
              </h2>
              <p className="text-sm text-white/50">
                {locale === "ar"
                  ? "سيتم إشعارك فور اعتماد حسابك."
                  : "You'll be notified once your account is approved."}
              </p>
              <Loader2 className="w-8 h-8 animate-spin text-[#f65404] mx-auto mt-6" />
            </m.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {locale === "ar" ? "نبذة عنك" : "About You"}
                </Label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب نبذة مختصرة عنك وخبراتك..." : "Write a short bio about yourself..."}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f65404]/50"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {locale === "ar" ? "التخصص" : "Specialty"}
                </Label>
                <Input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={locale === "ar" ? "مثال: البرمجة، الرياضيات..." : "e.g. Programming, Math..."}
                  className="mt-1 h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {locale === "ar" ? "الخبرات" : "Experience"}
                </Label>
                <Input
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder={locale === "ar" ? "مثال: ١٠ سنوات في التدريس..." : "e.g. 10 years in teaching..."}
                  className="mt-1 h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {locale === "ar" ? "رابط الموقع" : "Website URL"}
                </Label>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  {locale === "ar" ? "تويتر / X" : "Twitter / X"}
                </Label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="mt-1 h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {locale === "ar" ? "رابط الصورة الشخصية" : "Profile Picture URL"}
                </Label>
                <Input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  dir="ltr"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-gradient-to-r from-[#1d2856] to-[#f65404] text-white font-semibold mt-4"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {locale === "ar" ? "حفظ والمتابعة" : "Save & Continue"}
                    {isRTL ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 me-2" />}
                  </>
                )}
              </Button>
            </form>
          )}

          {!done && (
            <p className="mt-4 text-center text-sm text-white/40">
              {locale === "ar" ? "يمكنك تخطي هذا الآن" : "You can skip this for now"}{" "}
              <Link
                href="/teacher-dashboard"
                className="text-[#f65404] hover:underline"
              >
                {locale === "ar" ? "الذهاب للوحة التحكم" : "Go to dashboard"}
              </Link>
            </p>
          )}
        </div>
      </m.div>
    </div>
  )
}
