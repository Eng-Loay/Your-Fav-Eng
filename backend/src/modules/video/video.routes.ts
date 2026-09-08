import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadVideo } from '../../middleware/upload';
import { videoController } from './video.controller';

const router = Router();

router.get('/status', authenticate, (_req, res) => {
  res.json({ success: true, data: { status: 'active', provider: 'secure-stream', storageUsed: 0 } });
});
router.post('/upload', authenticate, uploadVideo, videoController.upload);
router.get('/:id/stream', videoController.getStreamUrl);
router.delete('/:id', authenticate, videoController.deleteVideo);

export default router;
