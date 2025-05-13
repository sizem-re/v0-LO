import type React from "react"
import type { Metadata } from "next/types"
import { BIZ_UDMincho, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { MainNav } from "../components/main-nav"
import { Footer } from "../components/footer"
import { AuthProvider } from "../lib/auth-context"
import { MiniAppDetector } from "../components/mini-app-detector"
import { DeepLinkHandler } from "../components/deep-link-handler"
import { WagmiClientProvider } from "../components/WagmiClientProvider"
import { FarcasterSDKInit } from "../components/farcaster-sdk-init"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const bizUDMincho = BIZ_UDMincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-biz-udmincho",
})

export const metadata: Metadata = {
  title: "LO - Local Recommendations",
  description: "Discover and share local recommendations with your friends",
  manifest: "/manifest.json",
  generator: 'v0.dev',
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: '/og-image.png',
      button: {
        title: 'Launch App',
        action: {
          type: 'launch_frame',
          name: 'v0-LO',
          url: '/',
          splashImageUrl: '/logo.png',
          splashBackgroundColor: '#000000'
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed client-side SDK initialization from here
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${bizUDMincho.variable} min-h-screen bg-white text-black font-sans`}>
        <FarcasterSDKInit />
        <WagmiClientProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <MiniAppDetector>
                <DeepLinkHandler />
                <div className="flex flex-col min-h-screen">
                  <MainNav />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </MiniAppDetector>
            </AuthProvider>
          </ThemeProvider>
        </WagmiClientProvider>
      </body>
    </html>
  )
}
