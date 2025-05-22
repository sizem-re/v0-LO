"use client"

import { User, LogOut, List, MapPin, ChevronLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNeynarContext, NeynarAuthButton } from "@neynar/react"
import { Button } from "@/components/ui/button"

interface UserProfileViewProps {
  onClose?: () => void
  expanded?: boolean
}

export function UserProfileView({ onClose, expanded = false }: UserProfileViewProps) {
  const router = useRouter()
  const { user } = useNeynarContext()

  // Format user data
  const displayUser = user
    ? {
        displayName:
          typeof user.display_name === "string"
            ? user.display_name
            : typeof user.username === "string"
              ? user.username
              : "User",
        username: typeof user.username === "string" ? user.username : "user",
        pfp: user.pfp_url || "/placeholder.svg",
        fid: user.fid?.toString() || "0",
        bio: typeof user.profile?.bio === "string" ? user.profile.bio : "",
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
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
            onClick={() => {
              if (onClose) onClose()
              router.push("/")
            }}
          >
            <User size={16} />
            <span>View Full Profile</span>
          </button>
          <Link
            href="/lists"
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
            onClick={onClose}
          >
            <List size={16} />
            <span>My Lists</span>
          </Link>
          <Link
            href="/places"
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md"
            onClick={onClose}
          >
            <MapPin size={16} />
            <span>Saved Places</span>
          </Link>

          {/* Use NeynarAuthButton directly for sign out */}
          <NeynarAuthButton className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md text-red-600">
            <LogOut size={16} />
            <span>Sign Out</span>
          </NeynarAuthButton>
        </div>
      </div>
    )
  }

  // Expanded profile view (similar to the header profile page)
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link
          href="/lists"
          className="border border-black/10 p-4 rounded text-center hover:bg-black/5 transition-colors"
        >
          <div className="text-3xl font-medium">12</div>
          <div className="text-sm text-black/70">Lists</div>
        </Link>
        <Link
          href="/places"
          className="border border-black/10 p-4 rounded text-center hover:bg-black/5 transition-colors"
        >
          <div className="text-3xl font-medium">48</div>
          <div className="text-sm text-black/70">Places</div>
        </Link>
      </div>

      {/* Recent Lists */}
      <div className="mb-6">
        <h2 className="font-serif text-xl mb-3 flex items-center">
          <List size={18} className="mr-2" /> Recent Lists
        </h2>
        <div className="space-y-2">
          <Link href="/lists/hidden-food-tacoma" className="block">
            <div className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors">
              <h3 className="font-medium">BEST (HIDDEN) FOOD IN TACOMA</h3>
              <p className="text-xs text-black/60">12 places</p>
            </div>
          </Link>
          <Link href="/lists/weekend-getaways" className="block">
            <div className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors">
              <h3 className="font-medium">Weekend Getaways</h3>
              <p className="text-xs text-black/60">8 places</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Places */}
      <div className="mb-6">
        <h2 className="font-serif text-xl mb-3 flex items-center">
          <MapPin size={18} className="mr-2" /> Recent Places
        </h2>
        <div className="space-y-2">
          <Link href="/places/fish-house-cafe" className="block">
            <div className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors flex items-center">
              <div
                className="h-12 w-12 bg-gray-200 rounded mr-3 flex-shrink-0"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h3 className="font-medium">The Fish House Cafe</h3>
                <p className="text-xs text-black/60">Tacoma, WA</p>
              </div>
            </div>
          </Link>
          <Link href="/places/lighthouse-coffee" className="block">
            <div className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors flex items-center">
              <div
                className="h-12 w-12 bg-gray-200 rounded mr-3 flex-shrink-0"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h3 className="font-medium">Lighthouse Coffee</h3>
                <p className="text-xs text-black/60">Beach Rd</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Create List Button */}
      <div className="text-center mt-2">
        <Button
          className="bg-black text-white hover:bg-black/80 px-4 py-2 flex items-center mx-auto"
          onClick={() => router.push("/lists/create")}
        >
          <Plus size={16} className="mr-2" /> Create New List
        </Button>
      </div>

      {/* Sign Out */}
      <div className="mt-6 pt-4 border-t border-black/10">
        <NeynarAuthButton className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 rounded-md text-red-600">
          <LogOut size={16} />
          <span>Sign Out</span>
        </NeynarAuthButton>
      </div>
    </div>
  )
}
