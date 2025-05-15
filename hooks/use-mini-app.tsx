"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com")

    setIsMiniApp(isFarcasterApp)
    setIsLoading(false)
  }, [])

  return { isMiniApp, isLoading }
}
