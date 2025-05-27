"use client"

import { LogOut, List, ChevronLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNeynarContext, NeynarAuthButton } from "@neynar/react"
import { useAuth } from "@/lib/auth-context"
import { UserListsDisplay } from "@/components/user-lists-display"

interface UserProfileViewProps {
  onClose?: () => void
  expanded?: boolean
  onCreateList?: () => void
  onSelectList?: (listId: string) => void
}

export function UserProfileView({ onClose, expanded = false, onCreateList, onSelectList }: UserProfileViewProps) {
  const router = useRouter()
  const { user: neynarUser } = useNeynarContext()
  const { user: authUser, dbUser, isAuthenticated, logout } = useAuth()

  // Use authenticated user data (prioritize miniapp auth, fallback to Neynar)
  const user = authUser || neynarUser

  console.log("UserProfileView - authUser:", authUser)
  console.log("UserProfileView - dbUser:", dbUser)
  console.log("UserProfileView - neynarUser:", neynarUser)
  console.log("UserProfileView - final user:", user)

  // Enhanced logout function that handles both Neynar and custom auth
  const handleLogout = async () => {
    try {
      console.log("Starting logout process...")
      
      // Call our custom logout first (clears local state)
      await logout()
      
      // Force a page reload to ensure clean state
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
      // Force reload even if there's an error
      window.location.href = "/"
    }
  }

  // Format user data
  const displayUser = user
    ? {
        displayName:
          user.farcaster_display_name || 
          user.display_name ||
          user.farcaster_username ||
          user.username ||
          "User",
        username: user.farcaster_username || user.username || "user",
        pfp: user.farcaster_pfp_url || user.pfp_url || "/placeholder.svg",
        fid: user.farcaster_id || user.fid?.toString() || "0",
        bio: typeof user.profile?.bio === 'string' 
          ? user.profile.bio 
          : user.profile?.bio?.text || user.bio || "",
      }
    : {
        displayName: "Demo User",
        username: "demo_user",
        pfp: "/placeholder.svg",
        fid: "123456",
        bio: "This is a demo profile",
      }

  // Basic profile view for sidebar
  if (!expanded) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-16 h-16 border border-black/10 rounded-full overflow-hidden">
            <img
              src={displayUser.pfp || "/placeholder.svg"}
              alt={displayUser.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-lg">{displayUser.displayName}</h3>
            <p className="text-sm text-gray-600">@{displayUser.username}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/lists"
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
            onClick={onClose}
          >
            <List size={16} />
            <span>My Lists</span>
          </Link>

          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
            onClick={onCreateList}
          >
            <Plus size={16} />
            <span>Create List</span>
          </button>

          {/* Use NeynarAuthButton for proper logout */}
          <div className="px-4 py-2">
            <NeynarAuthButton 
              label="Sign Out"
              className="flex items-center gap-2 w-full text-left hover:bg-black/5 rounded-md text-red-600 border-0 bg-transparent p-0 font-normal"
            />
          </div>
        </div>
      </div>
    )
  }

  // Expanded profile view
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Back button */}
      <button className="flex items-center text-black hover:bg-black/5 p-2 rounded self-start mb-2" onClick={onClose}>
        <ChevronLeft size={16} className="mr-1" /> Back
      </button>

      {/* Profile Info */}
      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 border border-black/10 rounded-full overflow-hidden">
          <img
            src={displayUser.pfp || "/placeholder.svg"}
            alt={displayUser.displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-serif text-2xl mb-1">{displayUser.displayName}</h1>
          <p className="text-black/70">@{displayUser.username}</p>
          {displayUser.bio && <p className="text-gray-600 mt-2">{displayUser.bio}</p>}
          <p className="text-sm text-black/60 mt-1">Farcaster ID: {displayUser.fid}</p>
        </div>
      </div>

      {/* User's Lists */}
      <div className="mt-4">
        <h2 className="font-serif text-xl mb-3">My Lists</h2>
        {/* Use compact mode to match the My Lists tab style */}
        <UserListsDisplay onCreateList={onCreateList} onSelectList={onSelectList} compact={true} className="px-1" />
      </div>

      {/* Sign Out */}
      <div className="mt-6 pt-4 border-t border-black/10">
        <div className="px-4 py-2">
          <NeynarAuthButton 
            label="Sign Out"
            className="flex items-center gap-2 w-full text-left hover:bg-black/5 rounded-md text-red-600 border-0 bg-transparent p-0 font-normal"
          />
        </div>
      </div>
    </div>
  )
}
