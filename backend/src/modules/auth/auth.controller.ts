import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { authService } from './auth.service';

export const authController = {
  async lookupStudent(req: AuthRequest, res: Response) {
    try {
      const q = (req.query.q as string) || (req.query.email as string) || '';
      const student = await authService.lookupStudent(q);
      return ApiResponse.success(res, student);
    } catch {
      return ApiResponse.error(res, 'Lookup failed', 500);
    }
  },

  async register(req: AuthRequest, res: Response) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message === 'Email already registered') {
        return ApiResponse.badRequest(res, message);
      }
      return ApiResponse.error(res, message, 400);
    }
  },

  async login(req: AuthRequest, res: Response) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.includes('Invalid') || message.includes('not active')) {
        return ApiResponse.unauthorized(res, message);
      }
      return ApiResponse.error(res, message, 400);
    }
  },

  async refresh(req: AuthRequest, res: Response) {
    try {
      const tokens = await authService.refresh(req.body);
      return ApiResponse.success(res, tokens);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed';
      return ApiResponse.unauthorized(res, message);
    }
  },

  async forgotPassword(req: AuthRequest, res: Response) {
    try {
      await authService.forgotPassword(req.body);
      return ApiResponse.success(res, null, 'If an account exists, a reset email has been sent');
    } catch (err) {
      return ApiResponse.error(res, 'Request failed', 500);
    }
  },

  async logout(req: AuthRequest, res: Response) {
    try {
      await authService.logout(req.body);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      return ApiResponse.error(res, 'Logout failed', 500);
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getMe(req.user!.id);
      return ApiResponse.success(res, user);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch profile', 500);
    }
  },

  async updateMe(req: AuthRequest, res: Response) {
    try {
      const user = await authService.updateMe(req.user!.id, req.body);
      return ApiResponse.success(res, user, 'Profile updated');
    } catch (err) {
      return ApiResponse.error(res, 'Update failed', 500);
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      await authService.changePassword(req.user!.id, req.body);
      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Change password failed';
      if (message.includes('Current password')) {
        return ApiResponse.badRequest(res, message);
      }
      return ApiResponse.error(res, message, 500);
    }
  },

  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.file?.blobUrl) {
        return ApiResponse.badRequest(res, 'No image provided');
      }
      const user = await authService.uploadAvatar(req.user!.id, req.file.blobUrl);
      return ApiResponse.success(res, user, 'Avatar uploaded');
    } catch (err) {
      return ApiResponse.error(res, 'Avatar upload failed', 500);
    }
  },
};
