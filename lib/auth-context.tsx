"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()

  useEffect(() => {
    // Check if the user is authenticated with Neynar
    if (neynarAuthenticated && neynarUser) {
      setIsAuthenticated(true)
      setUser(neynarUser)
      setIsLoading(false)
      return
    }

    // Check if the user is authenticated with our own system
    // This is a simplified example - in a real app, you would check with your backend
    const checkAuth = async () => {
      try {
        // Simulate an API call to check authentication
        await new Promise((resolve) => setTimeout(resolve, 500))

        // For demo purposes, we'll just check localStorage
        const storedUser = localStorage.getItem("user")

        if (storedUser) {
          setIsAuthenticated(true)
          setUser(JSON.parse(storedUser))
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [neynarAuthenticated, neynarUser])

  const logout = () => {
    // Clear local authentication
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
  }

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
