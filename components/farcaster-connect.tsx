"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth-context"

interface FarcasterConnectProps {
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

interface ConnectResponse {
  channelToken: string
  url: string
  connectUri: string
}

interface StatusResponse {
  state: 'pending' | 'completed' | 'expired'
  nonce?: string
  message?: string
  signature?: string
  fid?: number
  username?: string
  bio?: string
  displayName?: string
  pfpUrl?: string
}

// Detect if user is on mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function FarcasterConnect({ className, children, onSuccess }: FarcasterConnectProps) {
  const { refreshAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [connectData, setConnectData] = useState<ConnectResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  useEffect(() => {
    setIsMobileDevice(isMobile())
  }, [])

  // Poll for authentication status
  useEffect(() => {
    if (!connectData) return

    const pollStatus = async () => {
      try {
        console.log('Polling status for channel:', connectData.channelToken)
        const response = await fetch(`/api/auth/farcaster/status?channelToken=${connectData.channelToken}`)
        
        if (!response.ok) {
          console.error('Status polling failed:', response.status, response.statusText)
          return
        }
        
        const data: StatusResponse = await response.json()
        console.log('Status response:', data)

        if (data.state === 'completed' && data.signature) {
          console.log('Farcaster authentication completed!')
          
          // Store auth data
          localStorage.setItem('farcaster_auth', JSON.stringify({
            fid: data.fid,
            username: data.username,
            displayName: data.displayName,
            pfpUrl: data.pfpUrl,
            signature: data.signature,
            message: data.message
          }))

          // Refresh auth state
          await refreshAuth()
          
          // Clear connect data
          setConnectData(null)
          
          // Call success callback
          if (onSuccess) {
            onSuccess()
          }
          
          // Force a page refresh to ensure all components update
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
        } else if (data.state === 'expired') {
          console.log('Authentication request expired')
          setError('Authentication request expired. Please try again.')
          setConnectData(null)
        } else {
          console.log('Authentication still pending, state:', data.state)
        }
      } catch (error) {
        console.error('Error polling status:', error)
      }
    }

    // Initial poll
    pollStatus()
    
    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000)

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setConnectData(null)
      setError('Authentication request timed out.')
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [connectData, refreshAuth, onSuccess])

  // Listen for when user returns to the page (mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectData) {
        console.log('Page became visible, checking auth status immediately')
        // Check status immediately when page becomes visible
        fetch(`/api/auth/farcaster/status?channelToken=${connectData.channelToken}`)
          .then(response => response.json())
          .then(data => {
            console.log('Visibility change status check:', data)
            if (data.state === 'completed' && data.signature) {
              // Store auth data and refresh
              localStorage.setItem('farcaster_auth', JSON.stringify({
                fid: data.fid,
                username: data.username,
                displayName: data.displayName,
                pfpUrl: data.pfpUrl,
                signature: data.signature,
                message: data.message
              }))
              refreshAuth()
              setConnectData(null)
              if (onSuccess) onSuccess()
              setTimeout(() => window.location.reload(), 500)
            }
          })
          .catch(error => console.error('Visibility change status check error:', error))
      }
    }

    const handleFocus = () => {
      if (connectData) {
        console.log('Window focused, checking auth status')
        handleVisibilityChange()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [connectData, refreshAuth, onSuccess])

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a new channel
      const response = await fetch('/api/auth/farcaster/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: window.location.hostname,
          siweUri: window.location.origin,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create authentication channel')
      }

      const data: ConnectResponse = await response.json()
      setConnectData(data)

      // On mobile, redirect directly to the connect URI
      if (isMobileDevice) {
        window.location.href = data.connectUri
      }
    } catch (error) {
      console.error('Error creating connect channel:', error)
      setError('Failed to start authentication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (connectData) {
    return (
      <div className="text-center space-y-4">
        {!isMobileDevice ? (
          <>
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeSVG 
                value={connectData.connectUri} 
                size={200}
                className="mx-auto"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Scan with your phone</h3>
              <p className="text-sm text-gray-600">
                Open your camera app and scan the QR code to sign in with Farcaster
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <div className="space-y-2">
              <h3 className="font-medium">Complete authentication in Farcaster</h3>
              <p className="text-sm text-gray-600">
                1. Complete the authentication in the Farcaster app<br/>
                2. Tap "Return to Farcaster" when done<br/>
                3. Return to this browser tab<br/>
                4. Tap "Check Status" below if needed
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <button
            onClick={async () => {
              console.log('Manual status check triggered')
              try {
                const response = await fetch(`/api/auth/farcaster/status?channelToken=${connectData.channelToken}`)
                const data = await response.json()
                console.log('Manual status check result:', data)
                if (data.state === 'completed' && data.signature) {
                  localStorage.setItem('farcaster_auth', JSON.stringify({
                    fid: data.fid,
                    username: data.username,
                    displayName: data.displayName,
                    pfpUrl: data.pfpUrl,
                    signature: data.signature,
                    message: data.message
                  }))
                  await refreshAuth()
                  setConnectData(null)
                  if (onSuccess) onSuccess()
                  window.location.reload()
                }
              } catch (error) {
                console.error('Manual status check error:', error)
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
          >
            Check Status
          </button>
          
          <button
            onClick={() => setConnectData(null)}
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Connecting...' : (children || 'Sign in with Farcaster')}
      </button>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 