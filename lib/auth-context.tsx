"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  dbUser: any | null
  logout: () => Promise<void>
  authenticateWithMiniapp: (token: string) => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  dbUser: null,
  logout: async () => {},
  authenticateWithMiniapp: async () => {},
  refreshAuth: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [dbUser, setDbUser] = useState<any | null>(null)
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()

  // Function to refresh authentication state
  const refreshAuth = async () => {
    setIsLoading(true)
    
    // Check for Frame authentication token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')
    
    if (authToken) {
      try {
        const response = await fetch("/api/auth/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: authToken }),
        })

        if (response.ok) {
          const { user: frameUser } = await response.json()
          setIsAuthenticated(true)
          setUser(frameUser)
          setDbUser(frameUser)
          
          // Clean up URL by removing the auth token
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('auth')
          window.history.replaceState({}, '', newUrl.toString())
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error("Frame auth error:", error)
      }
    }

    // Fall back to regular Neynar authentication
    if (neynarAuthenticated && neynarUser) {
      setIsAuthenticated(true)
      setUser(neynarUser)

      // Create or update user in Supabase via server-side API
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            farcaster_id: neynarUser.fid.toString(),
            farcaster_username: neynarUser.username || "",
            farcaster_display_name: neynarUser.display_name || "",
            farcaster_pfp_url: neynarUser.pfp_url || "",
          }),
        })

        if (response.ok) {
          const userData = await response.json()
          setDbUser(userData)
          console.log("User registered successfully:", userData)
        }
      } catch (error) {
        console.error("Error in createOrUpdateUser:", error)
      }
    } else {
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    refreshAuth()
  }, [neynarAuthenticated, neynarUser])

  const logout = async () => {
    try {
      // Clear local state
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)

      // Clear any stored tokens
      localStorage.clear()
      sessionStorage.clear()

      // Reload the page to clear all state and trigger Neynar logout
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
      window.location.href = "/"
    }
  }

  const authenticateWithMiniapp = async (token: string) => {
    try {
      setIsLoading(true)
      
      console.log("Sending miniapp auth request with token...")
      
      const response = await fetch("/api/auth/farcaster-miniapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      console.log("Miniapp auth response status:", response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log("Miniapp auth response data:", responseData)
        
        const { user: miniappUser } = responseData
        console.log("Setting user data:", miniappUser)
        
        setIsAuthenticated(true)
        setUser(miniappUser)
        setDbUser(miniappUser)
      } else {
        const errorData = await response.text()
        console.error("Miniapp auth failed with status:", response.status, "Error:", errorData)
        throw new Error("Miniapp authentication failed")
      }
    } catch (error) {
      console.error("Miniapp auth error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      dbUser, 
      logout, 
      authenticateWithMiniapp,
      refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Add the missing getAuthenticatedUser function
export async function getAuthenticatedUser() {
  try {
    // This is a server-side function to get the authenticated user
    const response = await fetch("/api/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const userData = await response.json()
      return userData
    }

    return null
  } catch (error) {
    console.error("Error in getAuthenticatedUser:", error)
    return null
  }
}
