"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/lib/auth-context"
import { MiniAppDetector } from "@/components/mini-app-detector"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import { NeynarProviderWrapper } from "@/components/neynar-provider-wrapper"
import { MiniAppLoader } from "@/components/mini-app-loader"
import { MiniAppDebugPanel } from "@/components/mini-app-debug-panel"
import { ForceMiniApp } from "@/components/force-mini-app"
import { Suspense } from "react"

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {/* Process URL parameters first */}
      <Suspense fallback={null}>
        <ForceMiniApp />
      </Suspense>

      <NeynarProviderWrapper>
        <AuthProvider>
          <MiniAppLoader>
            <Suspense fallback={null}>
              <MiniAppDetector>
                <Suspense fallback={null}>
                  <DeepLinkHandler />
                </Suspense>
                <div className="flex flex-col min-h-screen">
                  <MainNav />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </MiniAppDetector>
            </Suspense>
          </MiniAppLoader>
        </AuthProvider>
      </NeynarProviderWrapper>

      {/* Client-side only component */}
      <Suspense fallback={null}>
        <MiniAppDebugPanel />
      </Suspense>
    </ThemeProvider>
  )
}
