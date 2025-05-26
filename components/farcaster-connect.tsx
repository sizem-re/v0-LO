"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Smartphone, Monitor, RefreshCw } from 'lucide-react'
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

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use Neynar's SIWN (Sign In With Neynar) instead of broken Farcaster Connect
      const response = await fetch('/api/auth/neynar/signin', {
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate authentication')
      }

      const { url } = await response.json()
      
      // Redirect to Neynar's authentication page
      window.location.href = url
      
    } catch (err) {
      console.error('Error connecting with Farcaster:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start authentication. Please try again.'
      setError(errorMessage)
      onError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
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