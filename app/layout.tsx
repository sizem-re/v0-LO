import type React from "react"
import type { Metadata } from "next"
import { Inter, BIZ_UDMincho } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NeynarProviderWrapper } from "@/components/neynar-provider-wrapper"
import { WelcomeModal } from "@/components/welcome-modal"

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
  title: "LO - Discover Places",
  description: "Discover and share curated lists of locations",
  manifest: "/manifest.json",
  generator: "v0.dev",
  openGraph: {
    title: "LO - Discover Places",
    description: "Discover and share curated lists of locations",
    images: [
      {
        url: "https://llllllo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "LO - Places picked by people, not algorithms"
      }
    ],
    type: "website",
    url: "https://llllllo.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "LO - Discover Places",
    description: "Discover and share curated lists of locations",
    site: "@llllllo"
  }
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
      </head>
      <body className={`${inter.variable} ${bizUDMincho.variable} min-h-screen bg-white text-black font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NeynarProviderWrapper>
            <AuthProvider>
              {children}
              <WelcomeModal />
            </AuthProvider>
          </NeynarProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
