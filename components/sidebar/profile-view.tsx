"use client"

import { ChevronLeft, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProfileViewProps {
  user: any
  onBack: () => void
}

export function ProfileView({ user, onBack }: ProfileViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <Link href="/settings" className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
          <Settings size={16} />
        </Link>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <div className="flex flex-col items-center mb-6">
            {user?.pfp_url ? (
              <img
                src={user.pfp_url || "/placeholder.svg"}
                alt={user.farcaster_display_name || user.farcaster_username || "User"}
                className="w-20 h-20 rounded-full border border-black/10 mb-2"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-black/10 mb-2">
                <span className="text-2xl text-black/40">?</span>
              </div>
            )}
            <h2 className="text-xl font-medium">
              {user?.farcaster_display_name || user?.farcaster_username || "User"}
            </h2>
            {user?.farcaster_username && <p className="text-sm text-black/60">@{user.farcaster_username}</p>}
          </div>

          <div className="space-y-4">
            <Link href="/profile" className="block w-full">
              <Button variant="outline" className="w-full justify-start">
                View Profile
              </Button>
            </Link>
            <Link href="/lists" className="block w-full">
              <Button variant="outline" className="w-full justify-start">
                My Lists
              </Button>
            </Link>
            <Link href="/settings" className="block w-full">
              <Button variant="outline" className="w-full justify-start">
                Settings
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
