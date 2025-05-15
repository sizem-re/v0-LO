"use client"

import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function DeepLinkHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com") ||
      searchParams.has("fc-frame")

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
          console.log("Deep link navigation to:", path)
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
      const initialUrl = searchParams.get("initial_url")
      if (initialUrl) {
        console.log("Initial deep link:", initialUrl)
        handleDeepLink({ url: initialUrl })
      }
    }

    // Check for fc-frame parameter which might contain a path
    const fcFrame = searchParams.get("fc-frame")
    if (fcFrame && fcFrame.startsWith("/")) {
      console.log("FC-frame path:", fcFrame)
      router.push(fcFrame)
    }

    return () => {
      window.removeEventListener("farcaster:url", handleDeepLink)
    }
  }, [router, pathname, searchParams])

  return null
}
