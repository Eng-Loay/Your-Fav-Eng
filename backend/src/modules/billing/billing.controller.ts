import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { billingService } from './billing.service';

export const billingController = {
  async getMy(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const summary = await billingService.getMySummary(req.user.id);
      return ApiResponse.success(res, summary);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get billing summary', 500);
    }
  },

  async getMyTransactions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const { page, limit, total, data } = await billingService.getMyTransactions(
        req.user.id,
        req.query as Record<string, unknown>
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get transactions', 500);
    }
  },

  async listAdmin(req: AuthRequest, res: Response) {
    try {
      const { page, limit, total, data } = await billingService.listAdmin(
        req.query as Record<string, unknown>,
        {
          userId: req.query.userId as string | undefined,
          month: req.query.month as string | undefined,
        }
      );
      return ApiResponse.paginated(res, data, total, page, limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list billing records', 500);
    }
  },

  async generateBilling(req: AuthRequest, res: Response) {
    try {
      const record = await billingService.generateBilling(req.body);
      if (!record) return ApiResponse.badRequest(res, 'Teacher not found or has no profile');
      return ApiResponse.created(res, record, 'Billing record generated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to generate billing', 500);
    }
  },

  async getPricingTiers(_req: AuthRequest, res: Response) {
    try {
      const tiers = await billingService.getPricingTiers();
      return ApiResponse.success(res, tiers);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get pricing tiers', 500);
    }
  },

  async createPricingTier(req: AuthRequest, res: Response) {
    try {
      const tier = await billingService.createPricingTier(req.body);
      return ApiResponse.created(res, tier, 'Pricing tier created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create pricing tier', 500);
    }
  },

  async updatePricingTier(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const tier = await billingService.updatePricingTier(id, req.body);
      return ApiResponse.success(res, tier, 'Pricing tier updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update pricing tier', 500);
    }
  },

  async deletePricingTier(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await billingService.deletePricingTier(id);
      return ApiResponse.success(res, null, 'Pricing tier deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete pricing tier', 500);
    }
  },
};
