"use client"

import Link from "next/link"
import { SearchBar } from "./search-bar"
import { useAuth } from "@/lib/auth-context"
import { UserMenu } from "./user-menu"

export function Header() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <header className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-4xl font-normal tracking-tighter">
          LO
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <nav className="flex items-center gap-6 md:gap-8">
          <Link href="/lists/create" className="nav-link">
            CREATE LIST
          </Link>
          <Link href="/explore" className="nav-link">
            EXPLORE
          </Link>
          <Link href="/map" className="nav-link">
            MAP
          </Link>
          {!isLoading && !isAuthenticated && (
            <Link href="/login" className="nav-link">
              LOGIN
            </Link>
          )}
          {!isLoading && isAuthenticated && <UserMenu />}
        </nav>

        <SearchBar />
      </div>
    </header>
  )
}
