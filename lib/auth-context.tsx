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
    console.log("Auth context effect running")
    console.log("Neynar authenticated:", neynarAuthenticated)
    console.log("Neynar user:", neynarUser)

    // Check if the user is authenticated with Neynar
    if (neynarAuthenticated && neynarUser) {
      console.log("User authenticated with Neynar, setting local state")
      setIsAuthenticated(true)
      setUser(neynarUser)

      // Create or update user in Supabase
      const createOrUpdateUser = async () => {
        console.log("Starting createOrUpdateUser function")
        try {
          console.log("Checking if user exists in Supabase")
          // Check if user exists
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("farcaster_id", neynarUser.fid.toString())
            .single()

          console.log("Fetch result:", { existingUser, fetchError })

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching user:", fetchError)
            return
          }

          if (existingUser) {
            console.log("User exists, updating user data")
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

            console.log("Update result:", { data, error })

            if (error) {
              console.error("Error updating user:", error)
              return
            }

            setDbUser(data?.[0] || null)
            console.log("User updated successfully")
          } else {
            console.log("User doesn't exist, creating new user")
            // Create new user
            const userData = {
              farcaster_id: neynarUser.fid.toString(),
              farcaster_username: neynarUser.username,
              farcaster_display_name: neynarUser.display_name,
              farcaster_pfp_url: neynarUser.pfp_url,
            }
            console.log("User data to insert:", userData)

            const { data, error } = await supabase.from("users").insert(userData).select()

            console.log("Insert result:", { data, error })

            if (error) {
              console.error("Error creating user:", error)
              return
            }

            setDbUser(data?.[0] || null)
            console.log("User created successfully")
          }
        } catch (error) {
          console.error("Error in createOrUpdateUser:", error)
        } finally {
          setIsLoading(false)
          console.log("createOrUpdateUser function completed")
        }
      }

      createOrUpdateUser()
    } else {
      console.log("User not authenticated with Neynar")
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
