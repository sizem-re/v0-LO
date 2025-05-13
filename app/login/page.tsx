"use client"

import { useState } from "react"
import { useAuth } from "../../lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/profile")
    return null
  }

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Farcaster")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif mb-8 text-center">Connect with Farcaster</h1>

        <div className="border border-black p-8">
          <p className="mb-6 text-center">
            Connect with your Farcaster account to create and save lists of your favorite places.
          </p>

          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

          <button onClick={handleSignIn} disabled={isLoading} className="lo-button w-full">
            {isLoading ? "CONNECTING..." : "CONNECT WITH FARCASTER"}
          </button>

          <p className="mt-6 text-sm text-black/70 text-center">
            Don't have a Farcaster account?{" "}
            <a href="https://www.farcaster.xyz/" target="_blank" rel="noopener noreferrer" className="underline">
              Learn more
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm hover:underline">
            Continue browsing without connecting
          </Link>
        </div>
      </div>
    </div>
  )
}
