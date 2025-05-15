"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { User, LogOut } from "lucide-react"
import { useNeynarContext, NeynarAuthButton } from "@neynar/react"

export function UserMenu() {
  const { signOut } = useAuth()
  const { user } = useNeynarContext()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (!user) {
    return <NeynarAuthButton className="nav-link" />
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 nav-link"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user?.pfp_url ? (
          <img
            src={user.pfp_url || "/placeholder.svg"}
            alt={user.display_name || user.username}
            className="w-6 h-6 border border-black/10"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span>{user?.username || "USER"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 border border-black/20 bg-white z-10">
          <div className="py-2">
            <Link href="/profile" className="block px-4 py-2 hover:bg-black/5" onClick={() => setIsOpen(false)}>
              Profile
            </Link>
            <Link href="/lists" className="block px-4 py-2 hover:bg-black/5" onClick={() => setIsOpen(false)}>
              My Lists
            </Link>
            <NeynarAuthButton className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-black/5 text-black/80">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </NeynarAuthButton>
          </div>
        </div>
      )}
    </div>
  )
}
