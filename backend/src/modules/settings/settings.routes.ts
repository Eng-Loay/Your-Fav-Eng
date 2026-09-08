import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

/** Public endpoint - no auth required. Returns branding settings for the frontend. */
router.get('/branding', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { group: 'branding' },
    });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return ApiResponse.success(res, result);
  } catch (error) {
    console.error('Failed to get branding settings:', error);
    return ApiResponse.error(res, 'Failed to get settings', 500);
  }
});

/** Public endpoint - returns currency and other display settings from general. */
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { group: 'general' },
    });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    const currency = result.currency || result.currency_code || 'USD';
    return ApiResponse.success(res, { currency, ...result });
  } catch (error) {
    console.error('Failed to get public settings:', error);
    return ApiResponse.error(res, 'Failed to get settings', 500);
  }
});

/** Public endpoint - returns all active categories with hierarchy. Optional ?service=platform or ?service=store */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const service = req.query.service as string | undefined;
    const where: Record<string, unknown> = { status: 'active' };
    if (service) where.service = service;

    const categories = await prisma.category.findMany({
      where: { ...where, parentId: null },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        children: {
          where: { status: 'active' },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            service: true,
            icon: true,
            position: true,
          },
        },
      },
    });
    return ApiResponse.success(res, categories);
  } catch (error) {
    console.error('Failed to get categories:', error);
    return ApiResponse.error(res, 'Failed to get categories', 500);
  }
});

/** Public endpoint - returns store_enabled status */
router.get('/store-status', async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'store_enabled' },
    });
    return ApiResponse.success(res, { enabled: setting?.value === 'true' });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get store status', 500);
  }
});

/** Public endpoint - returns instructors/teachers feature enabled. Defaults to true when not set. */
router.get('/instructors-status', async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'instructors_enabled' },
    });
    const enabled = setting ? setting.value === 'true' : true;
    return ApiResponse.success(res, { enabled });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get instructors status', 500);
  }
});

/** Public endpoint - returns chat (messages + communities) enabled. Defaults to true. */
router.get('/chat-status', async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'chat_enabled' },
    });
    const enabled = setting ? setting.value === 'true' : true;
    return ApiResponse.success(res, { enabled });
  } catch (error) {
    console.error('Failed to get chat status:', error);
    return ApiResponse.error(res, 'Failed to get chat status', 500);
  }
});

/** Public endpoint - returns video watermark (student phone) enabled. Defaults to false. */
router.get('/video-watermark-status', async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'video_watermark_enabled' },
    });
    const enabled = setting ? setting.value === 'true' : false;
    return ApiResponse.success(res, { enabled });
  } catch (error) {
    console.error('Failed to get video watermark status:', error);
    return ApiResponse.error(res, 'Failed to get video watermark status', 500);
  }
});

/** Public endpoint - returns enabled payment methods for checkout */
router.get('/payment-methods', async (_req: Request, res: Response) => {
  try {
    const keys = ['stripe_enabled', 'paypal_enabled', 'tap_enabled', 'admin_approval_enabled', 'coupon_enabled'];
    const settings = await prisma.platformSetting.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, boolean> = {};
    for (const s of settings) result[s.key] = s.value === 'true';
    return ApiResponse.success(res, {
      stripe: result.stripe_enabled !== false,
      paypal: result.paypal_enabled === true,
      tap: result.tap_enabled !== false,
      adminApproval: result.admin_approval_enabled !== false,
      coupon: result.coupon_enabled !== false,
    });
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    return ApiResponse.error(res, 'Failed to get payment methods', 500);
  }
});

/** Public endpoint - returns appearance (colors, font, button style) for frontend theming */
router.get('/appearance', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { group: 'appearance' },
    });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return ApiResponse.success(res, {
      primary_color: result.primary_color || '#2563EB',
      secondary_color: result.secondary_color || '#f65404',
      font: result.font || 'Cairo',
      button_style: result.button_style || 'rounded-xl',
    });
  } catch (error) {
    console.error('Failed to get appearance settings:', error);
    return ApiResponse.error(res, 'Failed to get settings', 500);
  }
});

/** Public endpoint - returns support contact info */
router.get('/support-info', async (_req: Request, res: Response) => {
  try {
    const keys = ['support_email', 'support_phone', 'platform_name'];
    const settings = await prisma.platformSetting.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    if (!result.support_email) result.support_email = 'support@platform.com';
    if (!result.support_phone) result.support_phone = '+1 (555) 000-0000';
    return ApiResponse.success(res, result);
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get support info', 500);
  }
});

/** Public endpoint - returns active services and bundles for homepage. */
router.get('/services-bundles', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.content.findMany({
      where: {
        type: { in: ['SERVICE', 'BUNDLE'] },
        status: 'active',
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    const mapped = items.map((item) => {
      let meta: { price?: number | null; ctaUrl?: string | null } = {};
      try {
        meta = item.author ? JSON.parse(item.author) : {};
      } catch {}
      return {
        id: item.id,
        kind: item.type,
        title: item.title,
        titleAr: item.titleAr,
        description: item.content,
        descriptionAr: item.contentAr,
        image: item.image,
        position: item.position,
        price: typeof meta.price === 'number' ? meta.price : null,
        ctaUrl: meta.ctaUrl || null,
      };
    });
    return ApiResponse.success(res, mapped);
  } catch (error) {
    console.error('Failed to get services and bundles:', error);
    return ApiResponse.error(res, 'Failed to get services and bundles', 500);
  }
});

export default router;
