"use client"

import { useState, useEffect } from "react"
import { sdk } from "@farcaster/frame-sdk"

interface FarcasterMiniappAuthProps {
  onAuthSuccess: (token: string) => void
  onError: (error: string) => void
}

export function FarcasterMiniappAuth({ onAuthSuccess, onError }: FarcasterMiniappAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isMiniapp, setIsMiniapp] = useState(false)

  useEffect(() => {
    // Check if we're running in a Farcaster miniapp
    const checkMiniappContext = async () => {
      try {
        const context = await sdk.context
        setIsMiniapp(!!context)
      } catch (error) {
        setIsMiniapp(false)
      }
    }

    checkMiniappContext()
  }, [])

  const handleQuickAuth = async () => {
    if (!isMiniapp) {
      onError("Not running in a Farcaster miniapp")
      return
    }

    setIsLoading(true)
    try {
      console.log("Starting Quick Auth...")
      const { token } = await sdk.experimental.quickAuth()
      console.log("Quick Auth token received:", token ? "present" : "missing")
      console.log("Token length:", token?.length)
      console.log("Token preview:", token?.substring(0, 50) + "...")
      onAuthSuccess(token)
    } catch (error) {
      console.error("Quick auth error:", error)
      onError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMiniapp) {
    return null // Don't show anything if not in a miniapp
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Welcome to LO! Authenticate with your Farcaster account to get started.
      </p>
      <button
        onClick={handleQuickAuth}
        disabled={isLoading}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Authenticating..." : "Login with Farcaster"}
      </button>
    </div>
  )
} 