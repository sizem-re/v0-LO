"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  username: string
  displayName: string
  pfp?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data
const MOCK_USER: User = {
  id: "user123",
  username: "demo_user",
  displayName: "Demo User",
  pfp: "/diverse-avatars.png",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true)

      // Check if we have a stored user in localStorage
      const storedUser = localStorage.getItem("lo_user")

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error("Error parsing stored user:", error)
          localStorage.removeItem("lo_user")
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const signIn = async () => {
    try {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Set mock user
      setUser(MOCK_USER)

      // Store in localStorage
      localStorage.setItem("lo_user", JSON.stringify(MOCK_USER))

      return Promise.resolve()
    } catch (error) {
      console.error("Sign in error:", error)
      return Promise.reject(error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    // Clear auth data
    localStorage.removeItem("lo_user")
    setUser(null)
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
