"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/frame-sdk"

export function FarcasterReady() {
  useEffect(() => {
    // Call ready() to initialize the SDK
    sdk.actions
      .ready({ disableNativeGestures: true })
      .then(() => {
        console.log("Farcaster SDK ready")
      })
      .catch((err) => {
        console.error("Error initializing Farcaster SDK:", err)
      })
  }, [])

  return null
}
