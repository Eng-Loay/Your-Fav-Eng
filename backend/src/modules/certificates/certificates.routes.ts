import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { certificatesController } from './certificates.controller';

const router = Router();

router.get('/my', authenticate, certificatesController.listMy);
router.get('/verify/:certNo', optionalAuth, certificatesController.verify);
router.get('/download-by-no/:certNo', certificatesController.downloadByCertNo);
router.get('/:id/download', authenticate, certificatesController.download);

export default router;
