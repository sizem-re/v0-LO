"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useMiniApp } from "@/hooks/use-mini-app"

export function MiniAppLoader({ children }: { children: React.ReactNode }) {
  const { isMiniApp, detectionDetails } = useMiniApp()
  const [isReady, setIsReady] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readyAttempts, setReadyAttempts] = useState(0)
  const MAX_READY_ATTEMPTS = 3

  // Load the SDK dynamically only in client-side and only if in a mini app
  useEffect(() => {
    if (!isMiniApp) {
      console.log("Not in Mini App environment, skipping SDK loading")
      return
    }

    const loadSdk = async () => {
      try {
        console.log("Loading Farcaster Frame SDK...")

        // Dynamically import the SDK only when needed
        const { sdk } = await import("@farcaster/frame-sdk")
        console.log("Frame SDK loaded successfully")
        setSdkLoaded(true)

        // Function to attempt calling ready()
        const attemptReady = async (attempt: number) => {
          try {
            console.log(`Calling sdk.actions.ready() (attempt ${attempt})...`)
            await sdk.actions.ready({ disableNativeGestures: false })
            console.log("Mini App ready signal sent successfully")
            setIsReady(true)
          } catch (readyError) {
            console.error(`Error calling ready (attempt ${attempt}):`, readyError)
            setError(
              `Ready error (attempt ${attempt}): ${readyError instanceof Error ? readyError.message : String(readyError)}`,
            )

            // Try again with increased timeout if we haven't reached max attempts
            if (attempt < MAX_READY_ATTEMPTS) {
              setReadyAttempts(attempt + 1)
              setTimeout(() => attemptReady(attempt + 1), 1000 * attempt) // Exponential backoff
            } else {
              // Continue anyway after max attempts to not block the UI
              console.log("Max ready attempts reached, continuing anyway")
              setIsReady(true)
            }
          }
        }

        // Wait a bit to ensure UI is stable before calling ready
        setTimeout(() => attemptReady(1), 1500)
      } catch (loadError) {
        console.error("Error loading Frame SDK:", loadError)
        setError(`SDK load error: ${loadError instanceof Error ? loadError.message : String(loadError)}`)
        // Continue anyway to not block the UI
        setIsReady(true)
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

          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 text-xs">
              Error: {error}
              <div className="mt-2 text-xs">Detection details: {JSON.stringify(detectionDetails, null, 2)}</div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Loading Mini App... (Attempt {readyAttempts + 1}/{MAX_READY_ATTEMPTS})
          </div>
        </div>
      </div>
    )
  }

  // App is ready, render children
  return <>{children}</>
}
