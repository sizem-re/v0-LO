"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useMiniApp } from "@/hooks/use-mini-app"

export function MiniAppLoader({ children }: { children: React.ReactNode }) {
  const { isMiniApp } = useMiniApp()
  const [isReady, setIsReady] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  // Load the SDK dynamically only in client-side and only if in a mini app
  useEffect(() => {
    if (!isMiniApp) return

    const loadSdk = async () => {
      try {
        // Dynamically import the SDK only when needed
        const { sdk } = await import("@farcaster/frame-sdk")
        setSdkLoaded(true)

        // Wait a bit to ensure UI is stable before calling ready
        setTimeout(async () => {
          try {
            await sdk.actions.ready()
            console.log("Mini App ready signal sent")
          } catch (error) {
            console.error("Error calling ready:", error)
          }
          setIsReady(true)
        }, 500)
      } catch (error) {
        console.error("Error loading Frame SDK:", error)
        setIsReady(true) // Continue anyway to not block the UI
      }
    }

    loadSdk()
  }, [isMiniApp])

  // If not in a mini app, just render children
  if (!isMiniApp) {
    return <>{children}</>
  }

  // If in a mini app but not ready yet, show a minimal loading state
  // This is intentionally minimal to avoid content reflows
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
