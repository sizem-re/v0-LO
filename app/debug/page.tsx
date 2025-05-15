"use client"

import { useEffect, useState } from "react"
import { useNeynarContext } from "@neynar/react"
import { useMiniApp } from "@/hooks/use-mini-app"

export default function DebugPage() {
  const { isAuthenticated, user } = useNeynarContext()
  const { isMiniApp } = useMiniApp()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [sdkInfo, setSdkInfo] = useState<any>({})

  useEffect(() => {
    // Collect debug information
    const info = {
      url: window.location.href,
      userAgent: window.navigator.userAgent,
      isMiniApp,
      isAuthenticated,
      user: user
        ? {
            fid: user.fid,
            username: user.username,
            displayName: user.display_name,
          }
        : null,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: new Date().toISOString(),
    }

    setDebugInfo(info)

    // Check Farcaster SDK
    if (window.farcaster) {
      setSdkInfo({
        available: true,
        isAuthenticated: window.farcaster.isAuthenticated ? window.farcaster.isAuthenticated() : "method not available",
        user: window.farcaster.getUser ? window.farcaster.getUser() : "method not available",
      })

      // Call setReady
      try {
        window.farcaster.setReady()
        console.log("Debug page: Called setReady")
      } catch (error) {
        console.error("Error calling setReady:", error)
      }
    } else {
      setSdkInfo({
        available: false,
      })
    }
  }, [isMiniApp, isAuthenticated, user])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif mb-8">Debug Information</h1>

      <div className="space-y-6">
        <section className="border border-black/20 p-4">
          <h2 className="text-xl font-serif mb-4">Environment</h2>
          <pre className="bg-gray-100 p-4 overflow-auto text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
        </section>

        <section className="border border-black/20 p-4">
          <h2 className="text-xl font-serif mb-4">Farcaster SDK</h2>
          <pre className="bg-gray-100 p-4 overflow-auto text-sm">{JSON.stringify(sdkInfo, null, 2)}</pre>
        </section>

        <section className="border border-black/20 p-4">
          <h2 className="text-xl font-serif mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (window.farcaster) {
                  window.farcaster.setReady()
                  alert("Called setReady()")
                } else {
                  alert("Farcaster SDK not available")
                }
              }}
              className="lo-button"
            >
              Call setReady()
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
