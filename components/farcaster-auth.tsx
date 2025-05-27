"use client"

import { useEffect, useState } from "react"
import { NeynarAuthButton, useNeynarContext } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"

interface FarcasterAuthProps {
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

// Detect if user is on mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768
}

export function FarcasterAuth({ className, children, onSuccess }: FarcasterAuthProps) {
  const { refreshAuth } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()
  const [showMobileInstructions, setShowMobileInstructions] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    setIsMobileDevice(isMobile())
  }, [])

  // Watch for Neynar authentication changes
  useEffect(() => {
    if (neynarAuthenticated && neynarUser) {
      console.log("Neynar authentication detected:", neynarUser)
      setIsAuthenticating(false)
      setShowMobileInstructions(false)
      
      // Refresh our auth context
      refreshAuth()
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [neynarAuthenticated, neynarUser, refreshAuth, onSuccess])

  // Listen for auth success from redirects and focus events
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log("Auth success detected, refreshing auth state")
      setIsAuthenticating(false)
      setShowMobileInstructions(false)
      refreshAuth()
    }

    // Listen for storage events (in case auth happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neynar_auth_success') {
        handleAuthSuccess()
      }
    }

    // Listen for focus events (when user returns from authentication)
    const handleFocus = () => {
      console.log("Window focus detected - checking auth state")
      // Small delay to allow auth state to update
      setTimeout(() => {
        refreshAuth()
      }, 500)
      
      // Additional check after a longer delay for mobile
      if (isMobileDevice) {
        setTimeout(() => {
          refreshAuth()
        }, 2000)
      }
    }

    // Listen for visibility change (mobile-specific)
    const handleVisibilityChange = () => {
      if (!document.hidden && isMobileDevice) {
        console.log("Page became visible - checking auth state")
        setTimeout(() => {
          refreshAuth()
        }, 1000)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshAuth, isMobileDevice])

  const handleAuthClick = () => {
    console.log("Auth button clicked, mobile:", isMobileDevice)
    setIsAuthenticating(true)
    
    if (isMobileDevice) {
      // Store current URL for return
      sessionStorage.setItem('auth_return_url', window.location.pathname)
      setShowMobileInstructions(true)
      
      // Hide instructions after a delay
      setTimeout(() => {
        setShowMobileInstructions(false)
      }, 10000)
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
          <div className="font-medium mb-1">📱 Mobile Authentication:</div>
          <div className="text-xs">
            1. Complete authentication in the opened page<br/>
            2. Look for "Continue to LO" button after authentication<br/>
            3. If the button doesn't work, return to this tab manually<br/>
            4. You should be automatically signed in!
          </div>
          {isAuthenticating && (
            <div className="mt-2 text-xs text-blue-600">
              ⏳ Waiting for authentication to complete...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
