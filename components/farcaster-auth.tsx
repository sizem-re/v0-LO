"use client"

import { useEffect } from "react"
import { NeynarAuthButton } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"

interface FarcasterAuthProps {
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

export function FarcasterAuth({ className, children, onSuccess }: FarcasterAuthProps) {
  const { refreshAuth } = useAuth()

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

  return (
    <NeynarAuthButton 
      className={`bg-black text-white hover:bg-gray-800 rounded-none border border-black px-6 py-3 font-medium transition-colors ${className}`}
    >
      {children || "Sign in with Farcaster"}
    </NeynarAuthButton>
  )
}
