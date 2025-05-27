"use client"

import { NeynarContextProvider, Theme } from "@neynar/react"
import "@neynar/react/dist/style.css"
import type React from "react"

export function NeynarProviderWrapper({ children }: { children: React.ReactNode }) {
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
            
            // Don't force a page reload - let React handle the state updates
            // The useNeynarContext hook will automatically update when auth succeeds
          },
          onSignout: () => {
            console.log("Neynar signed out successfully")
            
            // Clear any auth-related storage
            localStorage.removeItem('neynar_auth_success')
            localStorage.removeItem('farcaster_auth')
            localStorage.removeItem('pending_auth_code')
            sessionStorage.clear()
            
            // Don't automatically redirect - let the auth context handle it
            // window.location.href = "/"
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  )
}
