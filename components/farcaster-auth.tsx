"use client"

import { useEffect, useState } from "react"
import { NeynarAuthButton } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"

interface FarcasterAuthProps {
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

// Detect if user is on mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function FarcasterAuth({ className, children, onSuccess }: FarcasterAuthProps) {
  const { refreshAuth } = useAuth()
  const [showMobileInstructions, setShowMobileInstructions] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  useEffect(() => {
    setIsMobileDevice(isMobile())
  }, [])

  // Listen for auth success from redirects
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log("Auth success detected, refreshing auth state")
      refreshAuth()
      if (onSuccess) {
        onSuccess()
      }
    }

    // Listen for storage events (in case auth happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neynar_auth_success') {
        handleAuthSuccess()
      }
    }

    // Listen for focus events (when user returns from Farcaster)
    const handleFocus = () => {
      // Small delay to allow auth state to update
      setTimeout(() => {
        refreshAuth()
      }, 500)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshAuth, onSuccess])

  const handleAuthClick = () => {
    if (isMobileDevice) {
      // Store current URL for return
      sessionStorage.setItem('auth_return_url', window.location.pathname)
      setShowMobileInstructions(true)
      
      // Hide instructions after a delay
      setTimeout(() => {
        setShowMobileInstructions(false)
      }, 8000)
    }
  }

  return (
    <div className="relative">
      <div onClick={handleAuthClick}>
        <NeynarAuthButton
          className={className}
        />
      </div>
      
      {showMobileInstructions && isMobileDevice && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 z-50">
          <div className="font-medium mb-1">📱 Mobile Instructions:</div>
          <div className="text-xs">
            1. Complete authentication in Farcaster<br/>
            2. Tap "Return to Farcaster" when done<br/>
            3. Return to this browser tab<br/>
            4. You'll be automatically signed in!
          </div>
        </div>
      )}
    </div>
  )
}
