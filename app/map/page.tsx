"use client"

import type React from "react"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Search, X, Menu, User } from "lucide-react"
import type { Place } from "@/types/place"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { SearchDialog } from "@/components/search-dialog"
import { SimpleSidebar } from "@/components/sidebar/simple-sidebar"

// Types for lists
type ListPrivacy = "private" | "open" | "closed"

interface ListItem {
  id: string
  title: string
  description?: string
  privacy: ListPrivacy
  placeCount: number
  author: string
}

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import("@/components/map/map-component"), {
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

// Mock data for lists
const MOCK_LISTS: ListItem[] = [
  {
    id: "l1",
    title: "My Favorite Cafes",
    description: "The best places to get coffee in the city",
    privacy: "private",
    placeCount: 8,
    author: "user123",
  },
  {
    id: "l2",
    title: "Weekend Hikes",
    description: "Great trails within an hour of the city",
    privacy: "open",
    placeCount: 6,
    author: "user123",
  },
  {
    id: "l3",
    title: "Date Night Spots",
    description: "Romantic restaurants and bars",
    privacy: "closed",
    placeCount: 10,
    author: "user123",
  },
]

// Mock data for place-list relationships
const PLACE_LIST_RELATIONSHIPS = [
  { placeId: "p1", listId: "l1" },
  { placeId: "p1", listId: "l3" },
  { placeId: "p2", listId: "l2" },
  { placeId: "p3", listId: "l1" },
  { placeId: "p3", listId: "l2" },
  { placeId: "p4", listId: "l3" },
  { placeId: "p5", listId: "l2" },
]

// Get unique place types for filtering
const PLACE_TYPES = Array.from(new Set(MOCK_PLACES.map((place) => place.type)))

export default function MapPage() {
  const { isAuthenticated, user } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchMode, setSearchMode] = useState<"places" | "lists">("places")
  const [userLists, setUserLists] = useState<ListItem[]>(MOCK_LISTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null)
  const [sidebarMode, setSidebarMode] = useState<"search" | "add" | "details" | "createList" | "editList">("search")
  const [newPlace, setNewPlace] = useState<{
    name: string
    type: string
    address: string
    description: string
    coordinates: { lat: number; lng: number }
  }>({
    name: "",
    type: "",
    address: "",
    description: "",
    coordinates: { lat: 40.7128, lng: -74.006 },
  })
  const [newListData, setNewListData] = useState({
    title: "",
    description: "",
    privacy: "private" as ListPrivacy,
  })
  const [editingList, setEditingList] = useState<ListItem | null>(null)
  const [activeTab, setActiveTab] = useState<"places" | "lists">("places")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Function to toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // On mobile, start with sidebar closed
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
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
    if (activeTab === "places") {
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

      setFilteredPlaces(result)
    }
    // Note: Lists filtering is handled directly in the render function
  }, [searchQuery, places, activeTab])

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    setSidebarMode("details")
    if (isMobile) {
      setIsSidebarOpen(true)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by the useEffect
  }

  const handleAddToList = (place: Place) => {
    setSelectedPlace(place)
    setSidebarMode("add")
  }

  const handleNewPlaceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewPlace((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setNewPlace((prev) => ({
      ...prev,
      coordinates: { lat, lng },
    }))
  }

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the data to your API
    console.log("Adding place:", newPlace)

    // For demo purposes, add to local state
    const newPlaceWithId: Place = {
      ...newPlace,
      id: `p${Math.floor(Math.random() * 10000)}`,
      image: "/placeholder.svg?height=200&width=300",
    }

    setPlaces([...places, newPlaceWithId])
    setFilteredPlaces([...filteredPlaces, newPlaceWithId])
    setSelectedPlace(newPlaceWithId)
    setSidebarMode("details")

    // Reset form
    setNewPlace({
      name: "",
      type: "",
      address: "",
      description: "",
      coordinates: { lat: 40.7128, lng: -74.006 },
    })
  }

  const handleNewListChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewListData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrivacyChange = (privacy: ListPrivacy) => {
    setNewListData((prev) => ({ ...prev, privacy }))
  }

  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newListData.title.trim()) return

    // Create a new list with a random ID
    const newList: ListItem = {
      id: `l${Math.floor(Math.random() * 10000)}`,
      title: newListData.title,
      description: newListData.description,
      privacy: newListData.privacy,
      placeCount: 0,
      author: "user123", // In a real app, this would be the current user
    }

    setUserLists([...userLists, newList])

    // Reset form
    setNewListData({
      title: "",
      description: "",
      privacy: "private",
    })

    // Go back to add mode
    setSidebarMode("add")
  }

  const handleCreateListFromTab = () => {
    setSelectedPlace(null)
    setSidebarMode("createList")
  }

  const handleEditList = (list: ListItem) => {
    setEditingList(list)
    setNewListData({
      title: list.title,
      description: list.description || "",
      privacy: list.privacy,
    })
    setSidebarMode("editList")
  }

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newListData.title.trim() || !editingList) return

    // Update the list in the userLists array
    const updatedLists = userLists.map((list) => {
      if (list.id === editingList.id) {
        return {
          ...list,
          title: newListData.title,
          description: newListData.description,
          privacy: newListData.privacy,
        }
      }
      return list
    })

    setUserLists(updatedLists)

    // Reset form and go back to search mode
    setNewListData({
      title: "",
      description: "",
      privacy: "private",
    })
    setEditingList(null)
    setSidebarMode("search")
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Top navigation bar */}
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
                  <div className="hidden md:block mr-2 text-sm">{user?.username || "User"}</div>
                  {user?.pfp ? (
                    <img
                      src={user.pfp || "/placeholder.svg"}
                      alt={user?.username || "User"}
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
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-gray-100"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with map and sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <SimpleSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Map container */}
        <div className="flex-1 relative">
          <MapComponent places={filteredPlaces} onPlaceSelect={handlePlaceSelect} onMapClick={handleLocationSelect} />

          {/* Sidebar toggle button (only shown when sidebar is closed) */}
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-md"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
