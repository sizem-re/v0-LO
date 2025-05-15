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
import Script from "next/script"

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
  version: "vNext",
  image: "https://llllllo.com/og-image.png", // Replace with your actual OG image URL
  buttons: [
    {
      label: "🗺️ Explore Places",
      action: "post_redirect",
    },
  ],
  post_url: "https://llllllo.com",
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
        <Script
          id="farcaster-ready"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Simple script to signal ready to Farcaster
              (function() {
                function signalReady() {
                  try {
                    if (window.parent && window.parent !== window) {
                      console.log("Signaling ready to parent frame");
                      window.parent.postMessage({ type: "ready" }, "*");
                    }
                    
                    if (window.farcaster && typeof window.farcaster.ready === 'function') {
                      console.log("Calling farcaster.ready()");
                      window.farcaster.ready();
                    }
                  } catch (e) {
                    console.error("Error signaling ready:", e);
                  }
                }
                
                // Signal ready after a short delay to ensure content is loaded
                setTimeout(signalReady, 1000);
                
                // Also signal ready when the page is fully loaded
                window.addEventListener('load', signalReady);
              })();
            `,
          }}
        />
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
