"use client"

import { useEffect, useState } from "react"

export function FarcasterReady() {
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    // Load SDK and call ready() unconditionally
    const loadSdkAndSignalReady = async () => {
      try {
        console.log("Loading Farcaster Frame SDK...")
        const { sdk } = await import("@farcaster/frame-sdk")

        // Small delay to ensure UI is stable
        setTimeout(async () => {
          try {
            console.log("Calling sdk.actions.ready()...")
            await sdk.actions.ready()
            console.log("Ready signal sent successfully")
          } catch (error) {
            console.error("Error calling ready:", error)
          }
          setSdkLoaded(true)
        }, 500)
      } catch (error) {
        console.error("Error loading Farcaster Frame SDK:", error)
        setSdkLoaded(true) // Continue anyway
      }
    }

    loadSdkAndSignalReady()
  }, [])

  // This component doesn't render anything
  return null
}
