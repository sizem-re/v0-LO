"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

// Define the context type
type FarcasterSDKContextType = {
  isLoaded: boolean
  isReady: boolean
  isMiniApp: boolean
  sendReady: () => Promise<void>
  sdk: any | null
}

// Create the context with default values
const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  isLoaded: false,
  isReady: false,
  isMiniApp: false,
  sendReady: async () => {},
  sdk: null,
})

export const useFarcasterSDK = () => useContext(FarcasterSDKContext)

export function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const [sdk, setSdk] = useState<any | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isMiniApp, setIsMiniApp] = useState(false)

  // Detect if we're in a Farcaster Mini App environment
  useEffect(() => {
    const detectMiniApp = () => {
      // Various ways to detect if we're in a Farcaster Mini App
      const isFarcasterApp =
        typeof window !== "undefined" &&
        (window.location.href.includes("farcaster://") ||
          window.navigator.userAgent.includes("Farcaster") ||
          window.location.hostname.includes("warpcast.com") ||
          window.location.search.includes("miniApp=true") ||
          window.location.pathname.startsWith("/mini") ||
          window.location.search.includes("fc-frame"))

      setIsMiniApp(isFarcasterApp)
    }

    detectMiniApp()
  }, [])

  // Load the SDK only if we're in a Mini App environment
  useEffect(() => {
    if (!isMiniApp) return

    const loadSDK = async () => {
      try {
        console.log("Loading Farcaster Frame SDK...")
        const { sdk } = await import("@farcaster/frame-sdk")
        console.log("Farcaster Frame SDK loaded successfully")
        setSdk(sdk)
        setIsLoaded(true)
      } catch (error) {
        console.error("Error loading Farcaster Frame SDK:", error)
        // Still set isLoaded to true to avoid blocking the UI
        setIsLoaded(true)
      }
    }

    loadSDK()
  }, [isMiniApp])

  // Function to send the ready signal to the Farcaster client
  const sendReady = useCallback(async () => {
    if (!sdk || !isLoaded || isReady) return

    try {
      console.log("Sending ready signal to Farcaster client...")
      await sdk.actions.ready()
      console.log("Ready signal sent successfully")
      setIsReady(true)
    } catch (error) {
      console.error("Error sending ready signal:", error)
      // Still set isReady to true to avoid blocking the UI
      setIsReady(true)
    }
  }, [sdk, isLoaded, isReady])

  // Listen for SDK events
  useEffect(() => {
    if (!sdk || !isLoaded) return

    const handleClose = () => {
      console.log("Mini App close event received")
    }

    // Subscribe to events
    const unsubscribeClose = sdk.events.subscribe("close", handleClose)

    // Cleanup
    return () => {
      unsubscribeClose()
    }
  }, [sdk, isLoaded])

  return (
    <FarcasterSDKContext.Provider
      value={{
        isLoaded,
        isReady,
        isMiniApp,
        sendReady,
        sdk,
      }}
    >
      {children}
    </FarcasterSDKContext.Provider>
  )
}
