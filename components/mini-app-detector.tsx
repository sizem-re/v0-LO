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
      window.location.hostname.includes("warpcast.com")

    setIsMiniApp(isFarcasterApp)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className={isMiniApp ? "pb-16" : ""}>
      {children}

      {isMiniApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 text-center text-xs text-black/60">
          Running as a Farcaster Mini App
        </div>
      )}
    </div>
  )
}
