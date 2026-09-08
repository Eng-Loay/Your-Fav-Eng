import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { billingController } from './billing.controller';
import {
  generateBillingSchema,
  createPricingTierSchema,
  updatePricingTierSchema,
  listBillingAdminQuerySchema,
} from './billing.validation';

const router = Router();

router.get('/my', authenticate, billingController.getMy);
router.get('/my/transactions', authenticate, billingController.getMyTransactions);

router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validateQuery(listBillingAdminQuerySchema),
  billingController.listAdmin
);

router.post(
  '/admin/generate',
  authenticate,
  authorize('ADMIN'),
  validate(generateBillingSchema),
  billingController.generateBilling
);

router.get('/pricing-tiers', billingController.getPricingTiers);

router.post(
  '/pricing-tiers',
  authenticate,
  authorize('ADMIN'),
  validate(createPricingTierSchema),
  billingController.createPricingTier
);

router.put(
  '/pricing-tiers/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updatePricingTierSchema),
  billingController.updatePricingTier
);

router.delete(
  '/pricing-tiers/:id',
  authenticate,
  authorize('ADMIN'),
  billingController.deletePricingTier
);

export default router;
