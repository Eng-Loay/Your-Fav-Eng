/** Get API base URL - production uses same domain /api, dev uses hostname:port */

export function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
    return `http://${host}:5001/api`;
  }
  if (process.env.VERCEL) return '/api';
  return 'http://localhost:5001/api';
}

/** Default fetch timeout — keep low so dead backend fails fast */
const FETCH_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MS = 3000;
const BACKEND_COOLDOWN_MS = 15000;

let backendDownUntil = 0;
let probePromise: Promise<boolean> | null = null;

export function isBackendMarkedDown(): boolean {
  return typeof window !== 'undefined' && Date.now() < backendDownUntil;
}

function markBackendDown() {
  backendDownUntil = Date.now() + BACKEND_COOLDOWN_MS;
}

function markBackendUp() {
  backendDownUntil = 0;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  return false;
}

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  if (typeof window !== 'undefined' && isBackendMarkedDown()) {
    throw new TypeError('Backend unavailable');
  }

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(id);
    markBackendUp();
    return res;
  } catch (error) {
    clearTimeout(id);
    if (isNetworkError(error)) {
      markBackendDown();
    }
    throw error;
  }
}

/** Quick health probe so the UI stops hammering a dead backend */
export async function probeBackend(): Promise<boolean> {
  if (isBackendMarkedDown()) return false;
  if (probePromise) return probePromise;

  probePromise = fetchWithTimeout(`${getApiBase()}/health`, { method: 'GET' }, 2000)
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      probePromise = null;
    });

  return probePromise;
}

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
  timeoutMs?: number;
}

class ApiClient {
  constructor() {}

  private get baseUrl(): string {
    return getApiBase();
  }

  private stripEmptyStrings(input: any): any {
    if (input === null || input === undefined) return input;
    if (Array.isArray(input)) return input.map((v) => this.stripEmptyStrings(v));
    if (typeof input !== 'object') return input;
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed !== '') out[k] = trimmed;
        continue;
      }
      if (v !== undefined) out[k] = this.stripEmptyStrings(v);
    }
    return out;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lms_token');
  }

  /** Recursively replace {id, name} or {id, name, email} objects with name string to avoid React render errors */
  private flattenIdNameObjects(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.flattenIdNameObjects(item));
    const keys = Object.keys(obj);
    const hasIdName = keys.includes('id') && keys.includes('name');
    const isRefLike = hasIdName && (keys.length === 2 || (keys.length === 3 && keys.includes('email')));
    if (isRefLike && typeof obj.name === 'string') {
      return obj.name;
    }
    const result: Record<string, any> = {};
    for (const k of keys) result[k] = this.flattenIdNameObjects(obj[k]);
    return result;
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lms_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lms_token', accessToken);
    localStorage.setItem('lms_refresh_token', refreshToken);
  }

  clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_refresh_token');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> {
    const { method = 'GET', body, headers = {}, isFormData = false, timeoutMs = FETCH_TIMEOUT_MS } = options;

    const token = this.getToken();
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      let res = await fetchWithTimeout(`${this.baseUrl}${endpoint}`, config, timeoutMs);

      if (res.status === 401 && token) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          requestHeaders['Authorization'] = `Bearer ${this.getToken()}`;
          config.headers = requestHeaders;
          res = await fetchWithTimeout(`${this.baseUrl}${endpoint}`, config, timeoutMs);
        }
      }

      const data = await res.json();
      // Flatten {id, name} objects to strings to prevent React "Objects are not valid as React child"
      if (data && typeof data === 'object') {
        return this.flattenIdNameObjects(data);
      }
      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') {
        console.error('API Error:', error);
      }
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  private get(endpoint: string) {
    return this.request(endpoint);
  }
  private post(endpoint: string, body?: any) {
    return this.request(endpoint, { method: 'POST', body });
  }
  private put(endpoint: string, body?: any) {
    return this.request(endpoint, { method: 'PUT', body });
  }
  private delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(identifier: string, password: string) {
    const isPhone = /^[\d+\s()-]{8,20}$/.test(identifier.trim()) && !identifier.includes('@');
    const body: Record<string, string> = { password };
    if (isPhone) body.phone = identifier.trim();
    else body.email = identifier;
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body,
      timeoutMs: AUTH_TIMEOUT_MS,
    });
    if (res.success && res.data) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
    }
    return res;
  }

  async lookupStudent(emailOrPhone: string) {
    const q = encodeURIComponent(emailOrPhone.trim());
    return this.request(`/auth/lookup-student?q=${q}`) as Promise<{ success: boolean; data?: { id: string; name: string; email: string } | null }>;
  }

  async register(name: string, email: string, password: string, role: string, extra?: { phone?: string; childContact?: string }) {
    const body: Record<string, string> = { name, password, role: role.toUpperCase() };
    if (email) body.email = email;
    if (extra?.phone) body.phone = extra.phone;
    if (extra?.childContact) body.childContact = extra.childContact;
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body,
    });
    if (res.success && res.data) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('/auth/me', { method: 'PUT', body: data });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request('/auth/me/avatar', { method: 'POST', body: formData, isFormData: true });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/me/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    }
    this.clearTokens();
  }

  // Courses
  async getCourses(params?: { page?: number; limit?: number; search?: string; category?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    // Public listing: explicitly request only PUBLISHED courses
    query.set('status', 'PUBLISHED');
    if (params?.sort) query.set('sort', params.sort);
    return this.request(`/courses?${query.toString()}`);
  }

  async getFeaturedCourses() {
    return this.request('/courses/featured');
  }

  async getCourse(id: string) {
    return this.request(`/courses/${id}`);
  }

  async deleteCourse(id: string) {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  async getCourseCurriculum(id: string) {
    return this.request(`/courses/${id}/curriculum`);
  }

  async getCourseReviews(courseId: string) {
    return this.request(`/reviews/course/${courseId}`);
  }

  async getFeaturedReviews(limit = 6, homePageOnly = false) {
    const q = new URLSearchParams({ limit: String(limit) });
    if (homePageOnly) q.set('homePageOnly', 'true');
    return this.request(`/reviews/featured?${q.toString()}`);
  }

  async listInstructors(params?: { role?: string; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/courses/instructors?${q.toString()}`);
  }

  async getFeaturedInstructors(limit = 6) {
    return this.request(`/courses/instructors/featured?limit=${limit}`);
  }

  async getInstructorsStatus() {
    return this.request<{ enabled: boolean }>('/settings/instructors-status');
  }

  async getVideoWatermarkStatus() {
    return this.request<{ enabled: boolean }>('/settings/video-watermark-status');
  }

  async getChatStatus() {
    return this.request<{ enabled: boolean }>('/settings/chat-status');
  }

  async createReview(courseId: string, rating: number, comment: string) {
    return this.request(`/reviews/course/${courseId}`, {
      method: 'POST',
      body: { rating, comment },
    });
  }

  // Cart
  async getCart() {
    return this.request('/payments/cart');
  }

  async addToCart(item: { courseId?: string; productId?: string; quantity?: number }) {
    return this.request('/payments/cart', {
      method: 'POST',
      body: item,
    });
  }

  async removeFromCart(id: string) {
    return this.request(`/payments/cart/${id}`, { method: 'DELETE' });
  }

  async applyCoupon(code: string) {
    return this.request('/payments/cart/coupon', {
      method: 'POST',
      body: { code },
    });
  }

  async createPaymentRequest(items: Array<{ courseId?: string; productId?: string }>) {
    return this.request('/payments/payment-request', {
      method: 'POST',
      body: { items },
    });
  }

  async checkoutWithCoupon(code: string, items?: Array<{ courseId?: string; productId?: string; quantity?: number }>) {
    return this.request('/payments/checkout-coupon', {
      method: 'POST',
      body: items && items.length > 0 ? { code, items } : { code },
    });
  }

  async getPaymentMethods() {
    return this.request<{ stripe?: boolean; paypal?: boolean; tap?: boolean; adminApproval?: boolean; coupon?: boolean }>('/settings/payment-methods');
  }

  async getMyOrders(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams()
    if (params?.page != null) q.set('page', String(params.page))
    if (params?.limit != null) q.set('limit', String(params.limit))
    const query = q.toString()
    return this.request(`/payments/my-orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(orderId: string) {
    return this.request(`/payments/orders/${orderId}`);
  }

  async getOrderBySessionId(sessionId: string) {
    return this.request(`/payments/order-by-session?session_id=${encodeURIComponent(sessionId)}`);
  }

  // Checkout
  async createCheckoutSession(items: any[], couponCode?: string, successUrl?: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const mapped = items.map((i) => {
      if (typeof i !== 'object') return i;
      if (i.courseId) return { courseId: i.courseId, quantity: i.quantity ?? 1 };
      if (i.productId) return { productId: i.productId, quantity: i.quantity ?? 1 };
      return i;
    });
    return this.request('/payments/create-checkout-session', {
      method: 'POST',
      body: {
        items: mapped,
        successUrl: successUrl ?? `${base}/checkout/success`,
        cancelUrl: `${base}/checkout`,
        couponCode,
      },
    });
  }

  // Wishlist
  async toggleWishlist(courseId: string) {
    return this.request('/users/wishlist/toggle', {
      method: 'POST',
      body: { courseId },
    });
  }

  async getWishlist() {
    return this.request('/users/wishlist');
  }

  // Student Dashboard
  async getDashboardStats() {
    return this.request('/users/dashboard/stats');
  }

  async getMyGroups() {
    return this.request('/users/me/groups');
  }

  async getEnrolledCourses() {
    return this.request('/users/courses');
  }

  async getCourseProgress(courseId: string) {
    return this.request(`/users/courses/${courseId}/progress`);
  }

  async getBillingSummary() {
    return this.request('/users/billing/summary');
  }

  async getBillingTransactions(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (!params?.limit) q.set('limit', '100');
    return this.request(`/users/billing/transactions?${q.toString()}`);
  }

  // Learning
  async completeLesson(lessonId: string) {
    return this.request(`/lessons/${lessonId}/complete`, { method: 'POST' });
  }

  async getLessonNotes(lessonId: string) {
    return this.request(`/lessons/${lessonId}/notes`);
  }

  async saveLessonNotes(lessonId: string, content: string) {
    return this.request(`/lessons/${lessonId}/notes`, {
      method: 'POST',
      body: { content },
    });
  }

  async getLessonQuiz(lessonId: string) {
    return this.request(`/lessons/${lessonId}/quiz`);
  }

  async submitQuizAnswer(lessonId: string, quizId: string, answer: string) {
    return this.request(`/lessons/${lessonId}/quiz/submit`, {
      method: 'POST',
      body: { quizId, answer },
    });
  }

  // Certificates
  async getMyCertificates() {
    return this.request('/certificates/my');
  }

  async verifyCertificate(certNo: string) {
    return this.request(`/certificates/verify/${certNo}`);
  }

  async downloadCertificate(id: string, filename?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('lms_token');
    const res = await fetch(`${this.baseUrl}/certificates/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download failed');
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `certificate-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const data = await res.json();
      const certNo = data?.data?.certificateNo ?? data?.certificateNo;
      if (certNo) window.open(`${window.location.origin}/verify-certificate/${certNo}`, '_blank');
      else throw new Error('Download failed');
    }
  }

  // Messages
  async getChatEnabled() {
    return this.request('/messages/chat-enabled');
  }

  async getEnrolledInstructors() {
    return this.request('/messages/enrolled-instructors');
  }

  async getEnrolledStudents() {
    return this.request('/messages/enrolled-students');
  }

  async getEnrolledStudentsParents() {
    return this.request('/messages/enrolled-students-parents');
  }

  async getInstructorEnrolledStudents() {
    return this.request('/instructor/enrolled-students');
  }

  async getInstructorEnrolledStudentsParents() {
    return this.request('/instructor/enrolled-students-parents');
  }

  async getConversations() {
    return this.request('/messages/conversations');
  }

  async getAdminConversations() {
    return this.request('/admin/messages/conversations');
  }

  async getAdminMessages(conversationId: string) {
    return this.request(`/admin/messages/conversations/${conversationId}/messages`);
  }

  async getMessages(conversationId: string) {
    return this.request(`/messages/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio') {
    return this.request(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content: content || '', attachmentUrl, attachmentType },
    });
  }

  async createConversation(userId: string, title?: string) {
    return this.request('/messages/conversations', {
      method: 'POST',
      body: { userId, title },
    });
  }

  async uploadMessageAttachment(file: File): Promise<{ url: string; attachmentType?: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await this.request('/messages/upload-attachment', {
      method: 'POST',
      body: form,
      isFormData: true,
    });
    return (res as any).data;
  }

  // Communities
  async getCommunities() {
    return this.request('/messages/communities');
  }

  async createCommunity(title: string, memberIds: string[]) {
    return this.request('/messages/communities', {
      method: 'POST',
      body: { title, memberIds },
    });
  }

  async addCommunityMembers(communityId: string, memberIds: string[]) {
    return this.request(`/messages/communities/${communityId}/members`, {
      method: 'POST',
      body: { memberIds },
    });
  }

  async removeCommunityMember(communityId: string, userId: string) {
    return this.request(`/messages/communities/${communityId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    q.set('limit', String(params?.limit ?? 50));
    return this.request(`/notifications?${q.toString()}`);
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // Contact
  async sendContactMessage(data: { name: string; email: string; subject: string; message: string }) {
    return this.request('/messages/contact', {
      method: 'POST',
      body: data,
    });
  }

  // Enrollments
  async getMyEnrollments() {
    return this.request('/enrollments');
  }

  async getLiveSessions() {
    return this.request('/enrollments/live-sessions');
  }

  async enrollFree(courseId: string) {
    const id = typeof courseId === 'string' ? courseId.trim() : ''
    if (!id) return { success: false, message: 'Course ID is required' }
    return this.request('/enrollments', {
      method: 'POST',
      body: { courseId: id, source: 'free' },
    });
  }

  // ==================== INSTRUCTOR ====================
  async getInstructorDashboardStats() {
    return this.request('/instructor/dashboard/stats');
  }

  async getInstructorRevenueMonthly() {
    return this.request('/instructor/dashboard/revenue-monthly');
  }

  async getInstructorRecentEnrollments() {
    return this.request('/instructor/dashboard/enrollments-recent');
  }

  async getInstructorTopCourses() {
    return this.request('/instructor/dashboard/top-courses');
  }

  async getInstructorCourses(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (!params?.limit) query.set('limit', '100'); // Get all courses by default
    return this.request(`/instructor/courses?${query.toString()}`);
  }

  async getInstructorCourseChapters(courseId: string) {
    return this.request(`/instructor/courses/${courseId}/chapters`);
  }

  async syncInstructorCourseContent(
    courseId: string,
    chapters: Array<{
      id?: string;
      title: string;
      titleAr?: string;
      lessons: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        type?: string;
        duration?: number;
        isFree?: boolean;
        videoUrl?: string;
        content?: string;
        attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
      }>;
      subsections?: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        lessons: Array<{
          id?: string;
          title: string;
          titleAr?: string;
          type?: string;
          duration?: number;
          isFree?: boolean;
          videoUrl?: string;
          content?: string;
          attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
        }>;
      }>;
    }>
  ) {
    return this.request(`/instructor/courses/${courseId}/content`, {
      method: 'POST',
      body: { chapters },
    });
  }

  async getInstructorStudents(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return this.request(`/instructor/students?${query.toString()}`);
  }

  async getInstructorStudentsExport() {
    return this.request('/instructor/students/export');
  }

  async getInstructorRevenueSummary() {
    return this.request('/instructor/revenue/summary');
  }

  async getInstructorRevenueByCourse() {
    return this.request('/instructor/revenue/by-course');
  }

  async getInstructorWalletSummary() {
    return this.request('/instructor/wallet/summary');
  }

  async getInstructorPayouts(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/instructor/payouts?${q.toString()}`);
  }

  async requestInstructorPayout(amount?: number) {
    return this.request('/instructor/payouts/request', { method: 'POST', body: amount ? { amount } : {} });
  }

  async getInstructorAnalyticsMetrics() {
    return this.request('/instructor/analytics/metrics');
  }

  async getInstructorAnalyticsEnrollments() {
    return this.request('/instructor/analytics/enrollments');
  }

  async getInstructorAnalyticsCourses() {
    return this.request('/instructor/analytics/courses');
  }

  async getInstructorPopularLessons() {
    return this.request('/instructor/analytics/lessons-popular');
  }

  async getInstructorReviews() {
    return this.request('/instructor/reviews');
  }

  async getInstructorReviewsSummary() {
    return this.request('/instructor/reviews/summary');
  }

  async replyToReview(reviewId: string, reply: string) {
    return this.request(`/instructor/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: { reply },
    });
  }

  async getInstructorConversations() {
    return this.request('/instructor/conversations');
  }

  async getInstructorMessages(conversationId: string) {
    return this.request(`/instructor/conversations/${conversationId}/messages`);
  }

  async sendInstructorMessage(conversationId: string, content: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio') {
    return this.request(`/instructor/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content: content || '', attachmentUrl, attachmentType },
    });
  }

  async getInstructorProfile() {
    return this.request('/instructor/profile');
  }

  async updateInstructorProfile(data: any) {
    return this.request('/instructor/profile', { method: 'PUT', body: data });
  }

  async updateInstructorPayment(data: any) {
    return this.request('/instructor/payment', { method: 'PUT', body: data });
  }

  async updateInstructorNotificationSettings(data: { email?: boolean; push?: boolean; inApp?: boolean }) {
    return this.request('/instructor/notification-settings', { method: 'PUT', body: data });
  }

  async getInstructorAssignments(params?: { page?: number; limit?: number; courseId?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.courseId) q.set('courseId', params.courseId);
    return this.request(`/instructor/assignments?${q.toString()}`);
  }

  async createInstructorAssignment(data: { title: string; titleAr?: string; description?: string; courseId: string; dueDate?: string; totalPoints?: number }) {
    return this.request('/instructor/assignments', { method: 'POST', body: data });
  }

  async getInstructorAssignment(id: string) {
    return this.request(`/instructor/assignments/${id}`);
  }

  async getInstructorAssignmentByLesson(lessonId: string) {
    return this.request(`/instructor/assignments/by-lesson/${lessonId}`);
  }

  async updateInstructorAssignment(id: string, data: any) {
    return this.request(`/instructor/assignments/${id}`, { method: 'PUT', body: data });
  }

  async deleteInstructorAssignment(id: string) {
    return this.request(`/instructor/assignments/${id}`, { method: 'DELETE' });
  }

  async gradeInstructorAssignmentSubmission(assignmentId: string, studentId: string, data: { grade?: number; feedback?: string }) {
    return this.request(`/instructor/assignments/${assignmentId}/submissions/${studentId}/grade`, { method: 'POST', body: data });
  }

  // ==================== TEACHER ====================
  async getTeacherDashboardStats() {
    return this.request('/teacher/dashboard/stats');
  }

  async getTeacherScheduleToday() {
    return this.request('/teacher/dashboard/schedule');
  }

  async getTeacherRecentSubmissions() {
    return this.request('/teacher/dashboard/recent-submissions');
  }

  async getTeacherClasses() {
    return this.request('/teacher/classes');
  }

  async createTeacherClass(data: any) {
    return this.request('/teacher/classes', { method: 'POST', body: data });
  }

  async getTeacherClass(id: string) {
    return this.request(`/teacher/classes/${id}`);
  }

  async getTeacherStudents(params?: { search?: string; classId?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.classId) query.set('classId', params.classId);
    return this.request(`/teacher/students?${query.toString()}`);
  }

  async getTeacherAssignedStudents() {
    return this.request('/teacher/students/assigned');
  }

  async addStudentToTeacherClass(classId: string, studentId: string) {
    return this.request(`/teacher/classes/${classId}/students`, { method: 'POST', body: { studentId } });
  }

  async removeStudentFromTeacherClass(classId: string, studentId: string) {
    return this.request(`/teacher/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
  }

  async gradeTeacherAssignmentSubmission(assignmentId: string, studentId: string, data: { grade?: number; feedback?: string }) {
    return this.request(`/teacher/assignments/${assignmentId}/submissions/${studentId}/grade`, { method: 'POST', body: data });
  }

  async getTeacherAssignments() {
    return this.request('/teacher/assignments');
  }

  async getTeacherAssignment(id: string) {
    return this.request(`/teacher/assignments/${id}`);
  }

  async updateTeacherAssignment(id: string, data: any) {
    return this.request(`/teacher/assignments/${id}`, { method: 'PUT', body: data });
  }

  async deleteTeacherAssignment(id: string) {
    return this.request(`/teacher/assignments/${id}`, { method: 'DELETE' });
  }

  // ==================== STUDENT ASSIGNMENTS ====================
  async getStudentAssignments(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/assignments/student?${q.toString()}`);
  }

  async submitCourseAssignment(assignmentId: string, data: { content?: string; fileUrl?: string; answers?: Record<string, string | string[]> }) {
    return this.request(`/assignments/course/${assignmentId}/submit`, { method: 'POST', body: data });
  }

  async submitTeacherAssignment(assignmentId: string, data: { content?: string; fileUrl?: string }) {
    return this.request(`/assignments/teacher/${assignmentId}/submit`, { method: 'POST', body: data });
  }

  // ==================== AI TUTOR ====================
  async getLessonAiChat(lessonId: string) {
    return this.request(`/ai-tutor/lessons/${lessonId}/chat`, { timeoutMs: 30000 });
  }

  async sendLessonAiChat(lessonId: string, message: string) {
    return this.request(`/ai-tutor/lessons/${lessonId}/chat`, { method: 'POST', body: { message }, timeoutMs: 45000 });
  }

  async generateLessonAiQuiz(lessonId: string, count?: number) {
    return this.request(`/ai-tutor/lessons/${lessonId}/quiz`, { method: 'POST', body: { count }, timeoutMs: 60000 });
  }

  async createTeacherAssignment(data: any) {
    return this.request('/teacher/assignments', { method: 'POST', body: data });
  }

  async getTeacherExams() {
    return this.request('/teacher/exams');
  }

  async createTeacherExam(data: any) {
    return this.request('/teacher/exams', { method: 'POST', body: data });
  }

  async getTeacherSchedule() {
    return this.request('/teacher/schedule');
  }

  async getTeacherProfile() {
    return this.request('/teacher/profile');
  }

  async updateTeacherProfile(data: any) {
    return this.request('/teacher/profile', { method: 'PUT', body: data });
  }

  // ==================== PARENT ====================
  async getParentChildren(withStats?: boolean) {
    const q = withStats ? '?withStats=true' : '';
    return this.request('/parent/children' + q);
  }

  async linkChild(data: { email?: string; code?: string }) {
    return this.request('/parent/children/link', { method: 'POST', body: data });
  }

  async getChildProgress(childId: string) {
    return this.request(`/parent/children/${childId}/progress`);
  }

  async getChildGrades(childId: string) {
    return this.request(`/parent/children/${childId}/grades`);
  }

  async getChildAttendance(childId: string, month?: string) {
    const query = month ? `?month=${month}` : '';
    return this.request(`/parent/children/${childId}/attendance${query}`);
  }

  async getChildAchievements(childId: string) {
    return this.request(`/parent/children/${childId}/achievements`);
  }

  async getChildCompletedLessons(childId: string, limit?: number) {
    const q = limit ? `?limit=${limit}` : '';
    return this.request(`/parent/children/${childId}/completed-lessons${q}`);
  }

  async getChildWeeklyStudyTime(childId: string) {
    return this.request(`/parent/children/${childId}/weekly-study-time`);
  }

  async getParentDashboardStats() {
    return this.request('/parent/dashboard/stats');
  }

  async getParentRecentActivity() {
    return this.request('/parent/activity/recent');
  }

  async getParentUpcomingEvents() {
    return this.request('/parent/events/upcoming');
  }

  async getParentConversations() {
    return this.request('/parent/conversations');
  }

  async getParentChildrenInstructors() {
    return this.request('/parent/children/instructors');
  }

  async createParentConversation(instructorId: string, childId?: string) {
    return this.request('/parent/conversations/create', {
      method: 'POST',
      body: { instructorId, childId },
    });
  }

  async getParentConversationMessages(conversationId: string) {
    return this.request(`/parent/conversations/${conversationId}/messages`);
  }

  async sendParentMessage(conversationId: string, content: string) {
    return this.request(`/parent/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
    });
  }

  async getParentProfile() {
    return this.request('/parent/profile');
  }

  async updateParentProfile(data: { name?: string; phone?: string; city?: string; country?: string; relationship?: string; address?: string }) {
    return this.request('/parent/profile', { method: 'PUT', body: data });
  }

  // ==================== ADMIN ====================
  async getAdminDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getAdminRevenue() {
    return this.request('/admin/dashboard/revenue');
  }

  async getAdminUserGrowth() {
    return this.request('/admin/dashboard/user-growth');
  }

  async getAdminTopCourses() {
    return this.request('/admin/dashboard/top-courses');
  }

  async getAdminRecentActivity() {
    return this.request('/admin/dashboard/recent-activity');
  }

  async getAdminEnrollmentsByCourse(limit = 6) {
    return this.request(`/admin/dashboard/enrollments-by-course?limit=${limit}`);
  }

  async getAdminEnrollmentsByCategory(limit = 6) {
    return this.request(`/admin/dashboard/enrollments-by-category?limit=${limit}`);
  }

  async getAdminAssignments(params?: { page?: number; limit?: number; type?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    return this.request(`/admin/assignments?${q.toString()}`);
  }

  async getAdminUsersStats() {
    return this.request('/admin/users/stats');
  }

  async getAdminUserDetail(id: string) {
    return this.request(`/admin/users/${id}`);
  }

  async getAdminUsers(params?: { page?: number; search?: string; role?: string; status?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', (params.role || '').toUpperCase());
    if (params?.status) query.set('status', (params.status || '').toUpperCase());
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request(`/admin/users?${query.toString()}`);
  }

  async createAdminUser(data: any) {
    const body = this.stripEmptyStrings(data);
    if (body?.role && typeof body.role === 'string') body.role = body.role.toUpperCase();
    return this.request('/admin/users', { method: 'POST', body });
  }

  async updateAdminUser(id: string, data: any) {
    const body = this.stripEmptyStrings(data);
    if (body?.role && typeof body.role === 'string') body.role = body.role.toUpperCase();
    return this.request(`/admin/users/${id}`, { method: 'PUT', body });
  }

  async deleteAdminUser(id: string) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  async resetUserPassword(id: string, newPassword: string) {
    return this.request(`/admin/users/${id}/reset-password`, { method: 'POST', body: { newPassword } });
  }

  async updateUserStatus(id: string, status: string) {
    const normalized = typeof status === 'string' ? status.toUpperCase() : status;
    return this.request(`/admin/users/${id}/status`, { method: 'PUT', body: { status: normalized } });
  }

  async getAdminStudents(params?: { search?: string; status?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    query.set('limit', String(params?.limit ?? 500));
    return this.request(`/admin/students?${query.toString()}`);
  }

  async getPendingTeachers() {
    return this.request('/admin/teachers/pending');
  }

  async approveTeacher(id: string) {
    return this.request(`/admin/teachers/${id}/approve`, { method: 'POST' });
  }

  async rejectTeacher(id: string) {
    return this.request(`/admin/teachers/${id}/reject`, { method: 'POST' });
  }

  async approveStudent(id: string, teacherId: string) {
    return this.request(`/admin/students/${id}/approve`, { method: 'POST', body: { teacherId } });
  }

  async rejectStudent(id: string) {
    return this.request(`/admin/students/${id}/reject`, { method: 'POST' });
  }

  async setRevenueShare(id: string, revenueShare: number) {
    return this.request(`/admin/instructors/${id}/revenue-share`, {
      method: 'PUT',
      body: { revenueShare },
    });
  }

  async setUserCommissionConfig(userId: string, config: { type: string; percentage?: number; amountPerStudent?: number; tiers?: Array<{ from: number; to: number | null; amount: number }> }) {
    return this.request(`/admin/users/${userId}/commission-config`, {
      method: 'PUT',
      body: config,
    });
  }

  async getAdminParents() {
    return this.request('/admin/parents');
  }

  async linkParentStudent(parentId: string, studentId: string) {
    return this.request(`/admin/parents/${parentId}/link-student/${studentId}`, { method: 'POST' });
  }

  async getAdminCourses(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return this.request(`/admin/courses?${query.toString()}`);
  }

  async getAdminCourseChapters(courseId: string) {
    return this.request(`/admin/courses/${courseId}/chapters`);
  }

  async getCourseAnalytics(courseId: string) {
    return this.request<{
      course: { id: string; title: string; titleAr?: string; thumbnail?: string; category?: string; instructor?: string; hours?: number };
      stats: { revenue: number; students: number; completionRate: number; lessonsCount: number; quizzesCount: number; rating: number; reviewsCount: number };
      monthlyData: { month: string; monthAr: string; revenue: number; students: number }[];
      students: { id: string; name: string; email: string; progress: number; date: string }[];
    }>(`/admin/courses/${courseId}/analytics`);
  }

  async syncCourseContent(
    courseId: string,
    chapters: Array<{
      id?: string;
      title: string;
      titleAr?: string;
      lessons: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        type?: string;
        duration?: number;
        isFree?: boolean;
        videoUrl?: string;
        content?: string;
        meetingProvider?: string;
        meetingUrl?: string;
        scheduledAt?: string;
        attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
      }>;
      subsections?: Array<{
        id?: string;
        title: string;
        titleAr?: string;
        lessons: Array<{
          id?: string;
          title: string;
          titleAr?: string;
          type?: string;
          duration?: number;
          isFree?: boolean;
          videoUrl?: string;
          content?: string;
          meetingProvider?: string;
          meetingUrl?: string;
          scheduledAt?: string;
          attachments?: Array<{ id?: string; name: string; url: string; type: string }>;
        }>;
      }>;
    }>
  ) {
    return this.request(`/admin/courses/${courseId}/content`, {
      method: 'POST',
      body: { chapters },
    });
  }

  async updateCourseStatus(id: string, status: string) {
    return this.request(`/admin/courses/${id}/status`, { method: 'PUT', body: { status } });
  }

  async updateAdminCourse(id: string, data: Partial<{ title: string; titleAr: string; description: string; thumbnail: string; category: string; level: string; price: number; status: string; featured: boolean; certificateTemplateId: string | null }>) {
    return this.request(`/admin/courses/${id}`, { method: 'PUT', body: data });
  }

  async getAdminEnrollments(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return this.request(`/admin/enrollments?${query.toString()}`);
  }

  async manualEnroll(userId: string, courseId: string) {
    return this.request('/admin/enrollments', {
      method: 'POST',
      body: { userId, courseId },
    });
  }

  async cancelEnrollment(id: string) {
    return this.request(`/admin/enrollments/${id}/cancel`, { method: 'PUT' });
  }

  async getAdminSettings(group?: string) {
    const endpoint = group ? `/admin/settings/${group}` : '/admin/settings';
    return this.request(endpoint);
  }

  async updateAdminSettings(group: string, data: Record<string, string>) {
    return this.request(`/admin/settings/${group}`, { method: 'PUT', body: { settings: data } });
  }

  async getAdminPermissions(module?: string) {
    const q = module ? `?module=${encodeURIComponent(module)}` : '';
    return this.request(`/admin/permissions${q}`);
  }

  async getAdminRoles() {
    return this.request('/admin/roles');
  }

  async getAdminContent(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/admin/content${query}`);
  }

  async createAdminContent(data: any) {
    return this.request('/admin/content', { method: 'POST', body: data });
  }

  async updateAdminContent(id: string, data: any) {
    return this.request(`/admin/content/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminContent(id: string) {
    return this.request(`/admin/content/${id}`, { method: 'DELETE' });
  }

  async getAdminServicesBundles(params?: { search?: string; status?: string; kind?: 'SERVICE' | 'BUNDLE'; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.kind) query.set('kind', params.kind);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/admin/services-bundles${suffix}`);
  }

  async createAdminServiceBundle(data: {
    kind: 'SERVICE' | 'BUNDLE';
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    image?: string;
    price?: number;
    ctaUrl?: string;
    status?: 'active' | 'inactive';
    position?: number;
  }) {
    return this.request('/admin/services-bundles', { method: 'POST', body: data });
  }

  async updateAdminServiceBundle(
    id: string,
    data: Partial<{
      kind: 'SERVICE' | 'BUNDLE';
      title: string;
      titleAr: string;
      description: string;
      descriptionAr: string;
      image: string;
      price: number;
      ctaUrl: string;
      status: 'active' | 'inactive';
      position: number;
    }>
  ) {
    return this.request(`/admin/services-bundles/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminServiceBundle(id: string) {
    return this.request(`/admin/services-bundles/${id}`, { method: 'DELETE' });
  }

  async getAdminFiles(params?: { type?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    return this.request(`/admin/files?${query.toString()}`);
  }

  async getStorageStats() {
    return this.request('/admin/files/storage-stats');
  }

  async deleteAdminFile(id: string) {
    return this.request(`/admin/files/${id}`, { method: 'DELETE' });
  }

  async getAdminExams() {
    return this.request('/admin/exams?limit=100');
  }

  async getAdminExam(id: string) {
    return this.request(`/admin/exams/${id}`);
  }

  async getAdminExamResults() {
    return this.request('/admin/exams/results');
  }

  async createAdminExam(data: {
    title: string
    courseId: string
    timeLimit?: number
    maxAttempts?: number
    passingScore?: number
    showCorrectAnswer?: boolean
    randomizeQuestions?: boolean
    randomizeOptions?: boolean
  }) {
    return this.request('/admin/exams', { method: 'POST', body: data });
  }

  async updateAdminExam(
    id: string,
    data: {
      title?: string
      courseId?: string
      timeLimit?: number
      maxAttempts?: number
      passingScore?: number
      showCorrectAnswer?: boolean
      randomizeQuestions?: boolean
      randomizeOptions?: boolean
    }
  ) {
    return this.request(`/admin/exams/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminExam(id: string) {
    return this.request(`/admin/exams/${id}`, { method: 'DELETE' });
  }

  async addAdminExamQuestion(
    examId: string,
    data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number }
  ) {
    return this.request(`/admin/exams/${examId}/questions`, { method: 'POST', body: data });
  }

  async updateAdminExamQuestion(
    examId: string,
    questionId: string,
    data: Partial<{ question: string; questionAr: string; type: string; options: string; correctAnswer: string; points: number }>
  ) {
    return this.request(`/admin/exams/${examId}/questions/${questionId}`, { method: 'PUT', body: data });
  }

  async deleteAdminExamQuestion(examId: string, questionId: string) {
    return this.request(`/admin/exams/${examId}/questions/${questionId}`, { method: 'DELETE' });
  }

  async getAdminQuestionBank() {
    return this.request('/admin/question-bank?limit=200');
  }

  async createAdminQuestionBankItem(data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number }) {
    return this.request('/admin/question-bank', { method: 'POST', body: data });
  }

  async deleteAdminQuestionBankItem(id: string) {
    return this.request(`/admin/question-bank/${id}`, { method: 'DELETE' });
  }

  async getAdminContentBank() {
    return this.request('/admin/content-bank?limit=200');
  }

  async createAdminContentBankItem(data: { title: string; titleAr?: string; type?: string; content?: string; videoUrl?: string; pdfUrl?: string; duration?: number }) {
    return this.request('/admin/content-bank', { method: 'POST', body: data });
  }

  async deleteAdminContentBankItem(id: string) {
    return this.request(`/admin/content-bank/${id}`, { method: 'DELETE' });
  }

  async getLessonGame(lessonId: string) {
    return this.request(`/games/lesson/${lessonId}`);
  }

  async getActiveGameSession(lessonId: string) {
    return this.request(`/games/lesson/${lessonId}/active-session`);
  }

  async createGameSession(lessonId: string) {
    return this.request(`/games/lesson/${lessonId}/sessions`, { method: 'POST' });
  }

  async getGameSession(sessionId: string) {
    return this.request(`/games/sessions/${sessionId}`);
  }

  async getGameSessionLeaderboard(sessionId: string) {
    return this.request(`/games/sessions/${sessionId}/leaderboard`);
  }

  async endGameSession(sessionId: string) {
    return this.request(`/games/sessions/${sessionId}/end`, { method: 'POST' });
  }

  async getSectionGameLeaderboard(chapterId: string) {
    return this.request(`/games/sections/${chapterId}/leaderboard`);
  }

  /** ws(s) base URL for the live game socket, derived from the same host/port the REST API uses. */
  getGameWebSocketBase(): string {
    return getApiBase().replace(/^http/, 'ws').replace(/\/api$/, '/api/games/ws');
  }

  async getAdminComprehensiveExams() {
    return this.request('/admin/comprehensive-exams?limit=100');
  }

  async getAdminComprehensiveExam(id: string) {
    return this.request(`/admin/comprehensive-exams/${id}`);
  }

  async createAdminComprehensiveExam(data: {
    courseId: string;
    title: string;
    titleAr?: string;
    duration?: number;
    passingScore?: number;
    maxAttempts?: number;
    showCorrectAnswer?: boolean;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    startDate?: string;
    endDate?: string;
    status?: string;
    hasCertificate?: boolean;
    passingScoreForCertificate?: number | null;
    certificateTemplateId?: string | null;
  }) {
    return this.request('/admin/comprehensive-exams', { method: 'POST', body: data });
  }

  async updateAdminComprehensiveExam(
    id: string,
    data: Partial<{
      courseId: string;
      title: string;
      titleAr: string;
      duration: number;
      passingScore: number;
      maxAttempts: number;
      showCorrectAnswer: boolean;
      randomizeQuestions: boolean;
      randomizeOptions: boolean;
      startDate: string;
      endDate: string;
      status: string;
      hasCertificate: boolean;
      passingScoreForCertificate: number | null;
      certificateTemplateId: string | null;
    }>
  ) {
    return this.request(`/admin/comprehensive-exams/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminComprehensiveExam(id: string) {
    return this.request(`/admin/comprehensive-exams/${id}`, { method: 'DELETE' });
  }

  async addAdminComprehensiveExamQuestion(examId: string, data: { question: string; questionAr?: string; type?: string; options: string; correctAnswer?: string; points?: number }) {
    return this.request(`/admin/comprehensive-exams/${examId}/questions`, { method: 'POST', body: data });
  }

  async deleteAdminComprehensiveExamQuestion(examId: string, questionId: string) {
    return this.request(`/admin/comprehensive-exams/${examId}/questions/${questionId}`, { method: 'DELETE' });
  }

  async getAdminComprehensiveExamResults(examId?: string) {
    const q = examId ? `?examId=${examId}` : '';
    return this.request(`/admin/comprehensive-exams/results${q}`);
  }

  async getComprehensiveExams() {
    return this.request('/users/comprehensive-exams');
  }

  async getComprehensiveExam(id: string) {
    return this.request(`/users/comprehensive-exams/${id}`);
  }

  async completeComprehensiveExam(id: string, answers: Array<{ questionId: string; answer: string }>) {
    return this.request(`/users/comprehensive-exams/${id}/complete`, { method: 'POST', body: { answers } });
  }

  async getMyComprehensiveExamResults() {
    return this.request('/users/comprehensive-exams/results');
  }

  async impersonateUser(id: string) {
    return this.request<{ token: string; expiresIn: string }>(`/admin/users/${id}/impersonate`, { method: 'POST' });
  }

  async testAdminEmail(to?: string) {
    return this.request('/admin/settings/email/test', { method: 'POST', body: to ? { to } : {} });
  }

  async uploadAdminFile(formData: FormData) {
    return this.request('/admin/files', { method: 'POST', body: formData, isFormData: true });
  }

  async getAdminReviews(params?: { status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/admin/reviews?${q.toString()}`);
  }

  async approveAdminReview(id: string) {
    return this.request(`/admin/reviews/${id}/approve`, { method: 'POST' });
  }

  async rejectAdminReview(id: string) {
    return this.request(`/admin/reviews/${id}/reject`, { method: 'POST' });
  }

  async setAdminReviewShowOnHomepage(id: string, showOnHomepage: boolean) {
    return this.request(`/admin/reviews/${id}/show-on-homepage`, {
      method: 'PUT',
      body: { showOnHomepage },
    });
  }

  async getAdminCertificates() {
    return this.request('/admin/certificates');
  }

  async getAdminCertificateTemplates() {
    return this.request('/admin/certificates/templates');
  }

  async createAdminCertificateTemplate(data: { name: string; nameAr?: string; imageUrl?: string; overlayFields?: string | object; isDefault?: boolean }) {
    return this.request('/admin/certificates/templates', { method: 'POST', body: data });
  }

  async updateAdminCertificateTemplate(id: string, data: { name?: string; nameAr?: string; imageUrl?: string; overlayFields?: string | object; isDefault?: boolean }) {
    return this.request(`/admin/certificates/templates/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminCertificateTemplate(id: string) {
    return this.request(`/admin/certificates/templates/${id}`, { method: 'DELETE' });
  }

  async getAdminNotificationStats() {
    return this.request('/admin/notifications/stats');
  }

  async getAdminNotificationHistory() {
    return this.request('/admin/notifications/history?limit=100');
  }

  async sendAdminNotification(data: { target: string; targetEmail?: string; channels?: string[]; title: string; message: string; userIds?: string[] }) {
    const body: Record<string, unknown> = { target: data.target, title: data.title, message: data.message };
    if (data.userIds?.length) body.userIds = data.userIds;
    if (data.targetEmail) body.targetEmail = data.targetEmail;
    return this.request('/admin/notifications/send', { method: 'POST', body });
  }

  async getAdminReport(type: string, dateRange?: string) {
    const query = dateRange ? `?dateRange=${dateRange}` : '';
    return this.request(`/admin/reports/${type}${query}`);
  }

  async exportAdminReport(type: string, format: string, dateRange?: string): Promise<{ success: boolean; data?: Blob; message?: string }> {
    const q = new URLSearchParams({ format });
    if (dateRange) q.set('dateRange', dateRange);
    const token = this.getToken();
    if (!token) return { success: false, message: 'Unauthorized' };
    try {
      const res = await fetch(`${this.baseUrl}/admin/reports/${type}/export?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.message || 'Export failed' };
      }
      const blob = await res.blob();
      return { success: true, data: blob };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Export failed' };
    }
  }

  async getAdminPaymentRequests(params?: { status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/admin/payment-requests?${q.toString()}`);
  }

  async approvePaymentRequest(id: string) {
    return this.request(`/admin/payment-requests/${id}/approve`, { method: 'POST' });
  }

  async rejectPaymentRequest(id: string, notes?: string) {
    return this.request(`/admin/payment-requests/${id}/reject`, { method: 'POST', body: { notes } });
  }

  async getAdminCoupons(params?: { used?: boolean; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.used === true) q.set('used', 'true');
    else if (params?.used === false) q.set('used', 'false');
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/admin/coupons?${q.toString()}`);
  }

  async createAdminCoupon(data: { code: string; discount: number; discountType?: string; maxUses?: number; minPurchase?: number; expiresAt?: string; courseIds?: string[] }) {
    return this.request('/admin/coupons', { method: 'POST', body: data });
  }

  async bulkCreateAdminCoupons(data: { count: number; discount: number; discountType?: string; maxUses?: number; minPurchase?: number; expiresAt?: string; courseIds?: string[] }) {
    return this.request('/admin/coupons/bulk', { method: 'POST', body: data });
  }

  async updateAdminCoupon(id: string, data: { isActive?: boolean; expiresAt?: string | null; maxUses?: number }) {
    return this.request(`/admin/coupons/${id}`, { method: 'PUT', body: data });
  }

  async deleteAdminCoupon(id: string) {
    return this.request(`/admin/coupons/${id}`, { method: 'DELETE' });
  }

  // ==================== ADMIN PAYOUTS (طلبات السحب) ====================
  async getAdminPayouts(params?: { status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return this.request(`/admin/payouts?${q.toString()}`);
  }

  async getAdminPayoutDetail(id: string) {
    return this.request(`/admin/payouts/${id}`);
  }

  async approveAdminPayout(id: string) {
    return this.request(`/admin/payouts/${id}/approve`, { method: 'POST' });
  }

  async rejectAdminPayout(id: string, notes?: string) {
    return this.request(`/admin/payouts/${id}/reject`, { method: 'POST', body: { notes } });
  }

  // ==================== COMMISSION CONFIG ====================
  async getCommissionConfig() {
    return this.request('/admin/commission');
  }

  async updateCommissionConfig(config: any) {
    return this.request('/admin/commission', { method: 'PUT', body: config });
  }

  async previewCommission(config: any, exampleRevenue: number, exampleStudents: number) {
    return this.request('/admin/commission/preview', {
      method: 'POST',
      body: { config, exampleRevenue, exampleStudents },
    });
  }

  // ==================== MARKETPLACE ====================
  async getProducts(params?: { type?: string; category?: string; search?: string; featured?: boolean; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.featured) query.set('featured', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request(`/marketplace/products?${query.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/marketplace/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/marketplace/products', { method: 'POST', body: data });
  }

  async orderProduct(productId: string, quantity: number) {
    return this.request(`/marketplace/products/${productId}/order`, {
      method: 'POST',
      body: { quantity },
    });
  }

  // Pricing tiers
  async getPricingTiers() {
    return this.request('/billing/pricing-tiers');
  }

  // Platform branding (public - no auth)
  async getPlatformBranding() {
    return this.request('/settings/branding');
  }

  async getServicesBundles() {
    return this.request('/settings/services-bundles');
  }

  // ==================== INSTRUCTOR CONTENT BANK ====================
  async getInstructorContentBank() { return this.get('/instructor/content-bank?limit=200'); }
  async createInstructorContentBankItem(data: any) { return this.post('/instructor/content-bank', data); }
  async deleteInstructorContentBankItem(id: string) { return this.delete(`/instructor/content-bank/${id}`); }

  // ==================== INSTRUCTOR QUESTION BANK ====================
  async getInstructorQuestionBank() { return this.get('/instructor/question-bank?limit=200'); }
  async createInstructorQuestionBankItem(data: any) { return this.post('/instructor/question-bank', data); }
  async deleteInstructorQuestionBankItem(id: string) { return this.delete(`/instructor/question-bank/${id}`); }

  // ==================== INSTRUCTOR EXAMS ====================
  async getInstructorExams() { return this.get('/instructor/exams?limit=100'); }
  async getInstructorExamById(id: string) { return this.get(`/instructor/exams/${id}`); }
  async createInstructorExam(data: any) { return this.post('/instructor/exams', data); }
  async updateInstructorExam(id: string, data: any) { return this.put(`/instructor/exams/${id}`, data); }
  async deleteInstructorExam(id: string) { return this.delete(`/instructor/exams/${id}`); }
  async getInstructorExamQuestions(id: string) { return this.get(`/instructor/exams/${id}/questions`); }
  async addInstructorExamQuestion(examId: string, data: any) { return this.post(`/instructor/exams/${examId}/questions`, data); }
  async updateInstructorExamQuestion(examId: string, qId: string, data: any) { return this.put(`/instructor/exams/${examId}/questions/${qId}`, data); }
  async deleteInstructorExamQuestion(examId: string, qId: string) { return this.delete(`/instructor/exams/${examId}/questions/${qId}`); }
  async getInstructorExamResults() { return this.get('/instructor/exams-results'); }

  // ==================== INSTRUCTOR COMPREHENSIVE EXAMS ====================
  async getInstructorComprehensiveExams() { return this.get('/instructor/comprehensive-exams?limit=100'); }
  async getInstructorComprehensiveExamById(id: string) { return this.get(`/instructor/comprehensive-exams/${id}`); }
  async createInstructorComprehensiveExam(data: any) { return this.post('/instructor/comprehensive-exams', data); }
  async updateInstructorComprehensiveExam(id: string, data: any) { return this.put(`/instructor/comprehensive-exams/${id}`, data); }
  async deleteInstructorComprehensiveExam(id: string) { return this.delete(`/instructor/comprehensive-exams/${id}`); }
  async addInstructorComprehensiveExamQuestion(examId: string, data: any) { return this.post(`/instructor/comprehensive-exams/${examId}/questions`, data); }
  async deleteInstructorComprehensiveExamQuestion(examId: string, qId: string) { return this.delete(`/instructor/comprehensive-exams/${examId}/questions/${qId}`); }
  async getInstructorComprehensiveExamResults() { return this.get('/instructor/comprehensive-exams-results'); }

  // ==================== MEMBERSHIP ====================
  async getMembershipPackages() { return this.request('/membership/packages'); }
  async getMembershipPackageCourses(packageId: string) { return this.request(`/membership/packages/${packageId}/courses`); }
  async getMyMemberships() { return this.request('/membership/my'); }
  async getAdminMembershipPackages() { return this.request('/membership/admin/packages'); }
  async createMembershipPackage(data: any) { return this.post('/membership/admin/packages', data); }
  async updateMembershipPackage(id: string, data: any) { return this.put(`/membership/admin/packages/${id}`, data); }
  async deleteMembershipPackage(id: string) { return this.delete(`/membership/admin/packages/${id}`); }
  async getAdminMemberships() { return this.request('/membership/admin/memberships'); }
  async issueMembership(data: { userId: string; packageId: string; expiresAt?: string }) {
    return this.post('/membership/admin/issue', data);
  }
  async getMyMembership(id: string) { return this.request(`/membership/my/${id}`); }
  async verifyMembership(membershipNo: string) { return this.request(`/membership/verify/${encodeURIComponent(membershipNo)}`); }
  async getAdminMembershipTemplates() { return this.request('/membership/admin/templates'); }
  async createAdminMembershipTemplate(data: any) { return this.post('/membership/admin/templates', data); }
  async updateAdminMembershipTemplate(id: string, data: any) { return this.put(`/membership/admin/templates/${id}`, data); }
  async deleteAdminMembershipTemplate(id: string) { return this.delete(`/membership/admin/templates/${id}`); }
}

export const api = new ApiClient();
export default api;
