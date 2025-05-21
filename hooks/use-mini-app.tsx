"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)

  useEffect(() => {
    // Check if we're in a mini app environment
    const checkMiniApp = () => {
      // Check for URL patterns that indicate we're in a mini app
      const url = new URL(window.location.href)
      const isMini =
        url.pathname.startsWith("/mini") ||
        url.searchParams.get("miniApp") === "true" ||
        // Check for Farcaster user agent or other indicators
        /Farcaster/.test(navigator.userAgent)

      setIsMiniApp(isMini)
    }

    checkMiniApp()
  }, [])

  return { isMiniApp }
}
