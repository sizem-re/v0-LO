"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function FarcasterMiniappHandler() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const checkFarcasterEnvironment = () => {
      const isFarcasterApp =
        window.location.href.includes("farcaster://") ||
        window.navigator.userAgent.includes("Farcaster") ||
        window.location.hostname.includes("warpcast.com") ||
        window.location.search.includes("fc-frame") ||
        // Additional check for Farcaster's embedded webview
        window.parent !== window

      setIsMiniApp(isFarcasterApp)

      if (isFarcasterApp) {
        console.log("Running in Farcaster miniapp environment")
        document.documentElement.classList.add("farcaster-mini-app")

        // Listen for messages from Farcaster
        window.addEventListener("message", handleFarcasterMessage)
      }
    }

    const handleFarcasterMessage = (event: MessageEvent) => {
      // Handle messages from Farcaster client
      console.log("Received message:", event.data)

      // Example: Handle deep linking
      if (event.data?.type === "farcaster:url") {
        const url = event.data.url
        if (url) {
          try {
            const parsedUrl = new URL(url)
            router.push(parsedUrl.pathname)
          } catch (error) {
            console.error("Error handling deep link:", error)
          }
        }
      }
    }

    // Run the check after a short delay to ensure everything is loaded
    setTimeout(checkFarcasterEnvironment, 100)

    return () => {
      window.removeEventListener("message", handleFarcasterMessage)
    }
  }, [router])

  // This component doesn't render anything visible
  return null
}
