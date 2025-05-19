"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"
import { supabase } from "@/lib/supabase-client"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  dbUser: any | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  dbUser: null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [dbUser, setDbUser] = useState<any | null>(null)
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()

  useEffect(() => {
    // Check if the user is authenticated with Neynar
    if (neynarAuthenticated && neynarUser) {
      setIsAuthenticated(true)
      setUser(neynarUser)

      // Create or update user in Supabase
      const createOrUpdateUser = async () => {
        try {
          // Check if user exists
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("farcaster_id", neynarUser.fid.toString())
            .single()

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching user:", fetchError)
            return
          }

          if (existingUser) {
            // Update existing user
            const { data, error } = await supabase
              .from("users")
              .update({
                farcaster_username: neynarUser.username,
                farcaster_display_name: neynarUser.display_name,
                farcaster_pfp_url: neynarUser.pfp_url,
                updated_at: new Date().toISOString(),
              })
              .eq("farcaster_id", neynarUser.fid.toString())
              .select()

            if (error) {
              console.error("Error updating user:", error)
              return
            }

            setDbUser(data?.[0] || null)
          } else {
            // Create new user
            const { data, error } = await supabase
              .from("users")
              .insert({
                farcaster_id: neynarUser.fid.toString(),
                farcaster_username: neynarUser.username,
                farcaster_display_name: neynarUser.display_name,
                farcaster_pfp_url: neynarUser.pfp_url,
              })
              .select()

            if (error) {
              console.error("Error creating user:", error)
              return
            }

            setDbUser(data?.[0] || null)
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

  const logout = () => {
    // Clear local authentication
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
    setDbUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, dbUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
