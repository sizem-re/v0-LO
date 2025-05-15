"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

interface MiniAppDetectorProps {
  children: React.ReactNode
}

export function MiniAppDetector({ children }: MiniAppDetectorProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)

    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com") ||
      new URLSearchParams(window.location.search).has("fc-frame")

    setIsMiniApp(isFarcasterApp)

    // If we're in a mini app and at the root, redirect to a good starting page
    if (isFarcasterApp && pathname === "/") {
      router.push("/discover")
    }

    // Log environment info for debugging
    console.log("Mini App Environment:", {
      isFarcasterApp,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      search: window.location.search,
    })
  }, [pathname, router])

  if (!isMounted) {
    return null
  }

  return (
    <div className={isMiniApp ? "pb-16" : ""}>
      {children}

      {isMiniApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 text-center text-xs text-black/60 z-50">
          Running as a Farcaster Mini App
        </div>
      )}
    </div>
  )
}
