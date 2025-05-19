"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNeynarContext } from "@neynar/react"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

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
  const { isAuthenticated: neynarAuthenticated, user: neynarUser, signOut: neynarSignOut } = useNeynarContext()
  const router = useRouter()

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
            .maybeSingle()

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching user:", fetchError)
            setIsLoading(false)
            return
          }

          if (existingUser) {
            // Update existing user
            const { data, error } = await supabase
              .from("users")
              .update({
                farcaster_username: neynarUser.username || "",
                farcaster_display_name: neynarUser.display_name || "",
                farcaster_pfp_url: neynarUser.pfp_url || "",
                updated_at: new Date().toISOString(),
              })
              .eq("farcaster_id", neynarUser.fid.toString())
              .select()

            if (error) {
              console.error("Error updating user:", error)
            } else {
              setDbUser(data?.[0] || null)
            }
          } else {
            // Try to create the user with a server-side API call
            try {
              const response = await fetch("/api/users/create", {
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
                console.error("Error creating user via API:", errorData)
              } else {
                const userData = await response.json()
                setDbUser(userData)
              }
            } catch (apiError) {
              console.error("API call error:", apiError)

              // Fallback to direct client-side creation if API fails
              try {
                const { data, error } = await supabase
                  .from("users")
                  .insert({
                    farcaster_id: neynarUser.fid.toString(),
                    farcaster_username: neynarUser.username || "",
                    farcaster_display_name: neynarUser.display_name || "",
                    farcaster_pfp_url: neynarUser.pfp_url || "",
                  })
                  .select()

                if (error) {
                  console.error("Error in fallback user creation:", error)
                } else {
                  setDbUser(data?.[0] || null)
                }
              } catch (fallbackError) {
                console.error("Fallback creation error:", fallbackError)
              }
            }
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
      // Clear local authentication
      localStorage.removeItem("user")
      setIsAuthenticated(false)
      setUser(null)
      setDbUser(null)

      // Sign out from Neynar if available
      if (typeof neynarSignOut === "function") {
        await neynarSignOut()
      }

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still redirect even if there's an error
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, dbUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
