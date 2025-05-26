"use client"

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/frame-sdk"
import { useAuth } from "@/lib/auth-context"
import { FarcasterMiniappAuth } from "./farcaster-miniapp-auth"

export function FarcasterReady() {
  const [isMiniapp, setIsMiniapp] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { isAuthenticated, authenticateWithMiniapp } = useAuth()

  useEffect(() => {
    // Call ready() to initialize the SDK
    sdk.actions
      .ready({ disableNativeGestures: true })
      .then(async () => {
        console.log("Farcaster SDK ready")
        
        // Check if we're in a miniapp context
        try {
          const context = await sdk.context
          if (context) {
            setIsMiniapp(true)
            // Show auth if not already authenticated
            if (!isAuthenticated) {
              setShowAuth(true)
            }
          }
        } catch (error) {
          console.log("Not in miniapp context")
        }
      })
      .catch((err) => {
        console.error("Error initializing Farcaster SDK:", err)
      })
  }, [isAuthenticated])

  const handleAuthSuccess = async (token: string) => {
    try {
      await authenticateWithMiniapp(token)
      setShowAuth(false)
    } catch (error) {
      console.error("Authentication failed:", error)
    }
  }

  const handleAuthError = (error: string) => {
    console.error("Auth error:", error)
    // You could show a toast or error message here
  }

  // Show authentication modal if in miniapp and not authenticated
  if (isMiniapp && showAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <FarcasterMiniappAuth 
            onAuthSuccess={handleAuthSuccess}
            onError={handleAuthError}
          />
        </div>
      </div>
    )
  }

  return null
}
