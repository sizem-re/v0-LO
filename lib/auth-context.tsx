"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"
import { supabase } from "./supabase-client"

interface DbUser {
  id: string
  farcaster_id: string
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  dbUser: DbUser | null
  logout: () => Promise<void>
  refreshDbUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  dbUser: null,
  logout: async () => {},
  refreshDbUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const { isAuthenticated: neynarAuthenticated, user: neynarUser, signOut: neynarSignOut } = useNeynarContext()

  // Function to refresh the database user
  const refreshDbUser = async () => {
    if (!neynarUser?.fid) return null

    try {
      // First check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("farcaster_id", neynarUser.fid.toString())
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user from Supabase:", fetchError)
        return null
      }

      if (existingUser) {
        setDbUser(existingUser as DbUser)
        return existingUser
      }

      // If user doesn't exist, create via API route
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
        throw new Error("Failed to register user")
      }

      const userData = await response.json()
      setDbUser(userData as DbUser)
      return userData
    } catch (error) {
      console.error("Error in refreshDbUser:", error)
      return null
    }
  }

  useEffect(() => {
    // Check if the user is authenticated with Neynar
    if (neynarAuthenticated && neynarUser) {
      setIsAuthenticated(true)
      setUser(neynarUser)

      // Create or update user in Supabase
      const syncUser = async () => {
        try {
          await refreshDbUser()
        } catch (error) {
          console.error("Error syncing user with Supabase:", error)
        } finally {
          setIsLoading(false)
        }
      }

      syncUser()
    } else {
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)
      setIsLoading(false)
    }
  }, [neynarAuthenticated, neynarUser])

  const logout = async () => {
    try {
      // Clear local state
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)

      // Try to sign out from Neynar
      if (typeof neynarSignOut === "function") {
        await neynarSignOut()
      }

      // Reload the page to clear all state
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        dbUser,
        logout,
        refreshDbUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
