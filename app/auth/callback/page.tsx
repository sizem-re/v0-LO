"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshAuth } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have authentication data from Neynar
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const signerUuid = searchParams.get('signer_uuid')
        const fid = searchParams.get('fid')
        const username = searchParams.get('username')

        if (error) {
          throw new Error(`Authentication error: ${error}`)
        }

        // If we have signer data directly from Neynar
        if (signerUuid && fid) {
          const authData = {
            fid: parseInt(fid),
            username: username || '',
            displayName: searchParams.get('display_name') || '',
            pfpUrl: searchParams.get('pfp_url') || '',
            bio: searchParams.get('bio') || '',
            custodyAddress: searchParams.get('custody_address') || '',
            verifications: [],
            followerCount: 0,
            followingCount: 0,
            signerUuid: signerUuid,
            accessToken: searchParams.get('token') || '',
            authenticatedAt: new Date().toISOString(),
          }

          localStorage.setItem('farcaster_auth', JSON.stringify(authData))
          await refreshAuth()
          setStatus('success')
          
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        }

        // If we just have a code, we need to exchange it
        if (code) {
          // For now, just store the code and redirect
          // In a full implementation, you'd exchange this for user data
          console.log('Received auth code:', code)
          setError('Authentication code received but user data exchange not implemented')
          setStatus('error')
          return
        }

        throw new Error('No authentication data received')

      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams, refreshAuth, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h1 className="text-xl font-semibold">Completing authentication...</h1>
          <p className="text-gray-600">Please wait while we verify your Farcaster account.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-green-600">Authentication successful!</h1>
          <p className="text-gray-600">Redirecting you to the app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-red-600">Authentication failed</h1>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <h1 className="text-xl font-semibold">Loading...</h1>
        <p className="text-gray-600">Please wait while we process your authentication.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackHandler />
    </Suspense>
  )
} 