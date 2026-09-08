import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uploadImage } from '../../middleware/upload';
import { authController } from './auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  logoutSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

router.get('/lookup-student', authController.lookupStudent);
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/logout', validate(logoutSchema), authController.logout);

router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateMe);
router.put('/me/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/me/avatar', authenticate, uploadImage, authController.uploadAvatar);

export default router;
