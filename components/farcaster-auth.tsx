"use client"

import { useState, useEffect } from "react"
import { NeynarAuthButton } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"

interface FarcasterAuthProps {
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

export function FarcasterAuth({ className, children, onSuccess }: FarcasterAuthProps) {
  const [isMobile, setIsMobile] = useState(false)
  const { refreshAuth } = useAuth()

  useEffect(() => {
    // Detect if we're on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
    window.addEventListener('storage', handleAuthSuccess)
    
    // Listen for focus events (when user returns from auth)
    window.addEventListener('focus', handleAuthSuccess)

    return () => {
      window.removeEventListener('storage', handleAuthSuccess)
      window.removeEventListener('focus', handleAuthSuccess)
    }
  }, [refreshAuth, onSuccess])

  const handleMobileAuth = async () => {
    try {
      // For mobile, we'll use a full page redirect instead of popup
      const response = await fetch('/api/auth/neynar/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirect_uri: `${window.location.origin}/auth/callback`,
          app_redirect: true,
        }),
      })

      if (response.ok) {
        const { authUrl } = await response.json()
        console.log("Redirecting to:", authUrl)
        
        // Store the current page to return to after auth
        sessionStorage.setItem('auth_return_url', window.location.pathname)
        
        // Redirect to auth URL
        window.location.href = authUrl
      } else {
        console.error("Failed to initialize auth")
        alert("Failed to initialize authentication. Please try again.")
      }
    } catch (error) {
      console.error("Mobile auth error:", error)
      alert("Authentication failed. Please try again.")
    }
  }

  if (isMobile) {
    return (
      <button 
        onClick={handleMobileAuth}
        className={`bg-black text-white hover:bg-gray-800 rounded-none border border-black px-6 py-3 font-medium transition-colors ${className}`}
      >
        {children || "Sign in with Farcaster"}
      </button>
    )
  }

  return (
    <NeynarAuthButton 
      className={`bg-black text-white hover:bg-gray-800 rounded-none border border-black px-6 py-3 font-medium transition-colors ${className}`}
    >
      {children || "Sign in with Farcaster"}
    </NeynarAuthButton>
  )
}
