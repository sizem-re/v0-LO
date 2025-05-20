"use client"

import { useState } from "react"
import { ChevronLeft, LogOut, Settings, User, ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface ProfileViewProps {
  user: any
  onBack: () => void
  onSignOut?: () => void
}

export function ProfileView({ user, onBack, onSignOut }: ProfileViewProps) {
  const { dbUser } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (!onSignOut) return

    setIsSigningOut(true)
    try {
      await onSignOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-black/10 flex items-center">
        <button onClick={onBack} className="p-1 mr-2 hover:bg-gray-100 rounded-sm" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-medium">Profile</h2>
      </div>

      <div className="p-4 flex flex-col items-center border-b border-black/10">
        {user?.pfp_url ? (
          <img
            src={user.pfp_url || "/placeholder.svg"}
            alt={user.displayName || user.username || "User"}
            className="w-20 h-20 rounded-full border border-black/10 mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border border-black/10 flex items-center justify-center mb-3 bg-gray-100">
            <User className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <h3 className="font-medium text-lg">{user?.displayName || user?.username || "User"}</h3>
        {user?.username && <p className="text-sm text-black/60">@{user.username}</p>}
      </div>

      <div className="p-4 flex-grow">
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start border-black/20 hover:bg-gray-50"
            onClick={() => router.push("/lists")}
          >
            <ListIcon className="mr-2 h-4 w-4" />
            My Lists
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start border-black/20 hover:bg-gray-50"
            onClick={() => router.push("/profile")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start border-black/20 hover:bg-gray-50 text-red-600 hover:text-red-700"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  )
}
