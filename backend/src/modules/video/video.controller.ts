import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { videoService } from './video.service';

export const videoController = {
  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const file = req.file;
      if (!file) return ApiResponse.badRequest(res, 'No video file provided');
      const result = await videoService.upload(req.user.id, file);
      return ApiResponse.created(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to upload video', 500);
    }
  },

  async getStreamUrl(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await videoService.getStreamUrl(id, req.user?.id);
      if (!result) return ApiResponse.notFound(res, 'Video not found');
      const accept = String(req.headers.accept || '');
      const wantsFile = req.query.redirect === '1' || accept.includes('video/') || accept.includes('application/octet-stream');
      if (wantsFile && result.streamUrl.startsWith('http')) {
        return res.redirect(302, result.streamUrl);
      }
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get stream URL', 500);
    }
  },

  async deleteVideo(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await videoService.deleteVideo(id, req.user.id, req.user.role);
      if (!result) return ApiResponse.notFound(res, 'Video not found');
      return ApiResponse.success(res, null, 'Video deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete video', 500);
    }
  },
};
