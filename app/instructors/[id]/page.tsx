"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { m } from "framer-motion"
import {
  Star,
  Users,
  BookOpen,
  Award,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Loader2,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { api } from "@/hooks/use-api"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"

import { resolveImageUrl } from "@/lib/utils"

interface InstructorCourse {
  id: string
  title: string
  titleAr?: string
  slug: string
  thumbnail?: string
  price: number
  discountPrice?: number
  currency?: string
  level?: string
  category?: string
  totalStudents: number
  averageRating: number
  totalReviews: number
  chaptersCount: number
  enrollmentsCount: number
}

interface Instructor {
  id: string
  name: string
  avatar?: string
  bio?: string
  role: string
  city?: string
  country?: string
  createdAt: string
  specialty?: string
  website?: string
  twitter?: string
  totalStudents: number
  totalCourses: number
  averageRating: number
  verified: boolean
  courses: InstructorCourse[]
}

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

export default function InstructorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useI18n()
  const { formatCurrency } = usePlatformCurrency()
  const isAr = locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)
  const [instructorsEnabled, setInstructorsEnabled] = useState(true)

  useEffect(() => {
    api.getInstructorsStatus().then((r) => {
      if (r.success && r.data) setInstructorsEnabled(r.data.enabled === true)
    }).catch(() => {})
  }, [])
  useEffect(() => {
    if (!instructorsEnabled) router.replace("/")
  }, [instructorsEnabled, router])

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    api.request(`/courses/instructors/${params.id}`)
      .then((res) => { if (res.success && res.data) setInstructor(res.data as Instructor) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
            <p className="text-sm text-white/50">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      </>
    )
  }

  if (!instructor) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <GraduationCap className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white">{isAr ? "المدرب غير موجود" : "Instructor not found"}</h1>
            <Link href="/courses">
              <Button className="mt-4 rounded-xl bg-white text-black hover:bg-white/90">{isAr ? "تصفح الدورات" : "Browse Courses"}</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const joinDate = new Date(instructor.createdAt)
  const joinYear = joinDate.getFullYear()
  const joinMonth = joinDate.toLocaleString(isAr ? "ar" : "en", { month: "long" })
  const avatarUrl = resolveImageUrl(instructor.avatar)

  const stats = [
    { icon: BookOpen, value: instructor.totalCourses, label: isAr ? "دورة" : "Courses" },
    { icon: Users, value: (instructor.totalStudents ?? 0).toLocaleString(), label: isAr ? "طالب" : "Students" },
    { icon: Star, value: instructor.averageRating > 0 ? instructor.averageRating.toFixed(1) : "—", label: isAr ? "التقييم" : "Rating" },
    { icon: Award, value: instructor.courses.length, label: isAr ? "دورة منشورة" : "Published" },
  ]

  return (
    <>
      <Navbar />
      <div dir={dir} className="min-h-screen bg-black">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />
          <div className="absolute inset-0">
            <div className="absolute -top-32 start-[-10%] h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[120px]" />
            <div className="absolute bottom-0 end-[-5%] h-[400px] w-[400px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 relative z-10">
            <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden ring-4 ring-white/10 shadow-2xl shadow-black/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={instructor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-5xl sm:text-6xl font-bold text-white">{instructor.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {instructor.verified && (
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                    className="absolute -bottom-2 -end-2 flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-black" />
                  </m.div>
                )}
              </div>

              {/* Name & Badge */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{instructor.name}</h1>
                {instructor.verified && (
                  <Badge className="bg-white/10 text-white hover:bg-white/10 border border-white/20 text-xs">
                    {isAr ? "موثق" : "Verified"}
                  </Badge>
                )}
              </div>

              {instructor.specialty && (
                <p className="text-lg text-white/70 font-medium mb-4">{instructor.specialty}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/50 mb-5">
                {(instructor.city || instructor.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-white/40" />
                    {[instructor.city, instructor.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/40" />
                  {isAr ? `انضم في ${joinMonth} ${joinYear}` : `Joined ${joinMonth} ${joinYear}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-white/40" />
                  {instructor.role === "TEACHER" ? (isAr ? "معلم" : "Teacher") : (isAr ? "مدرب" : "Instructor")}
                </span>
              </div>

              {instructor.bio && (
                <p className="text-sm text-white/60 leading-relaxed max-w-2xl mb-6">{instructor.bio}</p>
              )}

              {/* Social */}
              <div className="flex items-center gap-3">
                {instructor.website && (
                  <a href={instructor.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl border-white/20 text-white hover:bg-white/10 gap-1.5 backdrop-blur-sm">
                      <Globe className="w-4 h-4" />
                      {isAr ? "الموقع" : "Website"}
                    </Button>
                  </a>
                )}
                {instructor.twitter && (
                  <a href={`https://twitter.com/${instructor.twitter}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl border-white/20 text-white hover:bg-white/10 gap-1.5 backdrop-blur-sm">
                      <ExternalLink className="w-4 h-4" /> @{instructor.twitter}
                    </Button>
                  </a>
                )}
              </div>
            </m.div>

            {/* Stats */}
            <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <m.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5 font-medium">{stat.label}</p>
                </m.div>
              ))}
            </m.div>
          </div>
        </div>

        {/* Courses */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24 sm:pb-14">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {isAr ? `دورات ${instructor.name}` : `${instructor.name}'s Courses`}
                </h2>
                <p className="text-xs text-white/50">
                  {instructor.courses.length} {isAr ? "دورات متاحة" : "courses available"}
                </p>
              </div>
            </div>

            {instructor.courses.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/5">
                <BookOpen className="w-14 h-14 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">{isAr ? "لا توجد دورات منشورة حالياً" : "No published courses yet"}</p>
              </div>
            ) : (
              <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructor.courses.map((course) => {
                  const title = isAr && course.titleAr ? course.titleAr : course.title
                  const thumbUrl = resolveImageUrl(course.thumbnail)
                  const hasDiscount = course.discountPrice != null && course.discountPrice < course.price
                  return (
                    <m.div key={course.id} variants={fadeUp}>
                      <Link href={`/courses/${course.slug || course.id}`}>
                        <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/15 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-300">
                          <div className="relative aspect-video overflow-hidden bg-black/50">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-white/5">
                                <BookOpen className="w-10 h-10 text-white/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Play className="w-5 h-5 text-black ms-0.5" fill="currentColor" />
                              </div>
                            </div>
                            {course.level && (
                              <div className="absolute top-3 start-3">
                                <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                  {course.level === "beginner" ? (isAr ? "مبتدئ" : "Beginner") :
                                   course.level === "intermediate" ? (isAr ? "متوسط" : "Intermediate") :
                                   course.level === "advanced" ? (isAr ? "متقدم" : "Advanced") : course.level}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            {course.category && (
                              <span className="text-[10px] font-semibold text-white/70 bg-white/10 px-2.5 py-0.5 rounded-md">
                                {course.category}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-white line-clamp-2 mt-2.5 mb-3 group-hover:text-white transition-colors leading-snug">
                              {title}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {course.totalStudents ?? course.enrollmentsCount ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" /> {course.chaptersCount ?? 0} {isAr ? "فصل" : "ch."}
                              </span>
                              {course.averageRating > 0 && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-3.5 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-extrabold text-white">
                                  {(hasDiscount ? course.discountPrice! : course.price) === 0
                                    ? (isAr ? "مجاني" : "Free")
                                    : formatCurrency(hasDiscount ? course.discountPrice! : course.price)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs text-white/40 line-through">{formatCurrency(course.price)}</span>
                                )}
                              </div>
                              <span className="text-xs text-white font-semibold group-hover:translate-x-1 transition-transform">
                                {isAr ? "عرض الدورة ←" : "View →"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </m.div>
                  )
                })}
              </m.div>
            )}
          </m.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
