"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// This component uses useSearchParams() and needs to be wrapped in Suspense
function ForceMiniAppInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we should force mini app mode
    const forceMiniApp = searchParams?.get("forceMiniApp")

    if (forceMiniApp === "true") {
      console.log("Forcing Mini App mode via URL parameter")

      // Add a global flag that our hooks can check
      // @ts-ignore
      window.forceMiniApp = true

      // Add a class to the document for styling
      document.documentElement.classList.add("farcaster-mini-app")

      // Mock the Farcaster object if needed
      if (!("farcaster" in window)) {
        // @ts-ignore
        window.farcaster = { isMiniApp: true }
      }

      // Dispatch a custom event that other components can listen for
      window.dispatchEvent(new CustomEvent("forceMiniAppChanged", { detail: true }))
    }
  }, [searchParams])

  return null
}

// This is the main component that wraps the inner component with Suspense
export function ForceMiniApp() {
  return (
    <Suspense fallback={null}>
      <ForceMiniAppInner />
    </Suspense>
  )
}
