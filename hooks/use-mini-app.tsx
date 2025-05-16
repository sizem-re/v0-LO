"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const checkIfMiniApp = () => {
      // Various ways to detect if we're in a Farcaster Mini App
      const isFarcasterApp =
        window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        window.location.search.includes("miniApp=true") ||
        window.location.pathname.startsWith("/mini") ||
        window.location.search.includes("fc-frame")

      setIsMiniApp(isFarcasterApp)
      setIsLoading(false)
    }

    // Run the check immediately if document is already loaded
    if (document.readyState === "complete") {
      checkIfMiniApp()
    } else {
      // Otherwise wait for the document to load
      window.addEventListener("load", checkIfMiniApp)
      return () => window.removeEventListener("load", checkIfMiniApp)
    }
  }, [])

  return { isMiniApp, isLoading }
}
