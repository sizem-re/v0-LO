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
            console.log("Authentication successful")
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
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  )
}
