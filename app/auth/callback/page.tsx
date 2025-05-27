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
  const [showManualContinue, setShowManualContinue] = useState(false)

  const addDebug = (message: string) => {
    console.log('Callback Debug:', message)
    setDebugInfo(prev => [...prev, message])
  }

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768
  }

  const handleManualContinue = () => {
    addDebug('Manual continue clicked - redirecting to home')
    // Try to store any available auth data first
    const code = searchParams.get('code')
    if (code) {
      // Store the code for later processing
      localStorage.setItem('pending_auth_code', code)
      addDebug('Stored pending auth code')
    }
    window.location.href = '/'
  }

  useEffect(() => {
    // Show manual continue button after 5 seconds on mobile
    if (isMobile() && !window.opener) {
      const timer = setTimeout(() => {
        addDebug('Showing manual continue button after timeout')
        setShowManualContinue(true)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Listen for postMessage events from Neynar
    const handleMessage = (event: MessageEvent) => {
      addDebug(`Received postMessage: ${JSON.stringify(event.data)} from ${event.origin}`)
      
      if (event.origin === 'https://app.neynar.com' && event.data.is_authenticated) {
        addDebug('Received Neynar authentication success message')
        
        const userData = event.data.user || {}
        const authData = {
          fid: parseInt(event.data.fid),
          username: userData.username || '',
          displayName: userData.display_name || userData.displayName || '',
          pfpUrl: userData.pfp_url || userData.pfpUrl || '',
          bio: userData.bio || '',
          custodyAddress: userData.custody_address || userData.custodyAddress || '',
          verifications: userData.verifications || [],
          followerCount: userData.follower_count || userData.followerCount || 0,
          followingCount: userData.following_count || userData.followingCount || 0,
          signerUuid: event.data.signer_uuid || '',
          accessToken: event.data.access_token || '',
          signerPermissions: event.data.signer_permissions || [],
          authenticatedAt: new Date().toISOString(),
        }

        addDebug('Storing auth data from postMessage')
        localStorage.setItem('farcaster_auth', JSON.stringify(authData))
        setStatus('success')
        
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    }

    window.addEventListener('message', handleMessage)

    const handleCallback = async () => {
      try {
        addDebug('Callback handler started')
        addDebug(`Search params: ${JSON.stringify(Object.fromEntries(searchParams.entries()))}`)
        addDebug(`Window opener exists: ${!!window.opener}`)
        addDebug(`Current URL: ${window.location.href}`)
        addDebug(`Is mobile: ${isMobile()}`)
        addDebug(`User agent: ${navigator.userAgent}`)

        // Check for errors first
        const error = searchParams.get('error')
        if (error) {
          addDebug(`Error found: ${error}`)
          if (window.opener) {
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: error
            }, '*')
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
            window.opener.postMessage({
              type: 'SIWN_ERROR',
              error: 'No authorization code received'
            }, '*')
            setTimeout(() => window.close(), 1000)
            return
          }
          
          // On mobile without code, show manual continue immediately
          if (isMobile()) {
            addDebug('Mobile without code - showing manual continue')
            setShowManualContinue(true)
            return
          }
          
          throw new Error('No authorization code received')
        }

        addDebug(`Authorization code received: ${code.substring(0, 10)}...`)

        // Check if we have direct user data in the URL
        const fid = searchParams.get('fid')
        const username = searchParams.get('username')
        const signerUuid = searchParams.get('signer_uuid')
        
        addDebug(`Direct user data - FID: ${fid}, Username: ${username}, SignerUuid: ${signerUuid}`)
        
        if (fid && username && signerUuid) {
          addDebug('Found complete user data in URL')
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
            signerUuid: signerUuid,
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
          
          // Store locally and redirect
          addDebug('Storing user data locally and redirecting')
          const authData = {
            ...userData,
            authenticatedAt: new Date().toISOString(),
          }
          localStorage.setItem('farcaster_auth', JSON.stringify(authData))
          setStatus('success')
          setTimeout(() => {
            window.location.href = '/'
          }, 1500)
          return
        }

        // Handle code-only scenario
        if (window.opener) {
          // In popup - send code to parent
          addDebug('Sending code to parent window')
          window.opener.postMessage({
            type: 'SIWN_CODE',
            code: code,
            redirect_uri: `${window.location.origin}/auth/callback`
          }, '*')
          setTimeout(() => window.close(), 1000)
          return
        } else {
          // Mobile redirect - this is the intermediate step
          addDebug('Mobile redirect with code - waiting for completion')
          
          // Store the code for potential later use
          localStorage.setItem('pending_auth_code', code)
          
          // Show manual continue after a delay
          setTimeout(() => {
            addDebug('Showing manual continue after delay')
            setShowManualContinue(true)
          }, 3000)
        }

      } catch (err) {
        console.error('Callback error:', err)
        addDebug(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
        
        // Show manual continue on error for mobile
        if (isMobile()) {
          setShowManualContinue(true)
        }
      }
    }

    setTimeout(handleCallback, 100)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h1 className="text-xl font-semibold">Completing authentication...</h1>
          <p className="text-gray-600">
            {window.opener 
              ? "Please wait while we verify your Farcaster account."
              : "Completing the Farcaster authentication process."
            }
          </p>
          
          {/* Always show manual continue on mobile after delay */}
          {(showManualContinue || isMobile()) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
              <h3 className="font-semibold text-blue-900 mb-2">Having trouble?</h3>
              <p className="text-sm text-blue-800 mb-4">
                If you're stuck on the Neynar page or the "Continue with LO" button isn't working, click below to continue manually:
              </p>
              <button
                onClick={handleManualContinue}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 font-medium"
              >
                Continue to LO
              </button>
            </div>
          )}
          
          {/* Debug info - always show on mobile for troubleshooting */}
          {(process.env.NODE_ENV === 'development' || isMobile()) && debugInfo.length > 0 && (
            <details className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
              <summary className="font-semibold mb-2 cursor-pointer">Debug Info (tap to expand)</summary>
              {debugInfo.map((info, index) => (
                <div key={index} className="mb-1 break-all">{info}</div>
              ))}
            </details>
          )}
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-red-600">Authentication failed</h1>
        <p className="text-gray-600">{error}</p>
        
        {/* Manual continue option on error */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
          <p className="text-sm text-blue-800 mb-3">
            You can try to continue anyway:
          </p>
          <button
            onClick={handleManualContinue}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            Continue to LO
          </button>
        </div>
        
        {/* Debug info */}
        {(process.env.NODE_ENV === 'development' || isMobile()) && debugInfo.length > 0 && (
          <details className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <summary className="font-semibold mb-2 cursor-pointer">Debug Info (tap to expand)</summary>
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1 break-all">{info}</div>
            ))}
          </details>
        )}
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