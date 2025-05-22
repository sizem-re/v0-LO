"use client"

import { NeynarContextProvider, Theme } from "@neynar/react"
import "@neynar/react/dist/style.css"
import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function NeynarProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  // Clear auth error after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [authError])

  return (
    <>
      <NeynarContextProvider
        settings={{
          clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
          defaultTheme: Theme.Light,
          eventsCallbacks: {
            onAuthSuccess: () => {
              console.log("Authentication successful")
              // Refresh the page to update auth state
              setTimeout(() => {
                router.refresh()
              }, 500)
            },
            onSignout() {
              console.log("Signed out successfully")
              router.push("/")
            },
            onError: (error) => {
              console.error("Neynar authentication error:", error)
              setAuthError(error.message || "Authentication failed")
            },
          },
        }}
      >
        {children}

        {/* Error toast */}
        {authError && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
            {authError}
          </div>
        )}
      </NeynarContextProvider>
    </>
  )
}
