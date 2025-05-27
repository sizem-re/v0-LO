"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface FarcasterConnectProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function FarcasterConnect({ onSuccess, onError }: FarcasterConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPopup, setCurrentPopup] = useState<Window | null>(null)
  const [showMobileInstructions, setShowMobileInstructions] = useState(false)
  const { refreshAuth } = useAuth()

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768
  }

  useEffect(() => {
    // Listen for messages from the popup window
    const handleMessage = async (event: MessageEvent) => {
      console.log('Received message:', event)
      console.log('Message origin:', event.origin)
      console.log('Message data:', event.data)

      // Handle Neynar authentication messages
      if (event.origin === 'https://app.neynar.com' && event.data.is_authenticated) {
        try {
          console.log('Processing Neynar authentication success')
          setIsLoading(false)
          setShowMobileInstructions(false)
          
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

          console.log('Storing auth data:', authData)
          localStorage.setItem('farcaster_auth', JSON.stringify(authData))
          
          // Close the popup
          if (currentPopup && !currentPopup.closed) {
            console.log('Closing popup')
            currentPopup.close()
            setCurrentPopup(null)
          }
          
          // Refresh auth context
          await refreshAuth()
          
          toast.success('Successfully connected with Farcaster!')
          onSuccess?.()
          
          // Don't refresh the page immediately - let the auth context update first
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
        } catch (err) {
          console.error('Error handling Neynar authentication:', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication'
          setError(errorMessage)
          onError?.(errorMessage)
          toast.error(errorMessage)
          setIsLoading(false)
          setShowMobileInstructions(false)
          
          // Close popup on error too
          if (currentPopup && !currentPopup.closed) {
            currentPopup.close()
            setCurrentPopup(null)
          }
        }
        return
      }

      // Handle our custom message types (fallback)
      if (event.data.type === 'SIWN_SUCCESS') {
        try {
          console.log('Processing SIWN_SUCCESS')
          setIsLoading(false)
          setShowMobileInstructions(false)
          
          const authData = {
            fid: event.data.fid,
            username: event.data.username,
            displayName: event.data.displayName || event.data.display_name || '',
            pfpUrl: event.data.pfpUrl || event.data.pfp_url || '',
            bio: event.data.bio || '',
            custodyAddress: event.data.custodyAddress || event.data.custody_address || '',
            verifications: event.data.verifications || [],
            followerCount: event.data.followerCount || event.data.follower_count || 0,
            followingCount: event.data.followingCount || event.data.following_count || 0,
            signerUuid: event.data.signerUuid || event.data.signer_uuid || '',
            accessToken: event.data.accessToken || event.data.access_token || '',
            authenticatedAt: new Date().toISOString(),
          }

          console.log('Storing auth data:', authData)
          localStorage.setItem('farcaster_auth', JSON.stringify(authData))
          
          // Close the popup
          if (currentPopup && !currentPopup.closed) {
            currentPopup.close()
            setCurrentPopup(null)
          }
          
          await refreshAuth()
          
          toast.success('Successfully connected with Farcaster!')
          onSuccess?.()
          
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
        } catch (err) {
          console.error('Error handling SIWN success:', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication'
          setError(errorMessage)
          onError?.(errorMessage)
          toast.error(errorMessage)
          setIsLoading(false)
          setShowMobileInstructions(false)
        }
      } else if (event.data.type === 'SIWN_CODE') {
        try {
          console.log('Processing SIWN_CODE')
          console.log('Authorization code:', event.data.code)
          
          // For now, we'll show an error since we don't have the OAuth exchange implemented
          // In a full implementation, you would exchange the code for user data here
          setError('OAuth code received but exchange not implemented yet')
          setIsLoading(false)
          setShowMobileInstructions(false)
          toast.error('Authentication partially complete - code exchange needed')
          
        } catch (err) {
          console.error('Error handling SIWN code:', err)
          setError('Failed to process authorization code')
          setIsLoading(false)
          setShowMobileInstructions(false)
          toast.error('Authentication failed')
        }
      } else if (event.data.type === 'SIWN_ERROR') {
        console.error('SIWN error:', event.data.error)
        setError(`Authentication failed: ${event.data.error}`)
        setIsLoading(false)
        setShowMobileInstructions(false)
        toast.error('Authentication failed')
      } else if (event.origin !== 'https://llllllo.com' && event.data.target !== 'metamask-inpage') {
        // Only log unknown messages that aren't from our own domain or MetaMask
        console.log('Unknown message type:', event.data.type, 'from origin:', event.origin)
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [refreshAuth, onSuccess, onError, currentPopup])

  const handleConnect = () => {
    console.log('Connect button clicked')
    
    setIsLoading(true)
    setError(null)
    setShowMobileInstructions(false)
    
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
    
    if (!clientId) {
      setError('Neynar Client ID not configured')
      setIsLoading(false)
      return
    }
    
    // Detect mobile devices
    const isMobileDevice = isMobile()
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read+write`
    
    console.log('Auth URL:', authUrl)
    console.log('Is mobile:', isMobileDevice)
    
    if (isMobileDevice) {
      // On mobile, show instructions and redirect
      console.log('Using mobile redirect approach')
      setShowMobileInstructions(true)
      
      // Show instructions for a moment, then redirect
      setTimeout(() => {
        window.location.href = authUrl
      }, 2000)
      return
    }
    
    // Desktop: use popup approach
    console.log('Opening auth popup for desktop')
    
    const popup = window.open(
      authUrl,
      'neynar-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!popup) {
      setError('Popup blocked. Please allow popups for this site.')
      setIsLoading(false)
      return
    }
    
    setCurrentPopup(popup)
    
    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        setIsLoading(false)
        setCurrentPopup(null)
        console.log('Popup was closed manually')
      }
    }, 1000)
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close()
        clearInterval(checkClosed)
        setIsLoading(false)
        setCurrentPopup(null)
        setError('Authentication timed out. Please try again.')
      }
    }, 300000)
  }

  const handleMobileReturn = () => {
    console.log('User returned from mobile auth')
    setIsLoading(false)
    setShowMobileInstructions(false)
    // Refresh the auth context to check for any stored auth data
    refreshAuth()
  }

  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID

  // Show mobile instructions
  if (showMobileInstructions) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 1000 1000"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="1000" height="1000" rx="200" fill="#8A63D2"/>
              <path
                d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"
                fill="white"
              />
            </svg>
            Mobile Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Follow these steps:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li><strong>1.</strong> You'll be redirected to Neynar</li>
              <li><strong>2.</strong> Click "Connect with Farcaster"</li>
              <li><strong>3.</strong> Authorize in the Farcaster app</li>
              <li><strong>4.</strong> Return to your browser</li>
              <li><strong>5.</strong> If you see "Continue with LO" button, click it</li>
              <li><strong>6.</strong> If the button doesn't work, come back here and click "I'm Back"</li>
            </ol>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">⚠️ Known Issues</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• The "Continue with LO" button may not appear immediately</li>
              <li>• You may need to refresh the Neynar page</li>
              <li>• The button might not work on some mobile browsers</li>
              <li>• If stuck, use the "I'm Back" button below</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Redirecting to Neynar in a moment...
            </p>
            
            <Button
              onClick={handleMobileReturn}
              variant="outline"
              className="w-full"
            >
              I'm Back - Check Authentication
            </Button>
            
            <Button
              onClick={() => {
                setShowMobileInstructions(false)
                setIsLoading(false)
              }}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
            
            <div className="text-center">
              <a 
                href="/auth/help" 
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Need more help? View detailed troubleshooting guide
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1000" height="1000" rx="200" fill="#8A63D2"/>
            <path
              d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"
              fill="white"
            />
            <path
              d="M128.889 253.333L157.778 351.111H182.222V746.667C182.222 790.643 218.024 826.667 262.222 826.667H737.778C781.976 826.667 817.778 790.643 817.778 746.667V351.111H842.222L871.111 253.333H128.889Z"
              fill="white"
            />
          </svg>
          Sign in with Farcaster
        </CardTitle>
        <CardDescription>
          Connect your Farcaster account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 text-xs bg-gray-100 rounded">
            <div>Client ID: {clientId ? 'Set' : 'Missing'}</div>
            <div>Redirect URI: {`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}</div>
          </div>
        )}
        
        <Button
          onClick={handleConnect}
          disabled={isLoading || !clientId}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {typeof window !== 'undefined' && isMobile()
                ? 'Preparing redirect...' 
                : 'Opening Neynar...'}
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
              >
                <rect width="1000" height="1000" rx="200" fill="currentColor"/>
                <path
                  d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"
                  fill="white"
                />
              </svg>
              Connect with Farcaster
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Powered by Neynar</p>
          <p className="mt-1">
            By connecting, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 