"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Search, User, Map, List, Home } from "lucide-react"
import { useAuth } from "../app/lib/auth-context"
import { SearchDialog } from "./search-dialog"

export function MainNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Check if the current path is a full-screen page
  const isFullScreenPage = pathname === "/map"

  // Handle scroll for adding shadow to nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  if (isFullScreenPage) {
    return null // Don't show the main nav on full-screen pages
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow ${
          isScrolled ? "shadow-sm" : ""
        } border-b border-black/10`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="font-serif text-3xl mr-6">
                LO
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className={`nav-link ${pathname === "/" ? "font-medium" : ""}`}>
                  HOME
                </Link>
                <Link href="/explore" className={`nav-link ${pathname === "/explore" ? "font-medium" : ""}`}>
                  EXPLORE
                </Link>
                <Link href="/map" className={`nav-link ${pathname === "/map" ? "font-medium" : ""}`}>
                  MAP
                </Link>
                {isAuthenticated && (
                  <Link href="/lists" className={`nav-link ${pathname.startsWith("/lists") ? "font-medium" : ""}`}>
                    MY LISTS
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-gray-100" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>

              {isAuthenticated ? (
                <Link href="/profile" className="flex items-center">
                  <div className="hidden md:block mr-2 text-sm">{user?.username}</div>
                  {user?.pfp ? (
                    <img
                      src={user.pfp || "/placeholder.svg"}
                      alt={user.username || "User"}
                      className="h-8 w-8 border border-black/10"
                    />
                  ) : (
                    <div className="h-8 w-8 border border-black/10 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </Link>
              ) : (
                <Link href="/login" className="hidden md:block lo-button text-sm">
                  CONNECT
                </Link>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-16">
          <nav className="container mx-auto px-4 py-6 flex flex-col space-y-6">
            <Link
              href="/"
              className="flex items-center py-3 border-b border-black/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>HOME</span>
            </Link>
            <Link
              href="/explore"
              className="flex items-center py-3 border-b border-black/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="h-5 w-5 mr-3" />
              <span>EXPLORE</span>
            </Link>
            <Link
              href="/map"
              className="flex items-center py-3 border-b border-black/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Map className="h-5 w-5 mr-3" />
              <span>MAP</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/lists"
                  className="flex items-center py-3 border-b border-black/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <List className="h-5 w-5 mr-3" />
                  <span>MY LISTS</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center py-3 border-b border-black/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  <span>PROFILE</span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="lo-button text-center" onClick={() => setIsMenuOpen(false)}>
                CONNECT WITH FARCASTER
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
