import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { communityController } from './community.controller';
import { uploadFile } from '../../middleware/upload';

const router = Router();

router.get('/posts', optionalAuth, communityController.getPosts);
router.get('/posts/:id', optionalAuth, communityController.getPost);
router.post('/posts', authenticate, uploadFile, communityController.createPost);
router.delete('/posts/:id', authenticate, communityController.deletePost);
router.post('/posts/:id/like', authenticate, communityController.toggleLike);
router.get('/posts/:id/comments', optionalAuth, communityController.getComments);
router.post('/posts/:id/comments', authenticate, communityController.addComment);
router.delete('/comments/:id', authenticate, communityController.deleteComment);

export default router;
