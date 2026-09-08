import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentsController } from './payments.controller';
import {
  createCheckoutSessionSchema,
  addToCartSchema,
  applyCouponSchema,
  checkoutCouponSchema,
  createPaymentRequestSchema,
} from './payments.validation';

const router = Router();

router.post(
  '/create-checkout-session',
  authenticate,
  validate(createCheckoutSessionSchema),
  paymentsController.createCheckoutSession
);

router.post('/webhook', paymentsController.webhook);

router.get('/my-orders', authenticate, paymentsController.getMyOrders);
router.get('/orders/:id', authenticate, paymentsController.getOrderById);
router.get('/order-by-session', authenticate, paymentsController.getOrderBySessionId);

router.get('/cart', authenticate, paymentsController.getCart);
router.post('/cart', authenticate, validate(addToCartSchema), paymentsController.addToCart);
router.delete('/cart/:id', authenticate, paymentsController.removeFromCart);
router.post('/cart/coupon', authenticate, validate(applyCouponSchema), paymentsController.applyCoupon);
router.post('/payment-request', authenticate, validate(createPaymentRequestSchema), paymentsController.createPaymentRequest);
router.post('/checkout-coupon', authenticate, validate(checkoutCouponSchema), paymentsController.checkoutWithCoupon);

export default router;
