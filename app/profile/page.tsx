"use client"

import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"
import { LogOut, List, MapPin } from "lucide-react"

export default function ProfilePage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const {
    user: neynarUser,
    isAuthenticated: neynarAuthenticated,
    isLoading: neynarLoading,
    signOut,
  } = useNeynarContext()
  const router = useRouter()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated
  const loading = isLoading || neynarLoading

  useEffect(() => {
    if (!loading && !userIsAuthenticated) {
      router.push("/login")
    }
  }, [loading, userIsAuthenticated, router])

  const handleLogout = () => {
    // Logout from auth context
    logout()

    // Logout from Neynar if available
    if (signOut) {
      signOut()
    }

    // Redirect to home page
    router.push("/")
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!userIsAuthenticated) {
    return null // Will redirect in the useEffect
  }

  // Use Neynar user data if available
  const displayUser = neynarUser
    ? {
        displayName:
          typeof neynarUser.display_name === "string"
            ? neynarUser.display_name
            : typeof neynarUser.username === "string"
              ? neynarUser.username
              : "User",
        username: typeof neynarUser.username === "string" ? neynarUser.username : "user",
        pfp: neynarUser.pfp_url || "/placeholder.svg",
        fid: neynarUser.fid?.toString() || "0",
        bio: typeof neynarUser.profile?.bio === "string" ? neynarUser.profile.bio : "",
      }
    : {
        displayName: "Demo User",
        username: "demo_user",
        pfp: "/placeholder.svg",
        fid: "123456",
        bio: "This is a demo profile",
      }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 border border-black/10 rounded hover:bg-black/5 transition-colors"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>

        <div className="border border-black/20 p-8 max-w-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {displayUser.pfp && (
              <div className="w-24 h-24 border border-black/10 rounded-full overflow-hidden">
                <img
                  src={displayUser.pfp || "/placeholder.svg"}
                  alt={displayUser.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-2xl font-serif mb-2">{displayUser.displayName}</h2>
              <p className="text-black/70 mb-4">@{displayUser.username}</p>
              {displayUser.bio && <p className="mb-4">{displayUser.bio}</p>}
              <p className="text-sm text-black/60">Farcaster ID: {displayUser.fid}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <Link
              href="/lists"
              className="border border-black/10 p-4 rounded text-center hover:bg-black/5 transition-colors"
            >
              <div className="text-2xl font-medium">12</div>
              <div className="text-sm text-black/70">Lists</div>
            </Link>
            <div
              className="border border-black/10 p-4 rounded text-center hover:bg-black/5 transition-colors cursor-pointer"
              onClick={() => router.push("/places")}
            >
              <div className="text-2xl font-medium">48</div>
              <div className="text-sm text-black/70">Places</div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="text-xl font-serif mb-4 flex items-center">
              <List size={20} className="mr-2" /> Recent Lists
            </h3>
            <div className="space-y-3">
              <div
                className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => router.push("/lists/hidden-food-tacoma")}
              >
                <h4 className="font-medium">BEST (HIDDEN) FOOD IN TACOMA</h4>
                <p className="text-xs text-black/60">12 places</p>
              </div>
              <div
                className="p-3 border border-black/10 rounded hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => router.push("/lists/weekend-getaways")}
              >
                <h4 className="font-medium">Weekend Getaways</h4>
                <p className="text-xs text-black/60">8 places</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="text-xl font-serif mb-4 flex items-center">
              <MapPin size={20} className="mr-2" /> Recent Places
            </h3>
            <div className="space-y-3">
              <div
                className="p-3 border border-black/10 rounded flex hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => router.push("/places/fish-house-cafe")}
              >
                <div
                  className="h-12 w-12 bg-gray-200 rounded mr-3"
                  style={{
                    backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div>
                  <h4 className="font-medium">The Fish House Cafe</h4>
                  <p className="text-xs text-black/60">Tacoma, WA</p>
                </div>
              </div>
              <div
                className="p-3 border border-black/10 rounded flex hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => router.push("/places/lighthouse-coffee")}
              >
                <div
                  className="h-12 w-12 bg-gray-200 rounded mr-3"
                  style={{
                    backgroundImage: `url(/placeholder.svg?height=200&width=300)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div>
                  <h4 className="font-medium">Lighthouse Coffee</h4>
                  <p className="text-xs text-black/60">Beach Rd</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/10">
            <Link href="/lists/create" className="lo-button inline-block">
              Create New List
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
