import { Ratelimit } from '@upstash/ratelimit';
import type { RequestHandler } from 'express';
import { tryGetRedis } from './redis';
import { env } from '../config/env';

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const redis = tryGetRedis();
  if (!redis) {
    limiter = null;
    return null;
  }
  const max = env.nodeEnv === 'production' ? 1000 : 5000;
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, '15 m'),
    prefix: 'lms:rl',
    analytics: false,
  });
  return limiter;
}

export const redisRateLimit: RequestHandler = async (req, res, next) => {
  const rl = getLimiter();
  if (!rl) {
    if (process.env.VERCEL === '1') {
      console.warn('[ratelimit] Redis not configured; allowing request');
    }
    next();
    return;
  }

  const ip =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    'unknown';

  try {
    const { success, reset } = await rl.limit(ip);
    res.setHeader('X-RateLimit-Reset', String(reset));
    if (!success) {
      res.status(429).json({ success: false, message: 'Too many requests' });
      return;
    }
    next();
  } catch (err) {
    console.error('[ratelimit]', err);
    next();
  }
};
