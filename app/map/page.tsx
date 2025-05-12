"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Search, Filter, MapPin, X, ChevronLeft, Plus, ArrowLeft, Menu, User } from "lucide-react"
import type { Place } from "@/types/place"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { SearchDialog } from "@/components/search-dialog"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

// Mock data for places
const MOCK_PLACES: Place[] = [
  {
    id: "p1",
    name: "The Fish House Cafe",
    type: "Restaurant",
    address: "1814 Martin Luther King Jr Way, Tacoma, WA 98405",
    coordinates: { lat: 47.2529, lng: -122.4443 },
    description: "No-frills spot for fried seafood & soul food sides in a tiny, counter-serve setting.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p2",
    name: "Vien Dong",
    type: "Vietnamese Restaurant",
    address: "3801 Yakima Ave, Tacoma, WA 98418",
    coordinates: { lat: 47.2209, lng: -122.4634 },
    description: "Casual Vietnamese spot serving pho, rice plates & other traditional dishes in a simple setting.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p3",
    name: "Burger Seoul",
    type: "Korean Fusion",
    address: "1750 S Prospect St, Tacoma, WA 98405",
    coordinates: { lat: 47.241, lng: -122.4556 },
    description: "Korean-inspired burgers and sides with unique flavors.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p4",
    name: "Central Park",
    type: "Park",
    address: "Central Park, New York, NY",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    description: "An urban park in Manhattan, New York City.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p5",
    name: "Golden Gate Bridge",
    type: "Landmark",
    address: "Golden Gate Bridge, San Francisco, CA",
    coordinates: { lat: 37.8199, lng: -122.4783 },
    description:
      "A suspension bridge spanning the Golden Gate, the one-mile-wide strait connecting San Francisco Bay and the Pacific Ocean.",
    image: "/placeholder.svg?height=200&width=300",
  },
]

// Get unique place types for filtering
const PLACE_TYPES = Array.from(new Set(MOCK_PLACES.map((place) => place.type)))

export default function MapPage() {
  const { isAuthenticated, user } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // On mobile, start with sidebar closed
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Handle scroll for adding shadow to nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // In a real app, you would fetch places from an API
    setPlaces(MOCK_PLACES)
    setFilteredPlaces(MOCK_PLACES)
  }, [])

  // Filter places based on search query and selected filters
  useEffect(() => {
    let result = [...places]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.address.toLowerCase().includes(query) ||
          place.type.toLowerCase().includes(query) ||
          (place.description && place.description.toLowerCase().includes(query)),
      )
    }

    // Apply type filters
    if (selectedFilters.length > 0) {
      result = result.filter((place) => selectedFilters.includes(place.type))
    }

    setFilteredPlaces(result)
  }, [searchQuery, selectedFilters, places])

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    if (isMobile) {
      setShowSidebar(true)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by the useEffect
  }

  const toggleFilter = (type: string) => {
    if (selectedFilters.includes(type)) {
      setSelectedFilters(selectedFilters.filter((t) => t !== type))
    } else {
      setSelectedFilters([...selectedFilters, type])
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setSearchQuery("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
  }

  // Remove this function

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Top navigation bar - Exactly matching MainNav */}
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
                <Link href="/" className="nav-link">
                  HOME
                </Link>
                <Link href="/explore" className="nav-link">
                  EXPLORE
                </Link>
                <Link href="/map" className="nav-link font-medium">
                  MAP
                </Link>
                {isAuthenticated && (
                  <Link href="/lists" className="nav-link">
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
              <ArrowLeft className="h-5 w-5 mr-3" />
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
            {isAuthenticated ? (
              <>
                <Link
                  href="/lists"
                  className="flex items-center py-3 border-b border-black/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Menu className="h-5 w-5 mr-3" />
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } transition-transform duration-300 bg-white border-r border-black/10 w-full md:w-96 flex flex-col z-20 absolute md:relative inset-y-0 top-16 md:top-0`}
        >
          {/* Sidebar header with close button */}
          <div className="flex justify-between items-center p-4 border-b border-black/10">
            <h2 className="font-medium">Places</h2>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100"
              aria-label="Hide sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          {/* Search and filters */}
          <div className="px-4 pb-4 border-b border-black/10">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search places..."
                  className="lo-input pr-10"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-10 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center text-sm">
                <Filter size={16} className="mr-1" />
                FILTERS {selectedFilters.length > 0 && `(${selectedFilters.length})`}
              </button>

              {(selectedFilters.length > 0 || searchQuery) && (
                <button onClick={clearFilters} className="text-sm text-black/70 hover:text-black">
                  CLEAR ALL
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium mb-2">PLACE TYPE</p>
                <div className="flex flex-wrap gap-2">
                  {PLACE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleFilter(type)}
                      className={`text-xs px-2 py-1 border ${
                        selectedFilters.includes(type)
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black/20 hover:border-black"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Place list or selected place details */}
          <div className="flex-1 overflow-y-auto">
            {selectedPlace ? (
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-serif">{selectedPlace.name}</h2>
                  <button onClick={() => setSelectedPlace(null)} className="p-1" aria-label="Close details">
                    <X size={18} />
                  </button>
                </div>

                {selectedPlace.image && (
                  <div
                    className="w-full h-48 bg-gray-100 mb-4 border border-black/10"
                    style={{
                      backgroundImage: `url(${selectedPlace.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                    <p className="text-sm">{selectedPlace.address}</p>
                  </div>

                  <p className="text-sm inline-block bg-gray-100 px-2 py-1 border border-black/10">
                    {selectedPlace.type}
                  </p>

                  {selectedPlace.description && <p className="text-sm">{selectedPlace.description}</p>}

                  <div className="flex gap-2">
                    <Link href={`/places/${selectedPlace.id}`} className="lo-button inline-block text-sm">
                      VIEW DETAILS
                    </Link>
                    {isAuthenticated && (
                      <button className="lo-button inline-block text-sm">
                        <Plus size={16} className="mr-1 inline-block" />
                        ADD TO LIST
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {filteredPlaces.length > 0 ? (
                  filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePlaceSelect(place)}
                    >
                      <h3 className="font-medium mb-1">{place.name}</h3>
                      <p className="text-sm text-black/70 mb-1">{place.type}</p>
                      <p className="text-sm truncate">{place.address}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-black/70">No places found</p>
                    {(searchQuery || selectedFilters.length > 0) && (
                      <button onClick={clearFilters} className="mt-2 text-sm underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1 relative">
          <VanillaMap places={filteredPlaces} height="100%" onPlaceSelect={handlePlaceSelect} />

          {/* Mobile search toggle */}
          {isMobile && !showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 left-4 z-10 bg-white p-3 border border-black/10 shadow-sm"
              aria-label="Show search"
            >
              <Search size={20} />
            </button>
          )}

          {/* Add place button */}
          {isAuthenticated && (
            <Link
              href="/lists/create/add-place"
              className="absolute bottom-6 right-6 z-10 bg-black text-white p-4 border border-black hover:bg-white hover:text-black transition-colors"
              aria-label="Add place"
            >
              <Plus size={24} />
            </Link>
          )}
        </div>
      </div>

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
