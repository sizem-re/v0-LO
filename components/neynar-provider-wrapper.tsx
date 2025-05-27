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
            console.log("Neynar authentication successful")
            
            // Store success flag for cross-tab communication
            localStorage.setItem('neynar_auth_success', Date.now().toString())
            
            // Small delay to ensure auth state is fully updated
            setTimeout(() => {
              console.log("Triggering page refresh after auth success")
              window.location.reload()
            }, 1000)
          },
          onSignout: () => {
            console.log("Neynar signed out successfully")
            
            // Clear any auth-related storage
            localStorage.removeItem('neynar_auth_success')
            localStorage.removeItem('farcaster_auth')
            localStorage.removeItem('pending_auth_code')
            sessionStorage.clear()
            
            // Redirect to home
            window.location.href = "/"
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  )
}
