import 'framer-motion'

declare module 'framer-motion' {
  // Upstream pages pass string / number[] easings that Framer's Variants reject.
  export type Variants = Record<string, unknown>
}
