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
    
    // Check for Frame authentication token in URL first (for miniapp support)
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

    // Clean up any OAuth callback parameters from URL (mobile flow cleanup)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code && window.location.pathname === '/') {
      console.log('Cleaning up OAuth parameters from home page URL')
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('code')
      newUrl.searchParams.delete('state')
      // Clean up any other auth-related parameters
      newUrl.searchParams.delete('fid')
      newUrl.searchParams.delete('signer_uuid')
      newUrl.searchParams.delete('username')
      newUrl.searchParams.delete('display_name')
      newUrl.searchParams.delete('pfp_url')
      newUrl.searchParams.delete('bio')
      newUrl.searchParams.delete('custody_address')
      newUrl.searchParams.delete('follower_count')
      newUrl.searchParams.delete('following_count')
      newUrl.searchParams.delete('access_token')
      window.history.replaceState({}, '', newUrl.toString())
    }

    // Clear any legacy auth data
    localStorage.removeItem('farcaster_auth')
    localStorage.removeItem('pending_auth_code')

    // Use the official Neynar React SDK authentication
    if (neynarAuthenticated && neynarUser) {
      console.log('Using Neynar React SDK authentication:', neynarUser)
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
      console.log('No Neynar authentication found')
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
      console.log("Starting logout process...")
      
      // Clear local state first
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)
      setIsLoading(false)

      // Clear any stored auth data (legacy cleanup)
      try {
        localStorage.removeItem('farcaster_auth')
        localStorage.removeItem('neynar_auth_success')
        localStorage.removeItem('pending_auth_code')
        sessionStorage.clear()
      } catch (storageError) {
        console.warn("Error clearing storage:", storageError)
      }

      // The Neynar React SDK should handle its own logout via the onSignout callback
      // which is configured in the NeynarProviderWrapper
      
      // Force a hard reload to ensure clean state
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
      
    } catch (error) {
      console.error("Error during logout:", error)
      // Force reload even if there's an error
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
