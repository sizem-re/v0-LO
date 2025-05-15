"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface MiniAppDetectorProps {
  children: React.ReactNode
}

export function MiniAppDetector({ children }: MiniAppDetectorProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com") ||
      window.location.search.includes("fc-frame") ||
      // Additional check for Farcaster's embedded webview
      window.parent !== window

    setIsMiniApp(isFarcasterApp)

    // If we're in a mini app, we might need to adjust some styles
    if (isFarcasterApp) {
      // Add any mini app specific styles or behaviors here
      document.documentElement.classList.add("farcaster-mini-app")

      // Log for debugging
      console.log("Running in Farcaster mini app environment")
      console.log("User Agent:", window.navigator.userAgent)
      console.log("URL:", window.location.href)

      // Disable zoom on mobile
      const metaViewport = document.querySelector('meta[name="viewport"]')
      if (!metaViewport) {
        const newMeta = document.createElement("meta")
        newMeta.name = "viewport"
        newMeta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        document.head.appendChild(newMeta)
      }
    }
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className={isMiniApp ? "pb-16 farcaster-container" : ""}>
      {children}

      {isMiniApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 text-center text-xs text-black/60">
          Running as a Farcaster Mini App
        </div>
      )}
    </div>
  )
}
