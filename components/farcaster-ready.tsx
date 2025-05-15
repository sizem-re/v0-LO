"use client"

import { useEffect } from "react"

export function FarcasterReady() {
  useEffect(() => {
    // Check if we're in a Farcaster environment
    const isFarcasterApp =
      typeof window !== "undefined" &&
      (window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        window.location.search.includes("fc-frame"))

    if (isFarcasterApp) {
      // Signal to Farcaster that the app is ready
      try {
        // Try to use the Farcaster SDK if available
        if (window.farcaster) {
          console.log("Signaling ready to Farcaster...")
          window.farcaster.ready()
        } else {
          // Fallback for when the SDK isn't directly available
          console.log("Farcaster SDK not found, using postMessage...")
          window.parent.postMessage({ type: "ready" }, "*")
        }
        console.log("App signaled ready to Farcaster")
      } catch (error) {
        console.error("Error signaling ready to Farcaster:", error)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
