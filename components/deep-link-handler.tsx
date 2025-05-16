"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Suspense } from "react"

// Inner component that uses client-side hooks
function DeepLinkHandlerInner() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com")

    if (!isFarcasterApp) return

    // Handle deep links
    const handleDeepLink = (event: any) => {
      const url = event.detail?.url || event.url
      if (!url) return

      try {
        const parsedUrl = new URL(url)
        const path = parsedUrl.pathname

        // Only navigate if the path is different
        if (path && path !== pathname) {
          router.push(path)
        }
      } catch (error) {
        console.error("Error handling deep link:", error)
      }
    }

    // Listen for deep link events from the Farcaster client
    window.addEventListener("farcaster:url", handleDeepLink)

    // Check for initial deep link
    if (window.location.href.includes("?initial_url=")) {
      const params = new URLSearchParams(window.location.search)
      const initialUrl = params.get("initial_url")
      if (initialUrl) {
        handleDeepLink({ url: initialUrl })
      }
    }

    return () => {
      window.removeEventListener("farcaster:url", handleDeepLink)
    }
  }, [router, pathname])

  return null
}

// Wrapper component with Suspense
export function DeepLinkHandler() {
  return (
    <Suspense fallback={null}>
      <DeepLinkHandlerInner />
    </Suspense>
  )
}
