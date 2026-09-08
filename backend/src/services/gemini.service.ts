import { env } from '../config/env';

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const COOLDOWN_MS = 60_000; // how long a rate-limited key is skipped before being retried
const BACKOFF_MS = 1500; // pause before one final pass across all keys if every key failed

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

interface KeyState {
  key: string;
  cooldownUntil: number;
}

// Round-robins across every configured key so load spreads evenly, and skips any key
// that recently hit a 429 (rate limit) until its cooldown passes — so students transparently
// fall over to the next free-tier project instead of seeing a hard failure.
const keyStates: KeyState[] = env.geminiApiKeys.map((key) => ({ key, cooldownUntil: 0 }));
let rrIndex = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Keys ordered starting from the next round-robin slot, available (not cooling down) ones first. */
function orderedKeys(): KeyState[] {
  const n = keyStates.length;
  const rotated: KeyState[] = [];
  for (let i = 0; i < n; i++) rotated.push(keyStates[(rrIndex + i) % n]);
  rrIndex = (rrIndex + 1) % n;

  const now = Date.now();
  const available = rotated.filter((k) => k.cooldownUntil <= now);
  const cooling = rotated.filter((k) => k.cooldownUntil > now);
  return [...available, ...cooling];
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
  if (keyStates.length === 0) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const order = orderedKeys();
  let lastMessage = '';

  for (const state of order) {
    const result = await requestWithKey(state.key, body);
    if (result.ok) return result.data;

    lastMessage = result.message;
    if (result.status === 429 || result.status === 503) {
      state.cooldownUntil = Date.now() + COOLDOWN_MS;
    }
    // any other error (bad key, malformed request) — just try the next key too
  }

  // Every key failed on the first pass (likely all rate-limited at once) — one short
  // backoff, then a single retry pass in case cooldowns were overly cautious.
  await sleep(BACKOFF_MS);
  for (const state of order) {
    const result = await requestWithKey(state.key, body);
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
