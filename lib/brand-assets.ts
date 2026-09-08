/**
 * IAGRCP brand assets downloaded from Google Drive
 * Source: https://drive.google.com/drive/folders/18-z9YcHAhb0t7ChixVGzdCpQi4KZF_P2
 */

export const IAGRCP_BRAND = {
  colors: {
    primary: '#1345D6',
    primaryDark: '#0B2F8C',
    primaryLight: '#3D74F2',
    black: '#1A1A1A',
    white: '#FFFFFF',
    grey: '#9CA3AF',
  },
  logo: {
    primary: '/le-logo.png',
    white: '/le-logo-white.png',
    black: '/brand/logo/png/lagrcp-black.png',
    colorsGuide: '/brand/logo/png/colors.png',
  },
  diploma: {
    cover: '/brand/diploma/cover.png',
    closing: '/brand/diploma/closing.png',
    pdf: '/brand/diploma/advanced-governance-diploma.pdf',
    mockups: [
      '/brand/diploma/mockup/1.png',
      '/brand/diploma/mockup/2.png',
    ] as const,
    /** All slides from Google Drive — بروفايل دبلومه الحوكمه/png */
    profileSlides: [
      '/brand/diploma/png/1.png',
      '/brand/diploma/png/2.png',
      '/brand/diploma/png/3.png',
      '/brand/diploma/png/4.png',
      '/brand/diploma/png/5.png',
      '/brand/diploma/png/6.png',
      '/brand/diploma/png/7.png',
      '/brand/diploma/png/8.png',
      '/brand/diploma/png/8-copy.png',
      '/brand/diploma/png/8-before-certificates.png',
      '/brand/diploma/png/9.png',
      '/brand/diploma/png/10.png',
      '/brand/diploma/png/11.png',
      '/brand/diploma/png/12.png',
      '/brand/diploma/png/13.png',
      '/brand/diploma/png/cover.png',
      '/brand/diploma/png/closing.png',
    ] as const,
  },
  certificates: {
    membershipTemplate: '/brand/certificates/membership-template.png',
    certificateTemplate: '/brand/certificates/certificate-template.png',
    newDesign: '/brand/certificates/new/1.png',
    associationCopy: '/brand/certificates/new/copy-international-association-5',
  },
  tagline:
    'Your Fav Engineer.',
  taglineAr: 'مهندسك المفضل.',
  contact: {
    email: 'essamloay2@gmail.com',
    phone: '01273587216',
    website: '',
    linkedin: 'https://www.linkedin.com/in/loay-essam/',
    facebook: 'https://www.facebook.com/lolo.3300/',
    address: 'الإسكندرية، العجمي',
  },
} as const;

/** Portrait poster assets (diploma covers, certificates) need top-weighted crop in cards */
export function isPortraitPosterAsset(src: string): boolean {
  return (
    src.includes("/brand/diploma/") ||
    src.includes("/brand/certificates/") ||
    /cover\.png|closing\.png|membership-template|certificate-template/i.test(src)
  )
}

export function portraitAwareObjectClass(src: string, base = "object-cover"): string {
  return isPortraitPosterAsset(src)
    ? `${base} object-[center_12%] sm:object-[center_16%]`
    : `${base} object-center`
}
