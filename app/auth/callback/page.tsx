"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    console.log('Callback Debug:', message)
    setDebugInfo(prev => [...prev, message])
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addDebug('Callback handler started')
        addDebug(`Search params: ${JSON.stringify(Object.fromEntries(searchParams.entries()))}`)
        addDebug(`Window opener exists: ${!!window.opener}`)
        addDebug(`Current URL: ${window.location.href}`)

        // Check for errors first
        const error = searchParams.get('error')
        if (error) {
          addDebug(`Error found: ${error}`)
          // Send error message to parent window
          if (window.opener) {
            addDebug('Sending error to parent window')
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: error
            }, '*') // Use '*' for now to ensure message is sent
            setTimeout(() => window.close(), 1000)
            return
          }
          throw new Error(`Authentication error: ${error}`)
        }

        // Check if we have an authorization code
        const code = searchParams.get('code')
        addDebug(`Authorization code: ${code ? 'present' : 'missing'}`)
        
        if (!code) {
          addDebug('No authorization code found')
          if (window.opener) {
            addDebug('Sending no-code error to parent window')
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: 'No authorization code received'
            }, '*')
            setTimeout(() => window.close(), 1000)
            return
          }
          throw new Error('No authorization code received')
        }

        addDebug(`Authorization code received: ${code.substring(0, 10)}...`)

        // Check if we have direct user data in the URL (some OAuth providers do this)
        const fid = searchParams.get('fid')
        const username = searchParams.get('username')
        const signerUuid = searchParams.get('signer_uuid')
        
        addDebug(`Direct user data - FID: ${fid}, Username: ${username}, SignerUuid: ${signerUuid}`)
        
        if (fid && username) {
          addDebug('Found direct user data in URL')
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
            addDebug('Sending success data to parent window')
            window.opener.postMessage({
              type: 'SIWN_SUCCESS',
              ...userData
            }, '*')
            setTimeout(() => window.close(), 1000)
            return
          }
          
          // If not in popup, store locally and redirect
          addDebug('Not in popup, storing locally')
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

        // If we only have a code, try to exchange it or show a message
        addDebug('Only have authorization code, attempting to handle')
        
        // For now, let's try to send the code to the parent and let it handle the exchange
        if (window.opener) {
          addDebug('Sending code to parent window for exchange')
          window.opener.postMessage({
            type: 'SIWN_CODE',
            code: code,
            redirect_uri: `${window.location.origin}/auth/callback`
          }, '*')
          setTimeout(() => window.close(), 1000)
          return
        }
        
        // If not in popup, show a message that we need to implement code exchange
        addDebug('Not in popup and only have code - showing error')
        throw new Error('OAuth code exchange not yet implemented for direct access')

      } catch (err) {
        console.error('Callback error:', err)
        addDebug(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    // Add a small delay to ensure the page is fully loaded
    setTimeout(handleCallback, 100)
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h1 className="text-xl font-semibold">Completing authentication...</h1>
          <p className="text-gray-600">Please wait while we verify your Farcaster account.</p>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              {debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))}
            </div>
          )}
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
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        )}
        
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