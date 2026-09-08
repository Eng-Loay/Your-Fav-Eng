import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

let restClient: Redis | null = null;
let subscriber: IORedis | null = null;
const handlers = new Map<string, Set<(payload: unknown) => void>>();

export function getRedisProtocolUrl(): string | null {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.UPSTASH_REDIS_URL) return process.env.UPSTASH_REDIS_URL;
  const rest = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!rest || !token) return null;
  try {
    const host = new URL(rest).host;
    return `rediss://default:${encodeURIComponent(token)}@${host}:6379`;
  } catch {
    return null;
  }
}

export function hasRedisRest(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

export function getRedis(): Redis {
  if (restClient) return restClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('Upstash Redis REST credentials are not configured');
  }
  restClient = new Redis({ url, token });
  return restClient;
}

export function tryGetRedis(): Redis | null {
  try {
    if (!hasRedisRest()) return null;
    return getRedis();
  } catch {
    return null;
  }
}

export async function publishChannel(channel: string, payload: unknown): Promise<void> {
  const rest = tryGetRedis();
  if (rest) {
    await rest.publish(channel, JSON.stringify(payload));
    return;
  }
  // Local-dev fallback: fan out in-process when Redis is not provisioned.
  const set = handlers.get(channel);
  if (!set) return;
  for (const handler of set) handler(payload);
}

export function subscribeChannel(channel: string, handler: (payload: unknown) => void): void {
  let set = handlers.get(channel);
  if (!set) {
    set = new Set();
    handlers.set(channel, set);
  }
  set.add(handler);
  if (subscriber) {
    void subscriber.subscribe(channel);
    return;
  }
  void ensureSubscriber();
}

async function ensureSubscriber(): Promise<void> {
  if (subscriber) return;
  const url = getRedisProtocolUrl();
  if (!url) return;

  subscriber = new IORedis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    tls: {},
    lazyConnect: false,
  });

  const channels = [...handlers.keys()];
  if (channels.length > 0) {
    await subscriber.subscribe(...channels);
  }

  subscriber.on('message', (channel, message) => {
    const set = handlers.get(channel);
    if (!set) return;
    let payload: unknown = message;
    try {
      payload = JSON.parse(message);
    } catch {
      // keep raw string
    }
    for (const handler of set) handler(payload);
  });

  subscriber.on('error', (err) => {
    console.error('[redis-sub]', err.message);
  });
}

export const REDIS_CHANNELS = {
  messages: 'lms:messages',
  games: 'lms:games',
} as const;
