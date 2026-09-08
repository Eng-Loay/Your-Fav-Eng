/**
 * Central platform configuration - single source of truth for:
 * - Platform name
 * - Logo
 * - Header & Footer colors (fixed)
 * - Contact info (phone, email, address)
 * - Social media links
 *
 * Values are fetched from API and can be managed from Admin Panel.
 */

import { getApiBase, fetchWithTimeout, isBackendMarkedDown } from './api';
import { IAGRCP_BRAND } from './brand-assets';

export interface PlatformBranding {
  platformName: string;
  logo: string;
  headerColor: string;
  footerColor: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialYoutube: string;
  socialFacebook: string;
  socialInstagram: string;
}

const DEFAULTS: PlatformBranding = {
  platformName: 'Eng. Loay Essam',
  logo: IAGRCP_BRAND.logo.primary,
  headerColor: '#FFFFFF',
  footerColor: IAGRCP_BRAND.colors.primary,
  contactPhone: IAGRCP_BRAND.contact.phone,
  contactEmail: IAGRCP_BRAND.contact.email,
  contactAddress: IAGRCP_BRAND.contact.address,
  socialTwitter: '',
  socialLinkedin: IAGRCP_BRAND.contact.linkedin,
  socialYoutube: '',
  socialFacebook: IAGRCP_BRAND.contact.facebook,
  socialInstagram: '',
};

let cachedBranding: PlatformBranding | null = null;

export async function fetchPlatformBranding(): Promise<PlatformBranding> {
  if (typeof window === 'undefined') return DEFAULTS;
  if (cachedBranding) return cachedBranding;
  if (isBackendMarkedDown()) return DEFAULTS;

  try {
    const res = await fetchWithTimeout(`${getApiBase()}/settings/branding`, undefined, 4000);
    const json = await res.json();
    if (json.success && json.data && typeof json.data === 'object') {
      const apiName = (json.data.platformName || '').trim();
      if (apiName.toLowerCase() === 'scholigo') {
        cachedBranding = { ...DEFAULTS };
        return cachedBranding;
      }
      cachedBranding = {
        platformName: json.data.platformName || DEFAULTS.platformName,
        logo: json.data.logo || DEFAULTS.logo,
        headerColor: json.data.headerColor || DEFAULTS.headerColor,
        footerColor: json.data.footerColor || DEFAULTS.footerColor,
        contactPhone: json.data.contactPhone || DEFAULTS.contactPhone,
        contactEmail: json.data.contactEmail || DEFAULTS.contactEmail,
        contactAddress: json.data.contactAddress || DEFAULTS.contactAddress,
        socialTwitter: json.data.socialTwitter || DEFAULTS.socialTwitter,
        socialLinkedin: json.data.socialLinkedin || DEFAULTS.socialLinkedin,
        socialYoutube: json.data.socialYoutube || DEFAULTS.socialYoutube,
        socialFacebook: json.data.socialFacebook || DEFAULTS.socialFacebook,
        socialInstagram: json.data.socialInstagram || DEFAULTS.socialInstagram,
      };
      return cachedBranding;
    }
  } catch {
    // API timeout or unavailable — use defaults immediately
  }
  return DEFAULTS;
}

export function clearBrandingCache() {
  cachedBranding = null;
}

export function getDefaultBranding(): PlatformBranding {
  return { ...DEFAULTS };
}
