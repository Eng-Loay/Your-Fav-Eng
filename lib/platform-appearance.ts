/**
 * Platform appearance - colors, font, button style.
 * Fetched from API and injected as CSS variables for site-wide theming.
 */

import { getApiBase } from './api';

export interface PlatformAppearance {
  primary_color: string;
  secondary_color: string;
  font: string;
  button_style: string;
}

const DEFAULTS: PlatformAppearance = {
  primary_color: '#000000',
  secondary_color: '#ffffff',
  font: 'Inter',
  button_style: 'rounded-xl',
};

let cachedAppearance: PlatformAppearance | null = null;

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 255) * (1 - percent / 100));
  const g = Math.max(0, ((num >> 8) & 255) * (1 - percent / 100));
  const b = Math.max(0, (num & 255) * (1 - percent / 100));
  return '#' + (0x1000000 + Math.round(r) * 0x10000 + Math.round(g) * 0x100 + Math.round(b)).toString(16).slice(1);
}

export async function fetchPlatformAppearance(): Promise<PlatformAppearance> {
  if (typeof window === 'undefined') return DEFAULTS;
  if (cachedAppearance) return cachedAppearance;

  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${getApiBase()}/settings/appearance`, { signal: ctrl.signal });
      clearTimeout(id);
      if (!res.ok) return DEFAULTS;
      const json = await res.json();
      if (json.success && json.data && typeof json.data === 'object') {
        cachedAppearance = {
          primary_color: json.data.primary_color || DEFAULTS.primary_color,
          secondary_color: json.data.secondary_color || DEFAULTS.secondary_color,
          font: json.data.font || DEFAULTS.font,
          button_style: json.data.button_style || DEFAULTS.button_style,
        };
        return cachedAppearance;
      }
    } finally {
      clearTimeout(id);
    }
  } catch {
    // ignore - API may be unavailable or timeout
  }
  return DEFAULTS;
}

export function applyAppearanceToDocument(app: PlatformAppearance) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const primary = app.primary_color;
  const secondary = app.secondary_color;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-hover', darkenHex(primary, 8));
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-hover', darkenHex(secondary, 8));
  root.style.setProperty('--color-primary-rgb', hexToRgb(primary));
  root.style.setProperty('--color-secondary-rgb', hexToRgb(secondary));
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '37, 99, 235'; // fallback blue
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export function clearAppearanceCache() {
  cachedAppearance = null;
}

export function getDefaultAppearance(): PlatformAppearance {
  return { ...DEFAULTS };
}
