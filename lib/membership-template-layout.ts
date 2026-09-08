/**
 * Fixed layout for membership-template.png (2480 × 3508 px).
 * Each field has its own band — no shared/overlapping masks.
 */
export const MEMBERSHIP_TEMPLATE_LAYOUT = {
  width: 2480,
  height: 3508,
  /** Red box with baked-in CGS-2025-24041 (y ≈ 1118–1200, not the label above) */
  certCode: { cx: 1544, top: 1118, bottom: 1200, maxWidth: 1482, fontSize: 8, color: "#ffffff" },
  /** (NAME) placeholder — wide band x ≈ 1030–2285 */
  memberName: { cx: 1658, top: 1645, bottom: 1745, maxWidth: 1270, fontSize: 30, color: "#1345D6" },
  /** Between red vertical bars — starts after body paragraph (ends ~y 2170) */
  packageLine: { cx: 1240, top: 2378, bottom: 2448, maxWidth: 1580, fontSize: 17, color: "#1a1a1a" },
  trainingLine: { cx: 1240, top: 2503, bottom: 2570, maxWidth: 1580, fontSize: 15, color: "#333333" },
  issuedDate: { x: 570, top: 3030, fontSize: 9, color: "#333333" },
} as const

export const BRAND_RED_RGB = { r: 0.545, g: 0.102, b: 0.102 } as const
