"use client"

import { NeynarContextProvider, Theme } from "@neynar/react"
import "@neynar/react/dist/style.css"
import type React from "react"
import { useRouter } from "next/navigation"

export function NeynarProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Light,
        eventsCallbacks: {
          onAuthSuccess: () => {
            // Redirect to profile page or refresh current page
            console.log("Authentication successful")
            // Avoid immediate redirect to prevent race conditions with state updates
            setTimeout(() => {
              router.refresh()
            }, 500)
          },
          onSignout() {
            // Handle sign out, e.g., redirect to home page
            console.log("Signed out successfully")
            router.push("/")
          },
          onError: (error) => {
            console.error("Neynar authentication error:", error)
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  )
}
