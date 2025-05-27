"use client"

import { NeynarContextProvider, Theme } from "@neynar/react"
import "@neynar/react/dist/style.css"
import type React from "react"
import { useEffect } from "react"

export function NeynarProviderWrapper({ children }: { children: React.ReactNode }) {
  // Suppress the useNativeDriver warning from Neynar SDK's RemoteImage component
  useEffect(() => {
    const originalWarn = console.warn
    
    console.warn = (...args) => {
      // Filter out the specific useNativeDriver warning from Neynar's RemoteImage component
      const message = args[0]
      if (
        typeof message === 'string' && 
        message.includes('useNativeDriver') && 
        message.includes('RCTAnimation')
      ) {
        // Silently ignore this warning as it's expected in web environments
        return
      }
      // Allow all other warnings to pass through
      originalWarn(...args)
    }
    
    // Cleanup function to restore original console.warn
    return () => {
      console.warn = originalWarn
    }
  }, [])

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
