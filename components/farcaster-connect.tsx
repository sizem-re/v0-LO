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
  const { refreshAuth } = useAuth()

  useEffect(() => {
    // Load Neynar SIWN script
    const script = document.createElement('script')
    script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js'
    script.async = true
    document.body.appendChild(script)

    // Define global callback function
    ;(window as any).onSignInSuccess = async (data: any) => {
      try {
        console.log('SIWN success:', data)
        
        // Store the authentication data
        const authData = {
          fid: data.fid,
          username: data.username,
          displayName: data.displayName,
          pfpUrl: data.pfpUrl,
          bio: data.bio,
          custodyAddress: data.custodyAddress,
          verifications: data.verifications || [],
          followerCount: data.followerCount,
          followingCount: data.followingCount,
          signerUuid: data.signerUuid,
          accessToken: data.token,
          authenticatedAt: new Date().toISOString(),
        }

        localStorage.setItem('farcaster_auth', JSON.stringify(authData))
        
        // Refresh auth context
        await refreshAuth()
        
        toast.success('Successfully connected with Farcaster!')
        onSuccess?.()
        
        // Refresh the page to ensure all components update
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
      } catch (err) {
        console.error('Error handling SIWN success:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication'
        setError(errorMessage)
        onError?.(errorMessage)
        toast.error(errorMessage)
      }
    }

    return () => {
      document.body.removeChild(script)
      delete (window as any).onSignInSuccess
    }
  }, [refreshAuth, onSuccess, onError])

  const handleConnect = () => {
    setIsLoading(true)
    setError(null)
    
    // The SIWN script will handle the authentication
    // We just need to trigger it by clicking the button
    const siwn = document.querySelector('.neynar_signin') as HTMLElement
    if (siwn) {
      siwn.click()
    } else {
      setError('SIWN not loaded. Please refresh and try again.')
      setIsLoading(false)
    }
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
        
        {/* Hidden Neynar SIWN button */}
        <div 
          className="neynar_signin hidden" 
          data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
          data-success-callback="onSignInSuccess"
          data-theme="light"
        />
        
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
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