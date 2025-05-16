"use client"

import type React from "react"
import { useEffect } from "react"
import { useFarcasterSDK } from "@/lib/farcaster-sdk-context"

export function MiniAppLoader({ children }: { children: React.ReactNode }) {
  const { isMiniApp, isLoaded, isReady, sendReady } = useFarcasterSDK()

  // Send ready signal after a short delay to ensure UI is stable
  useEffect(() => {
    if (!isMiniApp || !isLoaded || isReady) return

    const timer = setTimeout(() => {
      sendReady()
    }, 500)

    return () => clearTimeout(timer)
  }, [isMiniApp, isLoaded, isReady, sendReady])

  // If not in a mini app, just render children
  if (!isMiniApp) {
    return <>{children}</>
  }

  // If in a mini app but not ready yet, show a minimal loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Skeleton loader for the header */}
          <div className="h-8 w-24 bg-gray-200 mb-8 animate-pulse"></div>

          {/* Skeleton loader for content */}
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 w-full max-w-2xl animate-pulse"></div>
            <div className="h-64 bg-gray-200 w-full max-w-2xl animate-pulse"></div>
            <div className="h-12 bg-gray-200 w-full max-w-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  // App is ready, render children
  return <>{children}</>
}
