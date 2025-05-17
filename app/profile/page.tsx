"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useNeynarContext } from "@neynar/react"
// Import the PageLayout at the top
import { PageLayout } from "@/components/page-layout"

// Wrap the entire component with PageLayout
export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { user: neynarUser, isAuthenticated: neynarAuthenticated, isLoading: neynarLoading } = useNeynarContext()
  const router = useRouter()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated
  const loading = isLoading || neynarLoading

  useEffect(() => {
    if (!loading && !userIsAuthenticated) {
      router.push("/login")
    }
  }, [loading, userIsAuthenticated, router])

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
        <h1 className="text-3xl font-serif mb-8">Profile</h1>

        <div className="border border-black/20 p-8 max-w-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {displayUser.pfp && (
              <div className="w-24 h-24 border border-black/10">
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

          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="text-xl font-serif mb-4">Your Lists</h3>
            <Link href="/lists" className="lo-button inline-block">
              View My Lists
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
