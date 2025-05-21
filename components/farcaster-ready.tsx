"use client"

import { useEffect } from "react"
import { useMiniApp } from "@/hooks/use-mini-app"

export function FarcasterReady() {
  const { isMiniApp } = useMiniApp()

  useEffect(() => {
    if (isMiniApp) {
      // If we're in a mini app, try to import the SDK and call ready
      const loadSDK = async () => {
        try {
          const { sdk } = await import("@farcaster/frame-sdk")
          await sdk.actions.ready()
          console.log("Farcaster SDK ready called")
        } catch (error) {
          console.error("Error loading Farcaster SDK:", error)
        }
      }

      loadSDK()
    }
  }, [isMiniApp])

  return null
}
