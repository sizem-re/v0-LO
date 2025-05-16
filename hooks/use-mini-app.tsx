"use client"

import { useState, useEffect, useCallback } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [detectionDetails, setDetectionDetails] = useState<Record<string, any>>({})

  // Create a function to check if we're in a Mini App environment
  const checkIfMiniApp = useCallback(() => {
    if (typeof window === "undefined") return false

    // Various ways to detect if we're in a Farcaster Mini App
    const url = new URL(window.location.href)
    const userAgent = window.navigator.userAgent
    const hostname = window.location.hostname

    // Check URL parameters first - this is most reliable for testing
    const forceMiniAppParam = url.searchParams.get("forceMiniApp") === "true"

    // If forceMiniApp is in the URL, set the global flag
    if (forceMiniAppParam && typeof window !== "undefined") {
      // @ts-ignore
      window.forceMiniApp = true
      // Add a class to the document for styling
      document.documentElement.classList.add("farcaster-mini-app")
    }

    // Collect all detection signals
    const signals = {
      miniPathname: url.pathname.startsWith("/mini"),
      miniAppParam: url.searchParams.get("miniApp") === "true",
      fcFrameParam: url.searchParams.has("fc-frame"),
      farcasterProtocol: window.location.href.includes("farcaster://"),
      farcasterUserAgent: userAgent.includes("Farcaster"),
      warpcastHostname: hostname.includes("warpcast.com"),
      farcasterFrameObject: "FarcasterFrame" in window,
      farcasterObject: "farcaster" in window,
      // Additional checks
      mobileApp: /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent),
      inIframe: window !== window.parent,
      hasNeynarParam: url.searchParams.has("neynar"),
      hasFrameParam: url.searchParams.has("frame"),
      // Check for the force flag we set
      forceMiniApp: Boolean(window.forceMiniApp),
      // Direct URL parameter check
      forceMiniAppParam,
    }

    // Log detailed detection information
    console.log("Mini App detection signals:", signals)
    setDetectionDetails(signals)

    // Consider it a mini app if ANY of these conditions are true
    const isFarcasterApp =
      signals.miniPathname ||
      signals.miniAppParam ||
      signals.fcFrameParam ||
      signals.farcasterProtocol ||
      signals.farcasterUserAgent ||
      signals.warpcastHostname ||
      signals.farcasterFrameObject ||
      signals.farcasterObject ||
      signals.hasNeynarParam ||
      signals.hasFrameParam ||
      signals.forceMiniApp ||
      signals.forceMiniAppParam

    console.log("Mini App detection result:", isFarcasterApp, {
      pathname: url.pathname,
      search: url.search,
      userAgent: userAgent,
      hostname: hostname,
      href: window.location.href,
    })

    return isFarcasterApp
  }, [])

  useEffect(() => {
    // Run the check immediately
    const result = checkIfMiniApp()
    setIsMiniApp(result)
    setIsLoading(false)

    // Also set up a listener for URL changes
    const handleUrlChange = () => {
      const result = checkIfMiniApp()
      setIsMiniApp(result)
    }

    window.addEventListener("popstate", handleUrlChange)

    // Check again after a short delay to catch any late initializations
    const timeoutId = setTimeout(() => {
      const result = checkIfMiniApp()
      setIsMiniApp(result)
    }, 500)

    return () => {
      window.removeEventListener("popstate", handleUrlChange)
      clearTimeout(timeoutId)
    }
  }, [checkIfMiniApp])

  return { isMiniApp, isLoading, detectionDetails, recheckMiniApp: checkIfMiniApp }
}
