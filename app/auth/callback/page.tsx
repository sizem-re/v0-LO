"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshAuth } = useAuth()
  const { isAuthenticated } = useNeynarContext()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback triggered')
        
        // Check for auth success in URL params
        const success = searchParams.get('success')
        const error = searchParams.get('error')
        
        if (error) {
          console.error('Auth error:', error)
          setStatus('error')
          return
        }

        // Refresh auth state
        await refreshAuth()
        
        // Check if we're authenticated
        if (isAuthenticated) {
          setStatus('success')
          
          // Get return URL from session storage
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
          sessionStorage.removeItem('auth_return_url')
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(returnUrl)
          }, 1500)
        } else {
          // If not authenticated yet, keep checking
          setTimeout(handleAuthCallback, 1000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
      }
    }

    // Handle visibility change (when user returns from Farcaster)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, checking auth status')
        handleAuthCallback()
      }
    }

    // Handle focus (when user returns to tab)
    const handleFocus = () => {
      console.log('Window focused, checking auth status')
      handleAuthCallback()
    }

    // Initial check
    handleAuthCallback()

    // Listen for when user returns from Farcaster
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [searchParams, refreshAuth, isAuthenticated, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-4">There was an error during authentication.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-green-500 text-xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h1>
          <p className="text-gray-600">Redirecting you back to the app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Completing Authentication...</h1>
        <p className="text-gray-600 mb-4">
          If you came from Farcaster mobile app, you can now return to this tab.
        </p>
        <p className="text-sm text-gray-500">
          This page will automatically detect when you return and complete the login process.
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="max-w-md w-full text-center">
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-black" />
          <h1 className="text-xl font-serif">Loading...</h1>
          <p className="text-black/70">Please wait while we process your authentication.</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 