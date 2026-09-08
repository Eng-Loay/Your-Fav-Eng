import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { uploadFile } from '../../middleware/upload';
import { adminController } from './admin.controller';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
  revenueShareSchema,
  commissionConfigSchema,
  updateCourseStatusSchema,
  manualEnrollSchema,
  settingsGroupSchema,
  createRoleSchema,
  updateRoleSchema,
  updateRolePermissionsSchema,
  createContentSchema,
  updateContentSchema,
  createServiceBundleSchema,
  updateServiceBundleSchema,
  createExamSchema,
  updateExamSchema,
  sendNotificationSchema,
} from './admin.validation';

const router = Router();
const adminAuth = [authenticate, authorize('ADMIN')];

// ==================== MESSAGES (Admin view all) ====================
router.get('/messages/conversations', ...adminAuth, adminController.listAllConversations);
router.get('/messages/conversations/:id/messages', ...adminAuth, adminController.getConversationMessages);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', ...adminAuth, adminController.getDashboardStats);
router.get('/dashboard/revenue', ...adminAuth, adminController.getMonthlyRevenue);
router.get('/dashboard/user-growth', ...adminAuth, adminController.getUserGrowth);
router.get('/dashboard/top-courses', ...adminAuth, adminController.getTopCourses);
router.get('/dashboard/recent-activity', ...adminAuth, adminController.getRecentActivity);
router.get('/dashboard/enrollments-by-course', ...adminAuth, adminController.getEnrollmentsByCourse);
router.get('/dashboard/enrollments-by-category', ...adminAuth, adminController.getEnrollmentsByCategory);

// ==================== ASSIGNMENTS ====================
router.get('/assignments', ...adminAuth, adminController.listAssignments);

// ==================== USERS ====================
router.get('/users/stats', ...adminAuth, adminController.getUsersStats);
router.get('/users', ...adminAuth, validateQuery(listUsersQuerySchema), adminController.listUsers);
router.get('/users/:id', ...adminAuth, adminController.getUserDetail);
router.post('/users', ...adminAuth, validate(createUserSchema), adminController.createUser);
router.put('/users/:id', ...adminAuth, validate(updateUserSchema), adminController.updateUser);
router.delete('/users/:id', ...adminAuth, adminController.deleteUser);
router.post(
  '/users/:id/reset-password',
  ...adminAuth,
  validate(resetPasswordSchema),
  adminController.resetUserPassword
);
router.put(
  '/users/:id/status',
  ...adminAuth,
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);
router.post('/users/:id/impersonate', ...adminAuth, adminController.impersonate);
router.put(
  '/users/:id/commission-config',
  ...adminAuth,
  validate(commissionConfigSchema),
  adminController.setUserCommissionConfig
);

// ==================== STUDENTS ====================
router.get('/students', ...adminAuth, adminController.listStudents);
router.get('/students/:id', ...adminAuth, adminController.getStudentDetails);

// ==================== TEACHERS ====================
router.get('/teachers/pending', ...adminAuth, adminController.getPendingTeachers);
router.post('/teachers/:id/approve', ...adminAuth, adminController.approveTeacher);
router.post('/teachers/:id/reject', ...adminAuth, adminController.rejectTeacher);
router.post('/students/:id/approve', ...adminAuth, adminController.approveStudent);
router.post('/students/:id/reject', ...adminAuth, adminController.rejectStudent);
router.put(
  '/instructors/:id/revenue-share',
  ...adminAuth,
  validate(revenueShareSchema),
  adminController.setInstructorRevenueShare
);

// ==================== PARENTS ====================
router.get('/parents', ...adminAuth, adminController.listParents);
router.post(
  '/parents/:parentId/link-student/:studentId',
  ...adminAuth,
  adminController.linkParentToStudent
);

// ==================== COURSES ====================
router.get('/courses', ...adminAuth, adminController.listCourses);
router.get('/courses/:id/chapters', ...adminAuth, adminController.getCourseChapters);
router.get('/courses/:id/content', ...adminAuth, adminController.getCourseChapters);
router.get('/courses/:id/analytics', ...adminAuth, adminController.getCourseAnalytics);
router.post('/courses/:id/content', ...adminAuth, adminController.syncCourseContent);
router.post('/courses', ...adminAuth, adminController.createCourse);
router.put('/courses/:id', ...adminAuth, adminController.updateCourse);
router.delete('/courses/:id', ...adminAuth, adminController.deleteCourse);
router.put(
  '/courses/:id/status',
  ...adminAuth,
  validate(updateCourseStatusSchema),
  adminController.updateCourseStatus
);

// ==================== PRODUCTS (STORE) ====================
router.get('/products', ...adminAuth, adminController.listProducts);
router.get('/store/orders', ...adminAuth, adminController.listStoreOrders);
router.get('/store/orders/stats', ...adminAuth, adminController.getStoreOrderStats);
router.put('/store/orders/:id/status', ...adminAuth, adminController.updateStoreOrderStatus);
router.delete('/store/orders/:id', ...adminAuth, adminController.deleteStoreOrder);
router.post('/products', ...adminAuth, adminController.createProduct);
router.put('/products/:id', ...adminAuth, adminController.updateProduct);
router.delete('/products/:id', ...adminAuth, adminController.deleteProduct);

// ==================== ENROLLMENTS ====================
router.get('/enrollments', ...adminAuth, adminController.listEnrollments);
router.post(
  '/enrollments',
  ...adminAuth,
  validate(manualEnrollSchema),
  adminController.manualEnroll
);
router.put('/enrollments/:id/cancel', ...adminAuth, adminController.cancelEnrollment);

// ==================== SETTINGS ====================
router.get('/settings', ...adminAuth, adminController.getAllSettings);
router.post('/settings/email/test', ...adminAuth, adminController.sendTestEmail);
router.get('/settings/:group', ...adminAuth, adminController.getSettingsByGroup);
router.put(
  '/settings/:group',
  ...adminAuth,
  validate(settingsGroupSchema),
  adminController.updateSettingsGroup
);

// ==================== ROLES & PERMISSIONS ====================
router.get('/permissions', ...adminAuth, adminController.listPermissions);
router.get('/roles', ...adminAuth, adminController.listRoles);
router.post('/roles', ...adminAuth, validate(createRoleSchema), adminController.createRole);
router.put('/roles/:id', ...adminAuth, validate(updateRoleSchema), adminController.updateRole);
router.delete('/roles/:id', ...adminAuth, adminController.deleteRole);
router.put(
  '/roles/:id/permissions',
  ...adminAuth,
  validate(updateRolePermissionsSchema),
  adminController.updateRolePermissions
);

// ==================== CONTENT ====================
router.get('/content', ...adminAuth, adminController.listContent);
router.post('/content', ...adminAuth, validate(createContentSchema), adminController.createContent);
router.put('/content/:id', ...adminAuth, validate(updateContentSchema), adminController.updateContent);
router.delete('/content/:id', ...adminAuth, adminController.deleteContent);

// ==================== SERVICES & BUNDLES ====================
router.get('/services-bundles', ...adminAuth, adminController.listServiceBundles);
router.post('/services-bundles', ...adminAuth, validate(createServiceBundleSchema), adminController.createServiceBundle);
router.put('/services-bundles/:id', ...adminAuth, validate(updateServiceBundleSchema), adminController.updateServiceBundle);
router.delete('/services-bundles/:id', ...adminAuth, adminController.deleteServiceBundle);

// ==================== FILES ====================
router.post('/files', ...adminAuth, uploadFile, adminController.uploadFile);
router.get('/files', ...adminAuth, adminController.listFiles);
router.get('/files/storage-stats', ...adminAuth, adminController.getStorageStats);
router.delete('/files/:id', ...adminAuth, adminController.deleteFile);

// ==================== EXAMS ====================
router.get('/exams', ...adminAuth, adminController.listExams);
router.get('/exams/results', ...adminAuth, adminController.getExamResults);
router.get('/exams/:id', ...adminAuth, adminController.getExamById);
router.post('/exams', ...adminAuth, validate(createExamSchema), adminController.createExam);
router.put('/exams/:id', ...adminAuth, validate(updateExamSchema), adminController.updateExam);
router.delete('/exams/:id', ...adminAuth, adminController.deleteExam);
router.post('/exams/:id/questions', ...adminAuth, adminController.addExamQuestion);
router.put('/exams/:id/questions/:questionId', ...adminAuth, adminController.updateExamQuestion);
router.delete('/exams/:id/questions/:questionId', ...adminAuth, adminController.deleteExamQuestion);

// ==================== QUESTION BANK ====================
router.get('/question-bank', ...adminAuth, adminController.listQuestionBank);
router.post('/question-bank', ...adminAuth, adminController.createQuestionBankItem);
router.put('/question-bank/:id', ...adminAuth, adminController.updateQuestionBankItem);
router.delete('/question-bank/:id', ...adminAuth, adminController.deleteQuestionBankItem);

// ==================== CONTENT BANK ====================
router.get('/content-bank', ...adminAuth, adminController.listContentBank);
router.post('/content-bank', ...adminAuth, adminController.createContentBankItem);
router.put('/content-bank/:id', ...adminAuth, adminController.updateContentBankItem);
router.delete('/content-bank/:id', ...adminAuth, adminController.deleteContentBankItem);

// ==================== COMPREHENSIVE EXAMS ====================
router.get('/comprehensive-exams', ...adminAuth, adminController.listComprehensiveExams);
router.get('/comprehensive-exams/results', ...adminAuth, adminController.getComprehensiveExamResults);
router.get('/comprehensive-exams/:id', ...adminAuth, adminController.getComprehensiveExam);
router.post('/comprehensive-exams', ...adminAuth, adminController.createComprehensiveExam);
router.put('/comprehensive-exams/:id', ...adminAuth, adminController.updateComprehensiveExam);
router.delete('/comprehensive-exams/:id', ...adminAuth, adminController.deleteComprehensiveExam);
router.post('/comprehensive-exams/:id/questions', ...adminAuth, adminController.addComprehensiveExamQuestion);
router.delete('/comprehensive-exams/:id/questions/:questionId', ...adminAuth, adminController.deleteComprehensiveExamQuestion);

// ==================== REVIEWS ====================
router.get('/reviews', ...adminAuth, adminController.listReviews);
router.post('/reviews/:id/approve', ...adminAuth, adminController.approveReview);
router.post('/reviews/:id/reject', ...adminAuth, adminController.rejectReview);
router.put('/reviews/:id/show-on-homepage', ...adminAuth, adminController.setReviewShowOnHomepage);

// ==================== CERTIFICATES ====================
router.get('/certificates', ...adminAuth, adminController.listCertificates);
router.get('/certificates/verify/:certNo', ...adminAuth, adminController.verifyCertificate);
router.get('/certificates/templates', ...adminAuth, adminController.listCertificateTemplates);
router.post('/certificates/templates', ...adminAuth, adminController.createCertificateTemplate);
router.put('/certificates/templates/:id', ...adminAuth, adminController.updateCertificateTemplate);
router.delete('/certificates/templates/:id', ...adminAuth, adminController.deleteCertificateTemplate);

// ==================== NOTIFICATIONS ====================
router.get('/notifications/stats', ...adminAuth, adminController.getNotificationStats);
router.get('/notifications/history', ...adminAuth, adminController.getNotificationHistory);
router.post(
  '/notifications/send',
  ...adminAuth,
  validate(sendNotificationSchema),
  adminController.sendNotification
);

// ==================== CATEGORIES ====================
router.get('/categories', ...adminAuth, adminController.listCategories);
router.post('/categories', ...adminAuth, adminController.createCategory);
router.put('/categories/:id', ...adminAuth, adminController.updateCategory);
router.delete('/categories/:id', ...adminAuth, adminController.deleteCategory);

// ==================== REPORTS ====================
router.get('/reports/:type/export', ...adminAuth, adminController.exportReport);
router.get('/reports/:type', ...adminAuth, adminController.getReport);

// ==================== PAYMENT REQUESTS (طلبات الطلاب) ====================
router.get('/payment-requests', ...adminAuth, adminController.listPaymentRequests);
router.post('/payment-requests/:id/approve', ...adminAuth, adminController.approvePaymentRequest);
router.post('/payment-requests/:id/reject', ...adminAuth, adminController.rejectPaymentRequest);

// ==================== COUPONS ====================
router.get('/coupons', ...adminAuth, adminController.listCoupons);
router.post('/coupons', ...adminAuth, adminController.createCoupon);
router.post('/coupons/bulk', ...adminAuth, adminController.bulkCreateCoupons);
router.put('/coupons/:id', ...adminAuth, adminController.updateCoupon);
router.delete('/coupons/:id', ...adminAuth, adminController.deleteCoupon);

// ==================== PAYOUTS (طلبات السحب) ====================
router.get('/payouts', ...adminAuth, adminController.listPayouts);
router.get('/payouts/:id', ...adminAuth, adminController.getPayoutDetail);
router.post('/payouts/:id/approve', ...adminAuth, adminController.approvePayout);
router.post('/payouts/:id/reject', ...adminAuth, adminController.rejectPayout);

// ==================== COMMISSION CONFIG ====================
router.get('/commission', ...adminAuth, adminController.getCommissionConfig);
router.put('/commission', ...adminAuth, adminController.updateCommissionConfig);
router.post('/commission/preview', ...adminAuth, adminController.previewCommission);

export default router;
