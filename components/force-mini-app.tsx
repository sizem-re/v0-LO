"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function ForceMiniApp() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we should force mini app mode
    const forceMiniApp = searchParams.get("forceMiniApp")

    if (forceMiniApp === "true") {
      console.log("Forcing Mini App mode via URL parameter")

      // Add a global flag that our hooks can check
      window.forceMiniApp = true

      // Add a class to the document for styling
      document.documentElement.classList.add("farcaster-mini-app")

      // Mock the Farcaster object if needed
      if (!("farcaster" in window)) {
        // @ts-ignore
        window.farcaster = { isMiniApp: true }
      }
    }
  }, [searchParams])

  return null
}
