"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const checkMiniApp = () => {
      const isFarcasterApp =
        window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        new URLSearchParams(window.location.search).has("fc-frame")

      setIsMiniApp(isFarcasterApp)
      setIsLoading(false)

      // Log for debugging
      console.log("Mini App Detection:", {
        isFarcasterApp,
        userAgent: window.navigator.userAgent,
        url: window.location.href,
        search: window.location.search,
      })
    }

    // Run immediately
    checkMiniApp()

    // Also set up a listener for URL changes
    const handleUrlChange = () => {
      checkMiniApp()
    }

    window.addEventListener("popstate", handleUrlChange)

    return () => {
      window.removeEventListener("popstate", handleUrlChange)
    }
  }, [])

  return { isMiniApp, isLoading }
}
