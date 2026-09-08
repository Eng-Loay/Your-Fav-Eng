import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import prisma from './config/database';

// Route imports
import { authenticate, authorize } from './middleware/auth';
import { validate } from './middleware/validate';
import { uploadFile } from './middleware/upload';
import { adminController } from './modules/admin/admin.controller';
import { commissionConfigSchema } from './modules/admin/admin.validation';
import authRoutes from './modules/auth/auth.routes';
import coursesRoutes from './modules/courses/courses.routes';
import chaptersRoutes from './modules/chapters/chapters.routes';
import lessonsRoutes from './modules/lessons/lessons.routes';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes';
import billingRoutes from './modules/billing/billing.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import teacherRoutes from './modules/teacher/teacher.routes';
import instructorRoutes from './modules/instructor/instructor.routes';
import adminRoutes from './modules/admin/admin.routes';
import messagesRoutes from './modules/messages/messages.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import certificatesRoutes from './modules/certificates/certificates.routes';
import parentRoutes from './modules/parent/parent.routes';
import usersRoutes from './modules/users/users.routes';
import marketplaceRoutes from './modules/marketplace/marketplace.routes';
import videoRoutes from './modules/video/video.routes';
import reportsRoutes from './modules/reports/reports.routes';
import settingsRoutes from './modules/settings/settings.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import communityRoutes from './modules/community/community.routes';
import membershipRoutes from './modules/membership/membership.routes';
import gamesRoutes from './modules/games/games.routes';
import aiTutorRoutes from './modules/ai-tutor/ai-tutor.routes';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-real-ip'] as string || req.ip || 'unknown',
});
app.set('trust proxy', 1);
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: env.nodeEnv === 'production' ? env.frontendUrl : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/instructor', instructorRoutes);
// Admin - explicit routes before admin router (avoids 404 on param route conflicts)
const adminAuth = [authenticate, authorize('ADMIN')];
app.get('/api/admin/courses/:id/chapters', ...adminAuth, adminController.getCourseChapters);
app.get('/api/admin/courses/:id/content', ...adminAuth, adminController.getCourseChapters);
app.get('/api/admin/courses/:id/analytics', ...adminAuth, adminController.getCourseAnalytics);
app.post('/api/admin/courses/:id/content', ...adminAuth, adminController.syncCourseContent);
app.get('/api/admin/question-bank', ...adminAuth, adminController.listQuestionBank);
app.post('/api/admin/question-bank', ...adminAuth, adminController.createQuestionBankItem);
app.get('/api/admin/comprehensive-exams', ...adminAuth, adminController.listComprehensiveExams);
app.get('/api/admin/comprehensive-exams/results', ...adminAuth, adminController.getComprehensiveExamResults);
app.post('/api/admin/comprehensive-exams', ...adminAuth, adminController.createComprehensiveExam);
app.post('/api/admin/coupons/bulk', ...adminAuth, adminController.bulkCreateCoupons);
app.get('/api/admin/payment-requests', ...adminAuth, adminController.listPaymentRequests);
app.post('/api/admin/payment-requests/:id/approve', ...adminAuth, adminController.approvePaymentRequest);
app.post('/api/admin/payment-requests/:id/reject', ...adminAuth, adminController.rejectPaymentRequest);
app.put('/api/admin/store/orders/:id/status', ...adminAuth, adminController.updateStoreOrderStatus);
app.delete('/api/admin/store/orders/:id', ...adminAuth, adminController.deleteStoreOrder);
app.get('/api/admin/certificates/templates', ...adminAuth, adminController.listCertificateTemplates);
app.post('/api/admin/certificates/templates', ...adminAuth, adminController.createCertificateTemplate);
app.put('/api/admin/certificates/templates/:id', ...adminAuth, adminController.updateCertificateTemplate);
app.delete('/api/admin/certificates/templates/:id', ...adminAuth, adminController.deleteCertificateTemplate);
app.get('/api/admin/reviews', ...adminAuth, adminController.listReviews);
app.post('/api/admin/reviews/:id/approve', ...adminAuth, adminController.approveReview);
app.post('/api/admin/reviews/:id/reject', ...adminAuth, adminController.rejectReview);
app.put('/api/admin/reviews/:id/show-on-homepage', ...adminAuth, adminController.setReviewShowOnHomepage);
app.post('/api/admin/files', ...adminAuth, uploadFile, adminController.uploadFile);
app.put('/api/admin/users/:id/commission-config', ...adminAuth, validate(commissionConfigSchema), adminController.setUserCommissionConfig);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Start server
const start = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    const server = http.createServer(app);

    // Initialize WebSocket server for real-time messages
    // Lazy import to avoid circular dependencies at module load time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initWebSocketServer } = require('./realtime/websocket') as typeof import('./realtime/websocket');
    initWebSocketServer(server);

    // Initialize WebSocket server for live quiz games
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initGameWebSocketServer } = require('./realtime/game-websocket') as typeof import('./realtime/game-websocket');
    initGameWebSocketServer(server);

    server.listen(env.port, '0.0.0.0', () => {
      console.log(`Server running on port ${env.port} (accessible from network)`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Frontend URL: ${env.frontendUrl}`);
      console.log('WebSocket server for /api/messages/ws initialized');
      console.log('WebSocket server for /api/games/ws initialized');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
