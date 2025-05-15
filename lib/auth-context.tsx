"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNeynarContext } from "@neynar/react"

interface AuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated, isLoading: neynarLoading } = useNeynarContext()
  const router = useRouter()

  // Update loading state based on Neynar loading state
  useEffect(() => {
    setIsLoading(neynarLoading)
  }, [neynarLoading])

  const signIn = async () => {
    try {
      setIsLoading(true)
      // The actual sign-in is handled by the NeynarAuthButton component
      // This is just a placeholder for compatibility with existing code
      return Promise.resolve()
    } catch (error) {
      console.error("Sign in error:", error)
      return Promise.reject(error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    // The actual sign-out is handled by the NeynarAuthButton component
    // This is just a placeholder for compatibility with existing code
    router.push("/")
  }

  const value = {
    isLoading,
    isAuthenticated: !!isAuthenticated,
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
