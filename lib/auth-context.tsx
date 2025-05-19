"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  dbUser: any | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  dbUser: null,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [dbUser, setDbUser] = useState<any | null>(null)
  const { isAuthenticated: neynarAuthenticated, user: neynarUser, signOut: neynarSignOut } = useNeynarContext()
  const router = useRouter()

  useEffect(() => {
    // Check if the user is authenticated with Neynar
    if (neynarAuthenticated && neynarUser) {
      setIsAuthenticated(true)
      setUser(neynarUser)

      // Create or update user in Supabase via server-side API
      const createOrUpdateUser = async () => {
        try {
          // Use the server-side API to create/update user (bypasses RLS)
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

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Error registering user:", errorData)

            // Even if registration fails, we'll still consider the user authenticated with Neynar
          } else {
            const userData = await response.json()
            setDbUser(userData)
            console.log("User registered successfully:", userData)
          }
        } catch (error) {
          console.error("Error in createOrUpdateUser:", error)
        } finally {
          setIsLoading(false)
        }
      }

      createOrUpdateUser()
    } else {
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)
      setIsLoading(false)
    }
  }, [neynarAuthenticated, neynarUser])

  const logout = async () => {
    try {
      console.log("Logout function called")

      // Clear local state first
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)

      // Clear local storage
      localStorage.removeItem("user")

      // Call server-side logout endpoint
      try {
        await fetch("/api/auth/logout", { method: "POST" })
        console.log("Server-side logout successful")
      } catch (serverError) {
        console.error("Server-side logout error:", serverError)
      }

      // Try to sign out from Neynar
      if (typeof neynarSignOut === "function") {
        try {
          await neynarSignOut()
          console.log("Neynar signOut successful")
        } catch (neynarError) {
          console.error("Neynar signOut error:", neynarError)
        }
      } else {
        console.log("Neynar signOut function not available")
      }

      // Force reload the page to clear all state
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
      // Force reload even if there's an error
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, dbUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
