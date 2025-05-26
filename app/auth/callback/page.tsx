"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Callback handler started')
        console.log('Search params:', Object.fromEntries(searchParams.entries()))

        // Check for errors first
        const error = searchParams.get('error')
        if (error) {
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: error
            }, window.location.origin)
            window.close()
            return
          }
          throw new Error(`Authentication error: ${error}`)
        }

        // Check if we have an authorization code
        const code = searchParams.get('code')
        if (!code) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: 'No authorization code received'
            }, window.location.origin)
            window.close()
            return
          }
          throw new Error('No authorization code received')
        }

        console.log('Authorization code received:', code)

        // For now, we'll simulate successful authentication
        // In a real implementation, you would exchange the code for user data
        // But since Neynar's OAuth flow might be different, we'll handle this differently
        
        // Check if we have direct user data in the URL (some OAuth providers do this)
        const fid = searchParams.get('fid')
        const username = searchParams.get('username')
        const signerUuid = searchParams.get('signer_uuid')
        
        if (fid && username) {
          // We have user data directly
          const userData = {
            fid: parseInt(fid),
            username: username,
            displayName: searchParams.get('display_name') || '',
            pfpUrl: searchParams.get('pfp_url') || '',
            bio: searchParams.get('bio') || '',
            custodyAddress: searchParams.get('custody_address') || '',
            verifications: [],
            followerCount: parseInt(searchParams.get('follower_count') || '0'),
            followingCount: parseInt(searchParams.get('following_count') || '0'),
            signerUuid: signerUuid || '',
            accessToken: searchParams.get('access_token') || '',
          }

          if (window.opener) {
            window.opener.postMessage({
              type: 'SIWN_SUCCESS',
              ...userData
            }, window.location.origin)
            window.close()
            return
          }
          
          // If not in popup, store locally and redirect
          const authData = {
            ...userData,
            authenticatedAt: new Date().toISOString(),
          }
          localStorage.setItem('farcaster_auth', JSON.stringify(authData))
          setStatus('success')
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
          return
        }

        // If we only have a code, we need to handle it differently
        // For now, we'll show an error since we don't have the full OAuth implementation
        if (window.opener) {
          window.opener.postMessage({
            type: 'SIWN_ERROR',
            error: 'OAuth code exchange not yet implemented'
          }, window.location.origin)
          window.close()
          return
        }
        
        throw new Error('OAuth code exchange not yet implemented')

      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams])

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
          onClick={() => window.location.href = '/login'}
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