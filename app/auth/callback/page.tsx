"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

function AuthCallbackContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshAuth } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get any error from the URL
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")
        
        if (error) {
          throw new Error(errorDescription || error)
        }

        // Check if we have authentication success indicators
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const token = searchParams.get("token")
        
        if (code || state || token) {
          setStatus("success")
          
          // Refresh the auth state to pick up the new authentication
          await refreshAuth()
          
          // Get the return URL from session storage
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
          sessionStorage.removeItem('auth_return_url')
          
          // Redirect to the return URL after a short delay
          setTimeout(() => {
            router.push(returnUrl)
          }, 1500)
        } else {
          // If no specific parameters, assume success and refresh auth
          setStatus("success")
          await refreshAuth()
          
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
          sessionStorage.removeItem('auth_return_url')
          
          setTimeout(() => {
            router.push(returnUrl)
          }, 1000)
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Authentication failed")
        
        // Redirect to login page after showing error
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, refreshAuth])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-black" />
            <h1 className="text-xl font-serif">Completing authentication...</h1>
            <p className="text-black/70">Please wait while we sign you in.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif">Welcome to LO!</h1>
            <p className="text-black/70">Authentication successful. Taking you back to the app...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-serif">Authentication failed</h1>
            <p className="text-red-600 mb-2">{errorMessage}</p>
            <p className="text-black/70">Redirecting to login page...</p>
            <button 
              onClick={() => router.push("/login")}
              className="mt-4 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
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
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
} 