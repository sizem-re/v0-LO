import type React from "react"
import type { Metadata } from "next/types"
import { BIZ_UDMincho, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/lib/auth-context"
import { MiniAppDetector } from "@/components/mini-app-detector"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import { NeynarProviderWrapper } from "@/components/neynar-provider-wrapper"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const bizUDMincho = BIZ_UDMincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-biz-udmincho",
})

// Create the Farcaster frame embed JSON
const farcasterFrameEmbed = {
  version: "next",
  imageUrl: "https://llllllo.com/og-image.png", // Replace with your actual OG image URL
  button: {
    title: "🗺️ Explore Places",
    action: {
      type: "launch_frame",
      name: "LO",
      url: "https://llllllo.com",
      splashImageUrl: "https://llllllo.com/splash.png", // Replace with your actual splash image
      splashBackgroundColor: "#ffffff",
    },
  },
}

export const metadata: Metadata = {
  title: "LO - Discover Places",
  description: "Discover and share curated lists of locations",
  manifest: "/manifest.json",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/.well-known/farcaster.json" />
        <meta name="fc:frame" content={JSON.stringify(farcasterFrameEmbed)} />
      </head>
      <body className={`${inter.variable} ${bizUDMincho.variable} min-h-screen bg-white text-black font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NeynarProviderWrapper>
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
          </NeynarProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
