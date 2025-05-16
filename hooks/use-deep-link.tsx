"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useFarcasterSDK } from "@/lib/farcaster-sdk-context"

export function useDeepLink() {
  const router = useRouter()
  const { isMiniApp, sdk } = useFarcasterSDK()

  const handleDeepLink = useCallback(
    (url: string) => {
      try {
        const parsedUrl = new URL(url)
        const path = parsedUrl.pathname

        // Only navigate if the path is different from current path
        if (path && path !== window.location.pathname) {
          router.push(path)
        }
      } catch (error) {
        console.error("Error handling deep link:", error)
      }
    },
    [router],
  )

  useEffect(() => {
    if (!isMiniApp) return

    // Handle deep link events from the Farcaster client
    const handleDeepLinkEvent = (event: any) => {
      const url = event.detail?.url || event.url
      if (!url) return
      handleDeepLink(url)
    }

    // Listen for deep link events
    window.addEventListener("farcaster:url", handleDeepLinkEvent)

    // Check for initial deep link
    if (window.location.href.includes("?initial_url=")) {
      const params = new URLSearchParams(window.location.search)
      const initialUrl = params.get("initial_url")
      if (initialUrl) {
        handleDeepLink(initialUrl)
      }
    }

    return () => {
      window.removeEventListener("farcaster:url", handleDeepLinkEvent)
    }
  }, [isMiniApp, handleDeepLink])

  return { handleDeepLink }
}
