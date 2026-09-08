import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  items: z.array(
    z.object({
      courseId: z.string().uuid().optional(),
      chapterId: z.string().uuid().optional(),
      bundleId: z.string().uuid().optional(),
      productId: z.string().uuid().optional(),
      quantity: z.number().int().min(1).optional(),
    })
  ).min(1, 'At least one item required'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponCode: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export const addToCartSchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).optional(),
}).refine((data) => data.courseId || data.chapterId || data.productId, {
  message: 'Must provide courseId, chapterId, or productId',
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
});

export const checkoutCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  items: z.array(
    z.object({
      courseId: z.string().optional(),
      productId: z.string().optional(),
      quantity: z.number().int().min(1).optional(),
    }).refine((d) => d.courseId || d.productId, { message: 'courseId or productId required' })
  ).optional(),
});

export const createPaymentRequestSchema = z.object({
  items: z.array(
    z.object({
      courseId: z.string().min(1).optional(),
      productId: z.string().min(1).optional(),
    }).refine((d) => d.courseId || d.productId, { message: 'courseId or productId required' })
  ).min(1, 'At least one item required'),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
