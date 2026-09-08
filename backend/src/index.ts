import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import prisma from './config/database';
import { redisRateLimit } from './lib/ratelimit';

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
import { initWebSocketServer } from './realtime/websocket';
import { initGameWebSocketServer } from './realtime/game-websocket';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.set('trust proxy', 1);
app.use('/api/', redisRateLimit);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.nodeEnv !== 'production') return callback(null, true);
    if (origin === env.frontendUrl) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/instructor', instructorRoutes);

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

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'up' });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      db: 'down',
      message: err instanceof Error ? err.message : 'db error',
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
});

const server = http.createServer(app);
initWebSocketServer(server);
initGameWebSocketServer(server);

if (!env.isVercel) {
  const start = async () => {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
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
  void start();
}

export default server;
