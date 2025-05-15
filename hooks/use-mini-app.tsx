"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const checkIfMiniApp = () => {
      // Various ways to detect if we're in a Farcaster Mini App
      const url = new URL(window.location.href)

      const isFarcasterApp =
        // URL patterns
        url.pathname.startsWith("/mini") ||
        url.searchParams.get("miniApp") === "true" ||
        url.searchParams.has("fc-frame") ||
        // User agent and protocol detection
        window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        // Check for Farcaster-specific objects or events
        "FarcasterFrame" in window ||
        "farcaster" in window

      console.log("Mini App detection result:", isFarcasterApp, {
        pathname: url.pathname,
        search: url.search,
        userAgent: window.navigator.userAgent,
      })

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
