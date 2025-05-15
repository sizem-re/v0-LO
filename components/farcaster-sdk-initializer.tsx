"use client"

import { useEffect, useState } from "react"

export function FarcasterSDKInitializer() {
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    // Function to initialize the Farcaster SDK
    const initFarcasterSDK = () => {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return

      // Check if we're in a Farcaster environment
      const isFarcasterApp =
        window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        new URLSearchParams(window.location.search).has("fc-frame")

      if (!isFarcasterApp) return

      // If the SDK is already loaded, call ready
      if (window.farcaster) {
        console.log("Farcaster SDK already loaded, calling setReady")
        window.farcaster.setReady()
        setSdkLoaded(true)
        return
      }

      // Load the Farcaster SDK script
      const script = document.createElement("script")
      script.src = "https://cdn.warpcast.com/sdk/v1/farcaster.js"
      script.async = true
      script.onload = () => {
        console.log("Farcaster SDK loaded, calling setReady")
        // Call setReady when the SDK is loaded
        if (window.farcaster) {
          window.farcaster.setReady()
          setSdkLoaded(true)
        }
      }
      script.onerror = (error) => {
        console.error("Error loading Farcaster SDK:", error)
      }

      document.head.appendChild(script)
    }

    // Initialize the SDK
    initFarcasterSDK()

    // Cleanup function
    return () => {
      // Nothing to clean up
    }
  }, [])

  return null
}
