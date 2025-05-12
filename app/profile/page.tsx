"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div>
      <h1 className="text-3xl font-serif mb-8">Profile</h1>

      <div className="border border-black/20 p-8 max-w-2xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {user.pfp && (
            <div className="w-24 h-24 border border-black/10">
              <img
                src={user.pfp || "/placeholder.svg"}
                alt={user.displayName || user.username}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-serif mb-2">{user.displayName || user.username}</h2>
            <p className="text-black/70 mb-4">@{user.username}</p>
            {user.profile?.bio && <p className="mb-4">{user.profile.bio}</p>}
            <p className="text-sm text-black/60">Farcaster ID: {user.fid}</p>
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
  )
}
