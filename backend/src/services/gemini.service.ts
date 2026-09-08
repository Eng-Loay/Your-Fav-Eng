import { createHash } from 'crypto';
import { env } from '../config/env';
import { tryGetRedis } from '../lib/redis';

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const COOLDOWN_MS = 60_000;
const BACKOFF_MS = 1500;
const COOLDOWN_PREFIX = 'lms:gemini:cooldown:';

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

const keys = env.geminiApiKeys;
let rrIndex = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function keyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

async function isCooling(key: string): Promise<boolean> {
  const redis = tryGetRedis();
  if (!redis) return false;
  const value = await redis.get(`${COOLDOWN_PREFIX}${keyHash(key)}`);
  return Boolean(value);
}

async function markCooldown(key: string): Promise<void> {
  const redis = tryGetRedis();
  if (!redis) return;
  await redis.set(`${COOLDOWN_PREFIX}${keyHash(key)}`, '1', { ex: Math.ceil(COOLDOWN_MS / 1000) });
}

async function orderedKeys(): Promise<string[]> {
  const n = keys.length;
  const rotated: string[] = [];
  for (let i = 0; i < n; i++) rotated.push(keys[(rrIndex + i) % n]);
  rrIndex = n === 0 ? 0 : (rrIndex + 1) % n;
  const flags = await Promise.all(rotated.map(async (key) => ({ key, cooling: await isCooling(key) })));
  return [...flags.filter((k) => !k.cooling), ...flags.filter((k) => k.cooling)].map((k) => k.key);
}

async function requestWithKey(key: string, body: Record<string, unknown>): Promise<{ ok: true; data: any } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();
    if (!res.ok) {
      return { ok: false, status: res.status, message: data?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, status: 0, message: err?.message || 'network error' };
  }
}

async function callGemini(body: Record<string, unknown>): Promise<any> {
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const order = await orderedKeys();
  let lastMessage = '';

  for (const key of order) {
    const result = await requestWithKey(key, body);
    if (result.ok) return result.data;

    lastMessage = result.message;
    if (result.status === 429 || result.status === 503) {
      await markCooldown(key);
    }
  }

  await sleep(BACKOFF_MS);
  for (const key of order) {
    const result = await requestWithKey(key, body);
    if (result.ok) return result.data;
    lastMessage = result.message;
  }

  throw new Error(lastMessage || 'Gemini request failed');
}

function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts as Array<{ text?: string }> | undefined;
  return (parts || []).map((p) => p.text || '').join('').trim();
}

/** Chat reply grounded in a system instruction (lesson context) plus prior turns. */
export async function geminiChat(systemInstruction: string, history: GeminiMessage[]): Promise<string> {
  const data = await callGemini({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'LOW' },
    },
  });
  return extractText(data) || '...';
}

/** Structured JSON generation (used for quiz-question generation). */
export async function geminiJson<T>(systemInstruction: string, prompt: string, responseSchema: Record<string, unknown>): Promise<T> {
  const data = await callGemini({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      thinkingConfig: { thinkingLevel: 'LOW' },
    },
  });
  const text = extractText(data);
  return JSON.parse(text) as T;
}
