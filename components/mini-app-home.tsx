"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, ListIcon, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useNeynarContext } from "@neynar/react"

export function MiniAppHome() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { isAuthenticated, user } = useNeynarContext()

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com") ||
      new URLSearchParams(window.location.search).has("fc-frame")

    setIsMiniApp(isFarcasterApp)
    setIsLoading(false)

    // Log for debugging
    console.log("Mini App Home loaded:", {
      isFarcasterApp,
      isAuthenticated,
      user: user ? "present" : "not present",
    })
  }, [isAuthenticated, user])

  if (!isMiniApp || isLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col">
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif mb-6">LO</h1>
        <p className="text-lg text-center mb-8">Discover and share curated lists of locations</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <Link href="/discover" className="lo-button flex flex-col items-center justify-center p-6">
            <Search className="h-8 w-8 mb-2" />
            <span>Discover</span>
          </Link>

          <Link href="/map" className="lo-button flex flex-col items-center justify-center p-6">
            <MapPin className="h-8 w-8 mb-2" />
            <span>Map</span>
          </Link>

          {isAuthenticated ? (
            <Link href="/lists" className="lo-button flex flex-col items-center justify-center p-6 col-span-2">
              <ListIcon className="h-8 w-8 mb-2" />
              <span>My Lists</span>
            </Link>
          ) : (
            <Link href="/login" className="lo-button flex flex-col items-center justify-center p-6 col-span-2">
              <span>Connect with Farcaster</span>
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-black/10 text-center text-xs text-black/60">LO - Farcaster Mini App</div>
    </div>
  )
}
