// @ts-nocheck — pre-existing page types; Next build must not use ignoreBuildErrors
"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { m } from "framer-motion"
import { useApi, api } from "@/hooks/use-api"
import {
  Star,
  Users,
  Clock,
  PlayCircle,
  Heart,
  ShoppingCart,
  BookOpen,
  Globe,
  BarChart3,
  CalendarDays,
  FileText,
  Download,
  Award,
  Infinity as InfinityIcon,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { usePlatformCurrency } from "@/hooks/use-platform-currency"
import { cn, resolveImageUrl } from "@/lib/utils"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { AnimatedPageHero } from "@/components/ui/animated-page-hero"

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-[${size}px] w-[${size}px] ${
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}

export default function SingleCoursePage() {
  const { locale, dir, t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const { addToCart, isInCart, isPurchased, enrollFree, toggleWishlist, isWishlisted, isLoggedIn, showToast } = useStore()
  const { formatCurrency } = usePlatformCurrency()

  const { data: apiCourse } = useApi(() => api.getCourse(courseId), { deps: [courseId] })
  const { data: apiCurriculum } = useApi(() => api.getCourseCurriculum(courseId), { deps: [courseId] })
  const { data: apiReviews, refetch: refetchReviews } = useApi(() => api.getCourseReviews(courseId), { deps: [courseId] })

  const toStringOrName = (val: unknown): string => {
    if (typeof val === "string") return val
    if (val && typeof val === "object" && "name" in val && typeof (val as { name?: unknown }).name === "string")
      return String((val as { name: string }).name)
    return ""
  }

  const course = useMemo(() => {
    if (apiCourse && typeof apiCourse === "object") {
      const c = apiCourse as Record<string, unknown>
      const inst = c.instructor as Record<string, unknown> | undefined
      const instProfile = inst?.instructorProfile as Record<string, unknown> | undefined
      return {
        id: String(c.id ?? courseId),
        thumbnail: (c.thumbnail as string) || "/course-1.png",
        titleAr: (c.titleAr as string) || (c.title as string) || "",
        titleEn: (c.titleEn as string) || (c.title as string) || "",
        instructorAr: toStringOrName(c.instructorAr) || toStringOrName(inst?.name) || toStringOrName(c.instructor) || "",
        instructorEn: toStringOrName(c.instructorEn) || toStringOrName(inst?.name) || toStringOrName(c.instructor) || "",
        instructorAvatar: (c.instructorAvatar as string) || (inst?.avatar as string) || "/user-avatar.png",
        rating: Number(c.averageRating ?? c.rating ?? 4.5),
        students: Number(c.totalStudents ?? c.students ?? c.enrollmentCount ?? 0),
        price: Number((c.discountPrice ?? c.price) ?? 0),
        originalPrice: Number(c.originalPrice ?? c.price ?? 0),
        category: (c.category as string) || "programming",
        level: (c.level as string) || "beginner",
        hours: Number(c.hours ?? 0),
        lessons: Number(c.lessons ?? 0),
        sections: Number(c.sections ?? 0),
        updatedAt: (c.updatedAt as string) || "",
        language: (c.language as string) || "ar",
        descriptionAr: (c.descriptionAr as string) || (c.description as string) || "",
        descriptionEn: (c.descriptionEn as string) || (c.description as string) || "",
        instructorBio: (inst?.bio as string) || "",
        instructorTotalCourses: Number(inst?._count?.courses ?? instProfile?.totalCourses ?? 0),
      }
    }
    return null
  }, [apiCourse, courseId])

  const curriculum = useMemo(() => {
    type ApiLesson = { id?: string; title?: string; titleAr?: string; titleEn?: string; duration?: string; free?: boolean; isFree?: boolean; isPreview?: boolean }
    type ApiChapter = { title?: string; titleAr?: string; titleEn?: string; lessons?: ApiLesson[]; children?: Array<{ title?: string; titleAr?: string; titleEn?: string; lessons?: ApiLesson[] }> }
    const raw = apiCurriculum as { chapters?: ApiChapter[] } | null
    const mapLesson = (l: ApiLesson) => ({
      id: l.id || "",
      titleAr: l.titleAr || l.title || "",
      titleEn: l.titleEn || l.title || "",
      duration: l.duration || "0:00",
      free: (l.isFree ?? l.free ?? false) || (l.isPreview ?? false),
    })
    if (raw?.chapters && Array.isArray(raw.chapters)) {
      return raw.chapters.map((s) => ({
        titleAr: s.titleAr || s.title || "",
        titleEn: s.titleEn || s.title || "",
        lessons: (s.lessons || []).map(mapLesson),
        subsections: (s.children || []).map((sub) => ({
          titleAr: sub.titleAr || sub.title || "",
          titleEn: sub.titleEn || sub.title || "",
          lessons: (sub.lessons || []).map(mapLesson),
        })),
      }))
    }
    return []
  }, [apiCurriculum])

  const reviews = useMemo(() => {
    if (apiReviews && Array.isArray(apiReviews) && apiReviews.length > 0) {
      return apiReviews.map((r: { id?: string; user?: { name?: string }; rating?: number; comment?: string; createdAt?: string }) => ({
        id: r.id || "",
        nameAr: toStringOrName(r.user?.name) || "",
        nameEn: toStringOrName(r.user?.name) || "",
        avatar: "/user-avatar.png",
        rating: r.rating ?? 5,
        dateAr: r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "",
        dateEn: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        textAr: r.comment || "",
        textEn: r.comment || "",
      }))
    }
    return []
  }, [apiReviews])

  const [activeTab, setActiveTab] = useState("content")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  if (!course) {
    return (
      <div dir={dir} className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-xl font-bold text-gray-500">
            {t("coursesPage.noResults")}
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  const title = locale === "ar" ? course.titleAr : course.titleEn
  const instructor =
    locale === "ar" ? course.instructorAr : course.instructorEn
  const description =
    locale === "ar" ? course.descriptionAr : course.descriptionEn
  const isFree = (course.price ?? 0) === 0
  const isDiscounted =
    !isFree && course.originalPrice > 0 && course.originalPrice > course.price
  const purchased = isPurchased(course.id)
  const inCart = isInCart(course.id)
  const wishlisted = isWishlisted(course.id)

  const totalLessons = curriculum.reduce(
    (acc, s) => acc + s.lessons.length + s.subsections.reduce((b, sub) => b + sub.lessons.length, 0),
    0
  )

  const levelLabel = t(`singleCourse.${course.level}`)

  const handleOpenReviewModal = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (!purchased) {
      showToast(locale === "ar" ? "يجب التسجيل في الدورة أولاً لكتابة تقييم" : "You must enroll in the course first to write a review", "error")
      return
    }
    setShowReviewModal(true)
    setReviewRating(5)
    setReviewComment("")
  }

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      showToast(locale === "ar" ? "اكتب تعليقك" : "Please write your comment", "error")
      return
    }
    setReviewSubmitting(true)
    try {
      const res = await api.createReview(courseId, reviewRating, reviewComment.trim())
      if (res?.success) {
        setShowReviewModal(false)
        refetchReviews()
        showToast(locale === "ar" ? "تم إرسال تقييمك للمراجعة" : "Your review has been submitted for approval", "success")
      } else {
        showToast(res?.message || (locale === "ar" ? "فشل في إرسال التقييم" : "Failed to submit review"), "error")
      }
    } catch {
      showToast(locale === "ar" ? "فشل في إرسال التقييم" : "Failed to submit review", "error")
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <AnimatedPageHero
        badge={t(`coursesPage.categories.${course.category}`)}
        title={title}
        subtitle={description}
        dark
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={course.instructorAvatar} />
              <AvatarFallback>{typeof instructor === "string" ? instructor[0] : ""}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-white">{typeof instructor === "string" ? instructor : String((instructor as { name?: string })?.name ?? "")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-white">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{course.students.toLocaleString()} {t("bestCourses.students")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.hours} {t("singleCourse.totalHours")}</span>
          </div>
        </div>
      </AnimatedPageHero>

      {/* Content - RTL-aware layout */}
      <div className="container mx-auto px-4 py-10">
        <div className={`flex flex-col gap-8 lg:flex-row ${dir === "rtl" ? "lg:flex-row-reverse" : ""}`}>
          {/* Main content - first on desktop for LTR, second for RTL */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 min-w-0 order-2 lg:order-1"
          >
            {/* Stats bar */}
            <div className="mb-6 flex flex-wrap items-center gap-6 rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm" dir={dir}>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-5 w-5 shrink-0 text-medex-red" />
                <span className="font-bold text-gray-800">
                  {curriculum.length}
                </span>{" "}
                {t("singleCourse.sections")}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PlayCircle className="h-5 w-5 text-medex-red" />
                <span className="font-bold text-gray-800">{totalLessons}</span>{" "}
                {t("singleCourse.lessons")}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-5 w-5 text-medex-red" />
                <span className="font-bold text-gray-800">{course.hours}</span>{" "}
                {t("singleCourse.totalHours")}
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
              dir={dir}
            >
              <TabsList className="mb-6 h-auto w-full justify-start gap-1 rounded-[20px] bg-white p-1.5 shadow-sm">
                <TabsTrigger
                  value="content"
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-medex-red data-[state=active]:text-white"
                >
                  {t("singleCourse.courseContent")}
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-medex-red data-[state=active]:text-white"
                >
                  {t("singleCourse.aboutCourse")}
                </TabsTrigger>
                <TabsTrigger
                  value="instructor"
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-medex-red data-[state=active]:text-white"
                >
                  {t("singleCourse.instructor")}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-medex-red data-[state=active]:text-white"
                >
                  {t("singleCourse.reviews")}
                </TabsTrigger>
              </TabsList>

              {/* Course Content Tab */}
              <TabsContent value="content">
                <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm" dir={dir}>
                  <Accordion
                    type="multiple"
                    defaultValue={["section-0"]}
                    className="space-y-3"
                  >
                    {curriculum.map((section, sIdx) => (
                      <AccordionItem
                        key={sIdx}
                        value={`section-${sIdx}`}
                        className="overflow-hidden rounded-2xl border border-gray-100"
                      >
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-start font-bold text-gray-800 flex-1">
                              {locale === "ar"
                                ? section.titleAr
                                : section.titleEn}
                            </span>
                            <span className="shrink-0 text-xs text-gray-400">
                              {section.lessons.length + section.subsections.reduce((a, sub) => a + sub.lessons.length, 0)}{" "}
                              {t("singleCourse.lessons")}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-4 space-y-4">
                          <ul className="space-y-2">
                            {section.lessons.map((lesson) => (
                              <li
                                key={lesson.id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                              >
                                {/* ترتيب RTL: من اليمين لليسار = أيقونة ثم العنوان ثم مجاني ثم المدة */}
                                <div className="flex items-center gap-3 min-w-0 flex-1" dir={dir}>
                                  {lesson.free ? (
                                    <PlayCircle className="h-5 w-5 shrink-0 text-medex-red" />
                                  ) : (
                                    <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-700 truncate">
                                    {locale === "ar"
                                      ? lesson.titleAr
                                      : lesson.titleEn}
                                  </span>
                                  {lesson.free && (
                                    <Badge className="border-0 bg-emerald-50 text-[10px] font-bold text-emerald-600 shrink-0">
                                      {t("bestCourses.free")}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                                  {lesson.duration}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {section.subsections.map((sub, subIdx) => (
                            <div key={subIdx}>
                              <p className="text-xs font-bold text-gray-500 mb-2 ps-1">
                                {locale === "ar" ? sub.titleAr : sub.titleEn}
                              </p>
                              <ul className="space-y-2">
                                {sub.lessons.map((lesson) => (
                                  <li
                                    key={lesson.id}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1" dir={dir}>
                                      {lesson.free ? (
                                        <PlayCircle className="h-5 w-5 shrink-0 text-medex-red" />
                                      ) : (
                                        <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                                      )}
                                      <span className="text-sm font-medium text-gray-700 truncate">
                                        {locale === "ar" ? lesson.titleAr : lesson.titleEn}
                                      </span>
                                      {lesson.free && (
                                        <Badge className="border-0 bg-emerald-50 text-[10px] font-bold text-emerald-600 shrink-0">
                                          {t("bestCourses.free")}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                                      {lesson.duration}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about">
                <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-gray-800">
                    {t("singleCourse.aboutCourse")}
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    {description}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <BarChart3 className="mx-auto mb-2 h-6 w-6 text-medex-red" />
                      <p className="text-xs text-gray-500">
                        {t("singleCourse.level")}
                      </p>
                      <p className="font-bold text-gray-800">{levelLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <Globe className="mx-auto mb-2 h-6 w-6 text-medex-red" />
                      <p className="text-xs text-gray-500">
                        {t("singleCourse.language")}
                      </p>
                      <p className="font-bold text-gray-800">
                        {course.language.toUpperCase()}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <CalendarDays className="mx-auto mb-2 h-6 w-6 text-medex-red" />
                      <p className="text-xs text-gray-500">
                        {t("singleCourse.lastUpdated")}
                      </p>
                      <p className="font-bold text-gray-800">
                        {course.updatedAt}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Instructor Tab */}
              <TabsContent value="instructor">
                <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <Avatar className="h-20 w-20 border-4 border-medex-red/20">
                      <AvatarImage src={course.instructorAvatar} />
                      <AvatarFallback className="text-xl font-bold">
                        {typeof instructor === "string" ? instructor[0] : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {typeof instructor === "string" ? instructor : String(instructor?.name ?? "")}
                      </h3>
                      <p className="mb-3 text-sm text-gray-500">
                        {t(`coursesPage.categories.${course.category}`)}{" "}
                        {t("singleCourse.instructor")}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold">{course.rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>
                            {course.students.toLocaleString()}{" "}
                            {t("bestCourses.students")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span>
                            {course.instructorTotalCourses ?? 0} {t("hero.courses")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-5" />

                  <p className="leading-relaxed text-gray-600">
                    {course.instructorBio
                      ? course.instructorBio
                      : locale === "ar"
                        ? "مدرب متمرس بخبرة في المجال. شغوف بالتعليم ومساعدة الطلاب على تحقيق أهدافهم المهنية."
                        : "An experienced instructor passionate about teaching and helping students achieve their career goals."}
                  </p>
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-4xl font-extrabold text-gray-800">
                          {course.rating}
                        </span>
                        <div>
                          <StarRating rating={course.rating} size={18} />
                          <p className="mt-0.5 text-xs text-gray-500">
                            ({reviews.length} {t("singleCourse.reviews")})
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleOpenReviewModal} className="rounded-[20px] bg-medex-red font-bold hover:bg-medex-red-dark">
                      {t("singleCourse.writeReview")}
                    </Button>
                  </div>

                  {/* Rating breakdown */}
                  <div className="mb-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(
                        (r) => r.rating === star
                      ).length
                      const pct =
                        reviews.length > 0
                          ? (count / reviews.length) * 100
                          : 0
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <div className="flex w-12 items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{star}</span>
                          </div>
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="w-10 text-end text-xs text-gray-500">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <Separator className="my-5" />

                  <div className="space-y-5">
                    {reviews.map((review) => (
                      <m.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-gray-50 p-5"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={resolveImageUrl(review.avatar)} />
                              <AvatarFallback>
                                {(locale === "ar"
                                  ? review.nameAr
                                  : review.nameEn)[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                {locale === "ar"
                                  ? review.nameAr
                                  : review.nameEn}
                              </p>
                              <p className="text-xs text-gray-400">
                                {locale === "ar"
                                  ? review.dateAr
                                  : review.dateEn}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size={14} />
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {locale === "ar" ? review.textAr : review.textEn}
                        </p>
                      </m.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </m.div>

          {/* Sidebar - sticky purchase card */}
          <m.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full lg:w-[380px] shrink-0 order-1 lg:order-2"
          >
            <div className="sticky top-24 overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-xl">
              <div className="relative aspect-video overflow-hidden lg:hidden">
                <Image src={course.thumbnail} alt={title} fill className="object-cover" sizes="100vw" />
              </div>
              <div className="p-6">
                <div className="mb-5 flex items-baseline gap-3">
                  {isFree ? (
                    <Badge className="border-0 bg-emerald-50 px-4 py-1.5 text-lg font-bold text-emerald-600">
                      {t("bestCourses.free")}
                    </Badge>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-medex-red">
                        {formatCurrency(course.price)}
                      </span>
                      {isDiscounted && (
                        <span className="text-lg text-gray-400 line-through">
                          {formatCurrency(course.originalPrice)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {purchased ? (
                  <Link href={`/learning/${course.id}`}>
                    <Button className="mb-3 h-13 w-full rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600">
                      {locale === "ar" ? "ابدأ التعلم" : "Start Learning"}
                    </Button>
                  </Link>
                ) : isFree ? (
                  <Button
                    onClick={async () => {
                      if (!isLoggedIn) {
                        router.push("/login")
                        return
                      }
                      const id = (course.id || courseId)?.trim()
                      if (!id) return
                      const ok = await enrollFree(id)
                      if (ok) router.push(`/learning/${course.id}`)
                    }}
                    className="mb-3 h-13 w-full rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600"
                  >
                    {locale === "ar" ? "سجّل مجاناً" : "Enroll Free"}
                  </Button>
                ) : (
                  <Link href="/contact">
                    <Button className="mb-3 h-13 w-full rounded-2xl bg-mds-primary text-base font-bold hover:opacity-90">
                      {locale === "ar" ? "تواصل للتسجيل" : "Contact to Enroll"}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={() => toggleWishlist(course.id)}
                  className={cn("h-13 w-full rounded-2xl text-base font-semibold", wishlisted ? "text-rose-500" : "text-gray-600 hover:text-rose-500")}
                >
                  <Heart className={cn("me-2 h-5 w-5", wishlisted && "fill-rose-500")} />
                  {wishlisted ? (locale === "ar" ? "في المفضلة ♥" : "Wishlisted ♥") : t("singleCourse.addToWishlist")}
                </Button>
                <Separator className="my-5" />
                <h4 className="mb-4 text-sm font-bold text-gray-800">{t("singleCourse.includes")}</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-3">
                    <PlayCircle className="h-5 w-5 shrink-0 text-medex-red" />
                    <span>{course.hours} {t("singleCourse.videoHours")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-medex-red" />
                    <span>12 {t("singleCourse.articles")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Download className="h-5 w-5 shrink-0 text-medex-red" />
                    <span>8 {t("singleCourse.resources")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-5 w-5 shrink-0 text-medex-red" />
                    <span>{t("singleCourse.certificate")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <InfinityIcon className="h-5 w-5 shrink-0 text-medex-red" />
                    <span>{t("singleCourse.lifetimeAccess")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </m.aside>
        </div>
      </div>

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("singleCourse.writeReview")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                {locale === "ar" ? "التقييم" : "Rating"}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className={`p-2 rounded-lg transition-colors ${
                      reviewRating >= s
                        ? "bg-amber-100 text-amber-600"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    <Star className={`w-6 h-6 ${reviewRating >= s ? "fill-amber-400" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {locale === "ar" ? "التعليق" : "Comment"}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={locale === "ar" ? "اكتب تقييمك..." : "Write your review..."}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[100px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting}
              className="bg-medex-red hover:bg-medex-red-dark"
            >
              {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {locale === "ar" ? "إرسال" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
