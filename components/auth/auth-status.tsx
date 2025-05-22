"use client"

import { useAuth } from "@/lib/auth-context"
import { useNeynarContext, NeynarAuthButton } from "@neynar/react"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function AuthStatus() {
  const { isAuthenticated, isLoading, user, dbUser } = useAuth()
  const { isAuthenticated: neynarAuthenticated } = useNeynarContext()
  const [syncingUser, setSyncingUser] = useState(false)

  // Check if we need to sync the user with Supabase
  useEffect(() => {
    if (neynarAuthenticated && !dbUser) {
      setSyncingUser(true)
    } else {
      setSyncingUser(false)
    }
  }, [neynarAuthenticated, dbUser])

  if (isLoading || syncingUser) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{syncingUser ? "Syncing account..." : "Loading..."}</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <NeynarAuthButton className="lo-button text-sm" />
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        Connected as <span className="font-medium">{user?.username || "User"}</span>
      </div>
      {user?.pfp_url && (
        <img
          src={user.pfp_url || "/placeholder.svg"}
          alt={user.username || "User"}
          className="h-6 w-6 rounded-full border border-black/10"
        />
      )}
    </div>
  )
}
