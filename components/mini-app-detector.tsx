"use client"

import type React from "react"
import { useEffect } from "react"
import { useFarcasterSDK } from "@/lib/farcaster-sdk-context"

interface MiniAppDetectorProps {
  children: React.ReactNode
}

export function MiniAppDetector({ children }: MiniAppDetectorProps) {
  const { isMiniApp } = useFarcasterSDK()

  useEffect(() => {
    // If we're in a mini app, we might need to adjust some styles
    if (isMiniApp) {
      // Add any mini app specific styles or behaviors here
      document.documentElement.classList.add("farcaster-mini-app")
    } else {
      document.documentElement.classList.remove("farcaster-mini-app")
    }
  }, [isMiniApp])

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
