"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { Button } from "@/components/ui/button"
import { LogOut, List, MapPin, ChevronLeft, Plus } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user: authUser, logout } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated
  const user = authUser || neynarUser

  console.log("ProfilePage - authUser:", authUser)
  console.log("ProfilePage - neynarUser:", neynarUser)
  console.log("ProfilePage - final user:", user)

  useEffect(() => {
    // Redirect to home page - we're no longer using a separate profile page
    router.replace("/")
  }, [router])

  // Show loading state while redirecting
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Redirecting to home page...</p>
        </div>
      </div>
    )
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
        bio: user.profile?.bio || "",
      }
    : {
        displayName: "Demo User",
        username: "demo_user",
        pfp: "/placeholder.svg",
        fid: "123456",
        bio: "This is a demo profile",
      }

  return (
    <main className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button className="flex items-center text-black hover:bg-black/5 p-2 rounded" onClick={() => router.back()}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        {/* Logout button */}
        <button 
          onClick={logout}
          className="flex items-center text-black/70 hover:text-black hover:bg-black/5 p-2 rounded"
        >
          <LogOut size={16} className="mr-1" /> Logout
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-24 h-24 border border-black/10 rounded-full overflow-hidden">
          <img
            src={displayUser.pfp || "/placeholder.svg"}
            alt={displayUser.displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-serif text-3xl mb-1">{displayUser.displayName}</h1>
          <p className="text-black/70 text-lg">@{displayUser.username}</p>
          {displayUser.bio && <p className="text-gray-600 mt-2">{displayUser.bio}</p>}
          <p className="text-sm text-black/60 mt-1">Farcaster ID: {displayUser.fid}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <Link
          href="/lists"
          className="border border-black/10 p-6 rounded text-center hover:bg-black/5 transition-colors"
        >
          <div className="text-4xl font-medium">12</div>
          <div className="text-lg text-black/70">Lists</div>
        </Link>
        <Link
          href="/places"
          className="border border-black/10 p-6 rounded text-center hover:bg-black/5 transition-colors"
        >
          <div className="text-4xl font-medium">48</div>
          <div className="text-lg text-black/70">Places</div>
        </Link>
      </div>

      {/* Recent Lists */}
      <div className="mb-10">
        <h2 className="font-serif text-2xl mb-4 flex items-center">
          <List size={20} className="mr-2" /> Recent Lists
        </h2>
        <div className="space-y-3">
          <Link href="/lists/hidden-food-tacoma" className="block">
            <div className="p-4 border border-black/10 rounded hover:bg-black/5 transition-colors">
              <h3 className="font-medium text-lg">BEST (HIDDEN) FOOD IN TACOMA</h3>
              <p className="text-sm text-black/60">12 places</p>
            </div>
          </Link>
          <Link href="/lists/weekend-getaways" className="block">
            <div className="p-4 border border-black/10 rounded hover:bg-black/5 transition-colors">
              <h3 className="font-medium text-lg">Weekend Getaways</h3>
              <p className="text-sm text-black/60">8 places</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Places */}
      <div className="mb-10">
        <h2 className="font-serif text-2xl mb-4 flex items-center">
          <MapPin size={20} className="mr-2" /> Recent Places
        </h2>
        <div className="space-y-3">
          <Link href="/places/fish-house-cafe" className="block">
            <div className="p-4 border border-black/10 rounded hover:bg-black/5 transition-colors flex items-center">
              <div
                className="h-16 w-16 bg-gray-200 rounded mr-4 flex-shrink-0"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h3 className="font-medium text-lg">The Fish House Cafe</h3>
                <p className="text-sm text-black/60">Tacoma, WA</p>
              </div>
            </div>
          </Link>
          <Link href="/places/lighthouse-coffee" className="block">
            <div className="p-4 border border-black/10 rounded hover:bg-black/5 transition-colors flex items-center">
              <div
                className="h-16 w-16 bg-gray-200 rounded mr-4 flex-shrink-0"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h3 className="font-medium text-lg">Lighthouse Coffee</h3>
                <p className="text-sm text-black/60">Beach Rd</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Create List Button */}
      <div className="text-center">
        <Button
          className="bg-black text-white hover:bg-black/80 px-6 py-2 text-lg flex items-center mx-auto"
          onClick={() => router.push("/lists/create")}
        >
          <Plus size={20} className="mr-2" /> Create New List
        </Button>
      </div>
    </main>
  )
}
