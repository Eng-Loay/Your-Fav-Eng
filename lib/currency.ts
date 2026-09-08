/**
 * Platform currency - unified formatting across the site.
 * Currency is fetched from platform settings (Admin Panel > General > Currency).
 */

import { getApiBase } from './api';

export const CURRENCY_SYMBOLS: Record<string, { symbol: string; position: 'before' | 'after'; locale?: string }> = {
  USD: { symbol: '$', position: 'before' },
  SAR: { symbol: '﷼', position: 'after' },
  AED: { symbol: 'د.إ', position: 'before' },
  EGP: { symbol: 'ج.م', position: 'after' },
  EUR: { symbol: '€', position: 'before' },
  GBP: { symbol: '£', position: 'before' },
};

let cachedCurrency: string | null = null;

export async function fetchPlatformCurrency(): Promise<string> {
  if (typeof window === 'undefined') return 'USD';
  if (cachedCurrency) return cachedCurrency;

  try {
    const res = await fetch(`${getApiBase()}/settings/public`);
    const json = await res.json();
    if (json.success && json.data?.currency) {
      cachedCurrency = json.data.currency;
      return cachedCurrency;
    }
  } catch {
    // ignore
  }
  return 'USD';
}

export function clearCurrencyCache() {
  cachedCurrency = null;
}

export function formatCurrency(amount: number, currencyCode?: string | null): string {
  const code = (currencyCode || cachedCurrency || 'USD').toUpperCase();
  const config = CURRENCY_SYMBOLS[code] || CURRENCY_SYMBOLS.USD;
  const formatted = amount.toLocaleString(config.locale || 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted} ${config.symbol}`;
}

export function getCurrencySymbol(currencyCode?: string): string {
  const code = currencyCode || cachedCurrency || 'USD';
  return CURRENCY_SYMBOLS[code]?.symbol ?? '$';
}
