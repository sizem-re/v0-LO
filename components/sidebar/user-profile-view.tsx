"use client"

import { User, LogOut, List, MapPin } from "lucide-react"
import Link from "next/link"
import { useNeynarContext } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"

interface UserProfileViewProps {
  onClose?: () => void
}

export function UserProfileView({ onClose }: UserProfileViewProps) {
  const { logout } = useAuth()
  const { user, signOut } = useNeynarContext()

  const handleSignOut = async () => {
    if (typeof signOut === "function") {
      await signOut()
    }
    if (onClose) {
      onClose()
    }
    window.location.href = "/"
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        {user?.pfp_url ? (
          <img
            src={user.pfp_url || "/placeholder.svg"}
            alt={user?.display_name || "Profile"}
            className="w-16 h-16 rounded-full border border-black/10"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={32} className="text-gray-500" />
          </div>
        )}
        <div>
          <h3 className="font-medium text-lg">{user?.display_name || user?.username || "User"}</h3>
          <p className="text-sm text-gray-600">@{user?.username || "user"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
          onClick={onClose}
        >
          <User size={16} />
          <span>View Profile</span>
        </Link>
        <Link
          href="/lists"
          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
          onClick={onClose}
        >
          <List size={16} />
          <span>My Lists</span>
        </Link>
        <Link
          href="/map"
          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
          onClick={onClose}
        >
          <MapPin size={16} />
          <span>Saved Places</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md text-red-600"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
