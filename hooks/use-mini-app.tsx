"use client"

import { useState, useEffect } from "react"

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [detectionDetails, setDetectionDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const checkIfMiniApp = () => {
      if (typeof window === "undefined") return

      // Various ways to detect if we're in a Farcaster Mini App
      const url = new URL(window.location.href)
      const userAgent = window.navigator.userAgent
      const hostname = window.location.hostname

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
        // Force detection in development for testing
        (process.env.NODE_ENV === "development" && url.searchParams.has("forceMiniApp"))

      console.log("Mini App detection result:", isFarcasterApp, {
        pathname: url.pathname,
        search: url.search,
        userAgent: userAgent,
        hostname: hostname,
        href: window.location.href,
      })

      setIsMiniApp(isFarcasterApp)
      setIsLoading(false)
    }

    // Run the check immediately if document is already loaded
    if (document.readyState === "complete") {
      checkIfMiniApp()
    } else {
      // Otherwise wait for the document to load
      window.addEventListener("load", checkIfMiniApp)
      return () => window.removeEventListener("load", checkIfMiniApp)
    }
  }, [])

  return { isMiniApp, isLoading, detectionDetails }
}
