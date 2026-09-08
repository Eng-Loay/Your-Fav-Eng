# DemoLMS Static Data Audit Report

**Generated:** March 9, 2026

**Status:** ✅ Phase 1–4 completed. Phases 5–12 require manual runtime testing (seed DB, run app, login with roles).

---

## STATIC DATA REPORT

### Files Using `@/lib/data` (Static Data)

| File Path | Component | Static Data Source | Data Type | Fix Required |
|-----------|-----------|-------------------|-----------|--------------|
| `app/courses/page.tsx` | CoursesPage | coursesData | courses | Replace fallback with API-only; add loading/empty states |
| `app/cart/page.tsx` | CartPage | coursesData | courses | Remove fallback; use API courses only for cart item lookup |
| `app/checkout/page.tsx` | CheckoutPage | coursesData | courses | Replace with cart API data |
| `app/courses/[id]/page.tsx` | SingleCoursePage | coursesData, courseCurriculum | courses, curriculum | Use API; curriculum from getCourseCurriculum |
| `app/learning/[id]/page.tsx` | LearningPage | coursesData, courseCurriculum, lessonQuizzes | courses, curriculum, quizzes | Use API; quizzes from getLessonQuiz |
| `app/dashboard/page.tsx` | DashboardPage | coursesData | courses | Replace with getEnrolledCourses |
| `app/dashboard/wishlist/page.tsx` | WishlistPage | coursesData | courses | Replace with getWishlist |
| `app/dashboard/certificates/page.tsx` | CertificatesPage | coursesData | certificates | Replace with getMyCertificates |
| `app/dashboard/courses/page.tsx` | DashboardCoursesPage | coursesData | courses | Replace with getEnrolledCourses |
| `app/dashboard/billing/page.tsx` | BillingPage | coursesData | billing | Replace with getBillingSummary |
| `components/courses/courses-section.tsx` | CoursesSection | coursesData | courses | Replace with api.getFeaturedCourses() or api.getCourses() |
| `components/instructors/instructors-section.tsx` | InstructorsSection | instructorsData | instructors | Add GET /api/instructors/featured; use API |
| `components/testimonials/testimonials-section.tsx` | TestimonialsSection | testimonialsData | testimonials | Add GET /api/reviews/featured; use API |
| `components/learning/lesson-quiz.tsx` | LessonQuiz | types only (QuizQuestion, QuizOption) | types | Keep type import; quiz data from API |

### Files Using Mock/Fallback Data (In-File)

| File Path | Static Data | Fix Required |
|-----------|-------------|--------------|
| `app/admin/courses/page.tsx` | mockCoursesFallback | Remove; show empty state when API returns no data |
| `app/admin/users/page.tsx` | mockUsersFallback | Remove; show empty state when API returns no data |
| `app/admin/exams/page.tsx` | mockExams, mockResults | Replace with api.getAdminExams(), api.getAdminExamResults() |
| `app/courses/[id]/page.tsx` | MOCK_REVIEWS | Replace with api.getCourseReviews() |

### Backend APIs Required

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/courses | ✅ Exists | |
| GET /api/courses/featured | ✅ Exists | |
| GET /api/courses/:id | ✅ Exists | |
| GET /api/courses/:id/curriculum | ✅ Exists | |
| GET /api/reviews/course/:courseId | ✅ Exists | |
| GET /api/admin/courses | ✅ Exists | |
| GET /api/admin/users | ✅ Exists | |
| GET /api/admin/exams | ✅ Exists | |
| GET /api/admin/exams/results | ✅ Exists | |
| GET /api/instructors/featured | ❌ Missing | Add public endpoint |
| GET /api/reviews/featured | ❌ Missing | Add for testimonials |

---

## Summary

- **14 files** import from `lib/data.ts`
- **4 files** use in-file mock data
- **2 backend endpoints** need to be added for instructors and featured testimonials
- **lib/data.ts** to remain only for: type exports (QuizQuestion, QuizOption, QuizQuestionType, etc.) and optional dev fallback

---

## CHANGES APPLIED (Phase 3 & 4)

### Backend
1. **GET /api/reviews/featured** – Added `reviewsController.getFeatured` and `reviewsService.getFeatured`
2. **GET /api/courses/instructors/featured** – Added `coursesController.getFeaturedInstructors` and `coursesService.getFeaturedInstructors`
3. `lib/api.ts` – Added `getFeaturedReviews()` and `getFeaturedInstructors()`

### Frontend
1. **components/courses/courses-section.tsx** – Uses `api.getFeaturedCourses()` instead of `coursesData`
2. **components/instructors/instructors-section.tsx** – Uses `api.getFeaturedInstructors()` instead of `instructorsData`
3. **components/testimonials/testimonials-section.tsx** – Uses `api.getFeaturedReviews()` instead of `testimonialsData`
4. **app/courses/page.tsx** – Removed `coursesData` fallback; uses API only with loading/empty states
5. **app/cart/page.tsx** – Removed `coursesData`; uses API courses only
6. **app/checkout/page.tsx** – Uses `api.getCart()` instead of static courses
7. **app/courses/[id]/page.tsx** – Removed `coursesData`, `courseCurriculum`, `MOCK_REVIEWS`; uses API
8. **app/dashboard/page.tsx** – Uses `api.getEnrolledCourses()` instead of `coursesData`
9. **app/dashboard/wishlist/page.tsx** – Uses `api.getWishlist()` instead of `coursesData`
10. **app/dashboard/certificates/page.tsx** – Removed `coursesData`, `FALLBACK_CERTIFICATES`; uses API only
11. **app/dashboard/courses/page.tsx** – Uses `api.getEnrolledCourses()` only (removed `coursesData` fallback)
12. **app/dashboard/billing/page.tsx** – Removed `coursesData`, `FALLBACK_*`; uses API only
13. **app/learning/[id]/page.tsx** – Uses `api.getCourse()`, `api.getCourseCurriculum()`, `api.getLessonQuiz()`; removed static imports
14. **app/admin/courses/page.tsx** – Removed `mockCoursesFallback`; empty state when API returns []
15. **app/admin/users/page.tsx** – Removed `mockUsersFallback`; empty state when API returns []
16. **app/admin/exams/page.tsx** – Uses `api.getAdminExams()` and `api.getAdminExamResults()`; removed mock data

### Remaining `lib/data` usage
- **components/learning/lesson-quiz.tsx** – Imports **types only** (QuizQuestion, QuizOption, QuizQuestionType); no static data
