import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ApiResponse } from '../../utils/apiResponse';
import { marketplaceService } from './marketplace.service';

export const marketplaceController = {
  async listProducts(req: AuthRequest, res: Response) {
    try {
      const result = await marketplaceService.listProducts(req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list products', 500);
    }
  },

  async getProduct(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await marketplaceService.getProduct(id);
      if (!product) return ApiResponse.notFound(res, 'Product not found');
      return ApiResponse.success(res, product);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to get product', 500);
    }
  },

  async createProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const product = await marketplaceService.createProduct(req.user.id, req.body);
      return ApiResponse.created(res, product, 'Product created');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create product', 500);
    }
  },

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await marketplaceService.updateProduct(
        id,
        req.user.id,
        req.user.role,
        req.body
      );
      if (!product) return ApiResponse.notFound(res, 'Product not found');
      return ApiResponse.success(res, product, 'Product updated');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to update product', 500);
    }
  },

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await marketplaceService.deleteProduct(id, req.user.id, req.user.role);
      if (!result) return ApiResponse.notFound(res, 'Product not found');
      return ApiResponse.success(res, null, 'Product deleted');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to delete product', 500);
    }
  },

  async orderProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { quantity = 1, address } = req.body;
      const order = await marketplaceService.orderProduct(id, req.user.id, quantity, address);
      if (!order) return ApiResponse.notFound(res, 'Product not found or out of stock');
      return ApiResponse.created(res, order, 'Order placed');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to place order', 500);
    }
  },

  async listMyProducts(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await marketplaceService.listMyProducts(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list products', 500);
    }
  },

  async listMyOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return ApiResponse.unauthorized(res);
      const result = await marketplaceService.listMyOrders(req.user.id, req.query);
      return ApiResponse.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to list orders', 500);
    }
  },
};
