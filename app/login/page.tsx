"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { NeynarAuthButton } from "@neynar/react"
import { PageLayout } from "@/components/page-layout"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/profile")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Checking authentication status...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8 text-center">Connect with Farcaster</h1>

          <div className="border border-black p-8">
            <p className="mb-6 text-center">
              Connect with your Farcaster account to create and save lists of your favorite places.
            </p>

            {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

            <div className="flex justify-center">
              <NeynarAuthButton
                className="bg-black text-white hover:bg-black/80 px-6 py-3 rounded-none"
                onError={(err) => setError(err.message || "Authentication failed")}
              />
            </div>

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
    </PageLayout>
  )
}
