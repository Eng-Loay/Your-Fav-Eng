import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { marketplaceController } from './marketplace.controller';
import { z } from 'zod';

const router = Router();

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  type: z.enum(['DIGITAL', 'PHYSICAL']).optional(),
  category: z.string().optional(),
  thumbnail: z.string().optional(),
  fileUrl: z.string().optional(),
  stock: z.number().int().min(0).optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  status: z.string().optional(),
});

const orderProductSchema = z.object({
  quantity: z.number().int().min(1).default(1),
  address: z.record(z.unknown()).optional(),
});

const sellerAuth = [authenticate, authorize('TEACHER')];

router.get('/products', marketplaceController.listProducts);
router.get('/products/:id', marketplaceController.getProduct);
router.post(
  '/products',
  ...sellerAuth,
  validate(createProductSchema),
  marketplaceController.createProduct
);
router.put(
  '/products/:id',
  ...sellerAuth,
  validate(updateProductSchema),
  marketplaceController.updateProduct
);
router.delete('/products/:id', ...sellerAuth, marketplaceController.deleteProduct);
router.post(
  '/products/:id/order',
  authenticate,
  validate(orderProductSchema),
  marketplaceController.orderProduct
);
router.get('/my-products', ...sellerAuth, marketplaceController.listMyProducts);
router.get('/my-orders', authenticate, marketplaceController.listMyOrders);

export default router;
