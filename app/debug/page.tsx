"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function DebugPage() {
  const [info, setInfo] = useState({
    userAgent: "",
    url: "",
    isMiniApp: false,
    windowSize: { width: 0, height: 0 },
    referrer: "",
    timestamp: "",
  })

  useEffect(() => {
    // Check if we're running in a Farcaster Mini App environment
    const isFarcasterApp =
      window.location.href.includes("farcaster://") ||
      window.navigator.userAgent.includes("Farcaster") ||
      window.location.hostname.includes("warpcast.com") ||
      window.location.search.includes("fc-frame") ||
      window.parent !== window

    setInfo({
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      isMiniApp: isFarcasterApp,
      windowSize: { width: window.innerWidth, height: window.innerHeight },
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    })

    const handleResize = () => {
      setInfo((prev) => ({
        ...prev,
        windowSize: { width: window.innerWidth, height: window.innerHeight },
      }))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif mb-8">Debug Information</h1>

      <div className="border border-black/20 p-6 mb-8">
        <h2 className="text-xl font-serif mb-4">Environment</h2>
        <div className="space-y-2">
          <p>
            <strong>Is Mini App:</strong> {info.isMiniApp ? "Yes" : "No"}
          </p>
          <p>
            <strong>User Agent:</strong> <span className="text-sm break-all">{info.userAgent}</span>
          </p>
          <p>
            <strong>URL:</strong> <span className="text-sm break-all">{info.url}</span>
          </p>
          <p>
            <strong>Referrer:</strong> <span className="text-sm break-all">{info.referrer}</span>
          </p>
          <p>
            <strong>Window Size:</strong> {info.windowSize.width} x {info.windowSize.height}
          </p>
          <p>
            <strong>Timestamp:</strong> {info.timestamp}
          </p>
        </div>
      </div>

      <div className="border border-black/20 p-6 mb-8">
        <h2 className="text-xl font-serif mb-4">Navigation Test</h2>
        <div className="space-y-4">
          <Link href="/" className="lo-button inline-block">
            Go to Home
          </Link>
          <Link href="/map" className="lo-button inline-block ml-4">
            Go to Map
          </Link>
        </div>
      </div>

      <div className="border border-black/20 p-6">
        <h2 className="text-xl font-serif mb-4">Farcaster Integration</h2>
        <div className="space-y-4">
          <p>
            <strong>Frame Meta Tag:</strong> {document.querySelector('meta[name="fc:frame"]') ? "Present" : "Not found"}
          </p>
          <p>
            <strong>Frame Image Meta Tag:</strong>{" "}
            {document.querySelector('meta[name="fc:frame:image"]') ? "Present" : "Not found"}
          </p>
          <p>
            <strong>Manifest Link:</strong>{" "}
            {document.querySelector('link[rel="manifest"][href="/.well-known/farcaster.json"]')
              ? "Present"
              : "Not found"}
          </p>
        </div>
      </div>
    </div>
  )
}
