import React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { inter, cairo, montserrat, spaceGrotesk } from "@/lib/fonts"
import { I18nProvider } from "@/lib/i18n"
import { StoreProvider } from "@/lib/store"
import { AppearanceProvider } from "@/components/providers/AppearanceProvider"
import { MotionProvider } from "@/components/providers/MotionProvider"
import { GlobalToast } from "@/components/ui/global-toast"
import { MobileBottomNavClient } from "@/components/ui/mobile-bottom-nav-client"
import { MarketingSurfaceProvider } from "@/components/providers/MarketingSurfaceProvider"

export const metadata: Metadata = {
  title: "Eng. Loay Essam | Your Fav Engineer",
  description:
    "Learn Programming & AI with Eng. Loay Essam — courses, resources, and mentorship for high-school students and beyond.",
  icons: {
    icon: "/le-logo.png",
    shortcut: "/le-logo.png",
    apple: "/le-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${cairo.variable} ${spaceGrotesk.variable} ${montserrat.variable}`}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <I18nProvider>
          <StoreProvider>
            <MotionProvider>
              <AppearanceProvider>
                <MarketingSurfaceProvider>
                  {children}
                </MarketingSurfaceProvider>
                <GlobalToast />
                <MobileBottomNavClient />
              </AppearanceProvider>
            </MotionProvider>
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
