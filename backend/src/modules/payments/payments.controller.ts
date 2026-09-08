import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { paymentsService } from './payments.service';

export const paymentsController = {
  async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await paymentsService.createCheckoutSession(req.user.id, req.body);
      return ApiResponse.success(res, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      return ApiResponse.badRequest(res, message);
    }
  },

  async webhook(req: AuthRequest, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) return ApiResponse.badRequest(res, 'Missing stripe-signature header');

      const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? (Buffer.isBuffer(req.body) ? req.body : null);
      if (!rawBody) return ApiResponse.badRequest(res, 'Raw body required for webhook verification. Use express.raw() for this route.');

      await paymentsService.handleWebhook(rawBody, signature);
      return ApiResponse.success(res, { received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook failed';
      return ApiResponse.error(res, message, 400);
    }
  },

  async getMyOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { page, limit, total, data } = await paymentsService.getMyOrders(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get orders', 500);
    }
  },

  async getOrderById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await paymentsService.getOrderById(id, req.user.id, req.user.role);
      if (!order) return ApiResponse.notFound(res, 'Order not found');
      return ApiResponse.success(res, order);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get order', 500);
    }
  },

  async getOrderBySessionId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const sessionId = req.query.session_id as string;
      if (!sessionId) return ApiResponse.badRequest(res, 'session_id required');
      const order = await paymentsService.getOrderBySessionId(sessionId, req.user.id);
      if (!order) return ApiResponse.notFound(res, 'Order not found');
      return ApiResponse.success(res, order);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get order', 500);
    }
  },

  async getCart(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const cart = await paymentsService.getCart(req.user.id);
      return ApiResponse.success(res, cart);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get cart', 500);
    }
  },

  async addToCart(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const item = await paymentsService.addToCart(req.user.id, req.body);
      return ApiResponse.created(res, item, 'Item added to cart');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      return ApiResponse.badRequest(res, message);
    }
  },

  async removeFromCart(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await paymentsService.removeFromCart(req.user.id, id);
      if (!result) return ApiResponse.notFound(res, 'Cart item not found');
      return ApiResponse.success(res, null, 'Item removed from cart');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to remove from cart', 500);
    }
  },

  async applyCoupon(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await paymentsService.applyCoupon(req.user.id, req.body.code);
      if (!result.valid) return ApiResponse.badRequest(res, result.message);
      return ApiResponse.success(res, result);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to apply coupon', 500);
    }
  },

  async createPaymentRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return ApiResponse.badRequest(res, 'Items required');
      }
      const mappedItems = items
        .filter((i: unknown) => i && typeof i === 'object')
        .map((i: { courseId?: string; productId?: string }) => ({
          courseId: typeof (i as { courseId?: unknown }).courseId === 'string' ? (i as { courseId: string }).courseId : undefined,
          productId: typeof (i as { productId?: unknown }).productId === 'string' ? (i as { productId: string }).productId : undefined,
        }))
        .filter((x) => x.courseId || x.productId);
      if (mappedItems.length === 0) return ApiResponse.badRequest(res, 'Valid items (courseId or productId) required');
      const result = await paymentsService.createPaymentRequest(req.user.id, mappedItems);
      return ApiResponse.success(res, result, 'Request submitted. Awaiting admin approval.');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create payment request', 500);
    }
  },

  async checkoutWithCoupon(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { code, items: bodyItems } = req.body;
      if (!code || typeof code !== 'string') return ApiResponse.badRequest(res, 'Coupon code required');
      const result = await paymentsService.checkoutWithCoupon(req.user.id, code, bodyItems);
      return ApiResponse.success(res, result, 'Purchase completed with coupon');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Coupon checkout failed';
      return ApiResponse.badRequest(res, message);
    }
  },
};
