import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const postInclude = {
  author: { select: { id: true, name: true, avatar: true, role: true } },
  _count: { select: { likes: true, comments: true } },
};

function paramId(req: Request): string {
  return req.params.id as string;
}

export const communityController = {
  async getPosts(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const userId = req.user?.id;

      const [posts, total] = await Promise.all([
        prisma.communityPost.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            ...postInclude,
            likes: userId ? { where: { userId }, select: { id: true } } : false,
          },
        }),
        prisma.communityPost.count(),
      ]);

      const mapped = posts.map((p: any) => ({
        ...p,
        isLiked: userId ? (p.likes?.length > 0) : false,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        likes: undefined,
        _count: undefined,
      }));

      res.json({
        success: true,
        data: mapped,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error('getPosts error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
  },

  async getPost(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const id = paramId(req);
      const post = await prisma.communityPost.findUnique({
        where: { id },
        include: {
          ...postInclude,
          likes: userId ? { where: { userId }, select: { id: true } } : false,
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              author: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const mapped = {
        ...post,
        isLiked: userId ? ((post as any).likes?.length > 0) : false,
        likesCount: (post as any)._count.likes,
        commentsCount: (post as any)._count.comments,
        likes: undefined,
        _count: undefined,
      };

      res.json({ success: true, data: mapped });
    } catch (err) {
      console.error('getPost error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
  },

  async createPost(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      let image: string | undefined;
      if ((req as any).file) {
        image = `/uploads/${(req as any).file.filename}`;
      }

      const post = await prisma.communityPost.create({
        data: {
          authorId: req.user!.id,
          content: content.trim(),
          image,
        },
        include: postInclude,
      });

      res.json({
        success: true,
        data: {
          ...post,
          isLiked: false,
          likesCount: 0,
          commentsCount: 0,
          _count: undefined,
        },
      });
    } catch (err) {
      console.error('createPost error:', err);
      res.status(500).json({ success: false, message: 'Failed to create post' });
    }
  },

  async deletePost(req: AuthRequest, res: Response) {
    try {
      const deleteId = paramId(req);
      const post = await prisma.communityPost.findUnique({
        where: { id: deleteId },
        select: { authorId: true },
      });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const isAdmin = req.user!.role === 'ADMIN';
      if (post.authorId !== req.user!.id && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await prisma.communityPost.delete({ where: { id: deleteId } });
      res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
      console.error('deletePost error:', err);
      res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
  },

  async toggleLike(req: AuthRequest, res: Response) {
    try {
      const postId = paramId(req);
      const userId = req.user!.id;

      const existing = await prisma.communityLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existing) {
        await prisma.communityLike.delete({ where: { id: existing.id } });
        const count = await prisma.communityLike.count({ where: { postId } });
        return res.json({ success: true, data: { liked: false, likesCount: count } });
      }

      await prisma.communityLike.create({ data: { postId, userId } });
      const count = await prisma.communityLike.count({ where: { postId } });
      res.json({ success: true, data: { liked: true, likesCount: count } });
    } catch (err) {
      console.error('toggleLike error:', err);
      res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
  },

  async getComments(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const commentsPostId = paramId(req);
      const [comments, total] = await Promise.all([
        prisma.communityComment.findMany({
          where: { postId: commentsPostId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        }),
        prisma.communityComment.count({ where: { postId: commentsPostId } }),
      ]);

      res.json({ success: true, data: comments, pagination: { page, limit, total } });
    } catch (err) {
      console.error('getComments error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
  },

  async addComment(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      const addCommentPostId = paramId(req);
      const post = await prisma.communityPost.findUnique({ where: { id: addCommentPostId } });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const comment = await prisma.communityComment.create({
        data: {
          postId: addCommentPostId,
          authorId: req.user!.id,
          content: content.trim(),
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.json({ success: true, data: comment });
    } catch (err) {
      console.error('addComment error:', err);
      res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
  },

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const deleteCommentId = paramId(req);
      const comment = await prisma.communityComment.findUnique({
        where: { id: deleteCommentId },
        select: { authorId: true },
      });
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

      const isAdmin = req.user!.role === 'ADMIN';
      if (comment.authorId !== req.user!.id && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await prisma.communityComment.delete({ where: { id: deleteCommentId } });
      res.json({ success: true, message: 'Comment deleted' });
    } catch (err) {
      console.error('deleteComment error:', err);
      res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
  },
};
