"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FarcasterConnect } from "@/components/farcaster-connect"
import { useNeynarContext } from "@neynar/react"
// Import the PageLayout at the top
import { PageLayout } from "@/components/page-layout"

// Wrap the entire component with PageLayout
export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const { isAuthenticated: neynarAuthenticated } = useNeynarContext()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated || neynarAuthenticated) {
      router.push("/profile")
    }
  }, [isAuthenticated, neynarAuthenticated, router])

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
              <FarcasterConnect />
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
