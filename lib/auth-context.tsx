"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthStatus, getFarcasterUser } from "@/lib/farcaster-auth"

type FarcasterUser = {
  fid: number
  username: string
  displayName: string
  pfp: string
  profile?: {
    bio?: string
  }
}

interface AuthContextType {
  user: FarcasterUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to check authentication status and load user data
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const status = await getAuthStatus()

      if (status.authenticated && status.fid) {
        const userData = await getFarcasterUser(status.fid)
        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()

    // Listen for messages from the Farcaster Auth popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return

      if (event.data?.type === "farcaster:auth:success" && event.data?.fid) {
        localStorage.setItem("farcaster_fid", event.data.fid.toString())
        checkAuth()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const signIn = async () => {
    try {
      setIsLoading(true)

      // Open a popup for Farcaster Auth
      const width = 400
      const height = 600
      const left = window.innerWidth / 2 - width / 2
      const top = window.innerHeight / 2 - height / 2

      window.open("/auth/farcaster", "farcaster-auth", `width=${width},height=${height},top=${top},left=${left}`)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    // Clear auth data from local storage
    localStorage.removeItem("farcaster_fid")

    // Reset user state
    setUser(null)

    // Redirect to home page
    router.push("/")
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
