"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define user type
type User = {
  fid: string
  username: string
  displayName?: string
  pfp?: string
  profile?: {
    bio?: string
  }
}

// Auth context type
type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: () => {},
})

// Auth provider props
type AuthProviderProps = {
  children: ReactNode
}

// Mock user for development
const MOCK_USER: User = {
  fid: "1234567",
  username: "taylorswift",
  displayName: "Taylor Swift",
  pfp: "/placeholder.svg?height=100&width=100",
  profile: {
    bio: "Singer-songwriter and Farcaster enthusiast",
  },
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already signed in (e.g., from localStorage)
    const checkAuth = async () => {
      try {
        // For development, just set the mock user after a short delay
        // In production, you would check localStorage or session storage
        setTimeout(() => {
          // Uncomment to simulate a logged-in user
          // setUser(MOCK_USER)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // In a real app, this would call Farcaster authentication
      // For now, just set the mock user after a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setUser(MOCK_USER)
      localStorage.setItem("isAuthenticated", "true")
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("isAuthenticated")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 