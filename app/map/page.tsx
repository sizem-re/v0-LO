"use client"

import type React from "react"
import { redirect } from "next/navigation"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  Search,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Menu,
  User,
  List,
  Plus,
  Check,
  Lock,
  Globe,
} from "lucide-react"
import type { Place } from "@/types/place"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { SearchDialog } from "@/components/search-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ListIcon } from "lucide-react"

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
  redirect("/")
  const { isAuthenticated, user } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

      // Apply type filters
      if (selectedFilters.length > 0) {
        result = result.filter((place) => selectedFilters.includes(place.type))
      }

      setFilteredPlaces(result)
    }
    // Note: Lists filtering is handled directly in the render function
  }, [searchQuery, selectedFilters, places, activeTab])

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    setSidebarMode("details")
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
    if (searchInputRef?.current) {
      searchInputRef.current.value = ""
    }
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
                CONNECT
              </Link>
            )}
          </nav>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`transition-transform duration-300 bg-white border-r border-black/10 w-full md:w-96 flex flex-col fixed inset-y-0 top-16 ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            zIndex: 9999,
            boxShadow: showSidebar ? "0 0 10px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {/* No separate collapse button needed - we'll only use the toggle button when sidebar is closed */}

          {/* Tabs for sidebar functionality - moved up to start at the top */}
          <div className="w-full flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-4 pt-4 pb-4 border-b border-black/10 flex justify-between items-center">
              {sidebarMode !== "search" && (
                <>
                  <h2 className="font-medium text-lg">
                    {sidebarMode === "add"
                      ? "Add Place"
                      : sidebarMode === "createList"
                        ? "Create New List"
                        : sidebarMode === "editList"
                          ? "Edit List"
                          : "Place Details"}
                  </h2>
                  <button
                    onClick={() => setSidebarMode("search")}
                    className="p-1 hover:bg-gray-100 rounded-sm"
                    aria-label="Back to search"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Search Mode */}
            {sidebarMode === "search" && (
              <>
                {/* Sidebar Header with Tabs - Combined into one element */}
                <div className="border-b border-black/10">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("places")}
                      className={`flex-1 py-4 text-center font-serif text-2xl relative ${
                        activeTab === "places" ? "" : "text-black/60"
                      }`}
                    >
                      Places
                      {activeTab === "places" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>}
                    </button>
                    <button
                      onClick={() => setActiveTab("lists")}
                      className={`flex-1 py-4 text-center font-serif text-2xl relative ${
                        activeTab === "lists" ? "" : "text-black/60"
                      }`}
                    >
                      Lists
                      {activeTab === "lists" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>}
                    </button>
                  </div>
                </div>

                {/* Search input */}
                <div className="px-4 py-4 border-b border-black/10">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={activeTab === "places" ? "Search places..." : "Search lists..."}
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
                </div>

                {/* Content based on active tab */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "places" ? (
                    // Places tab content
                    <div className="divide-y divide-black/10">
                      {filteredPlaces.length > 0 ? (
                        filteredPlaces.map((place) => (
                          <div
                            key={place.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedPlace(place)
                              setSidebarMode("details")
                            }}
                          >
                            <h3 className="font-medium mb-1">{place.name}</h3>
                            <p className="text-sm truncate">{place.address}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-black/70">No places found</p>
                          {searchQuery && (
                            <button onClick={clearFilters} className="mt-2 text-sm underline">
                              Clear search
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Lists tab content
                    <div className="divide-y divide-black/10">
                      {userLists
                        .filter((list) =>
                          searchQuery
                            ? list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                            : true,
                        )
                        .map((list) => (
                          <div key={list.id} className="p-4 hover:bg-gray-50">
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                // In a real app, you would navigate to the list or show list details
                                console.log(`View list: ${list.title}`)
                              }}
                            >
                              <h3 className="font-medium mb-1">{list.title}</h3>
                              <div className="flex justify-between">
                                <p className="text-sm text-black/70">{list.placeCount} places</p>
                                <p className="text-sm text-black/70">
                                  {list.privacy === "private" ? "Private" : list.privacy === "open" ? "Open" : "Closed"}
                                </p>
                              </div>
                              {list.description && <p className="text-sm mt-1 truncate">{list.description}</p>}
                            </div>
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleEditList(list)}
                                className="text-xs text-black/70 hover:text-black hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      {userLists.length === 0 ||
                      (searchQuery &&
                        userLists.filter(
                          (list) =>
                            list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())),
                        ).length === 0) ? (
                        <div className="p-4 text-center">
                          <p className="text-black/70">No lists found</p>
                          {searchQuery && (
                            <button onClick={clearFilters} className="mt-2 text-sm underline">
                              Clear search
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Add New Place button - only shown in Places tab */}
                {activeTab === "places" && (
                  <div className="p-4 border-t border-black/10">
                    <button
                      onClick={() => {
                        setSelectedPlace(null)
                        setSidebarMode("add")
                      }}
                      className="lo-button w-full flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Add New Place
                    </button>
                  </div>
                )}

                {/* Create New List button - only shown in Lists tab */}
                {activeTab === "lists" && (
                  <div className="p-4 border-t border-black/10">
                    <button
                      onClick={handleCreateListFromTab}
                      className="lo-button w-full flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Create New List
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Place Details Mode */}
            {sidebarMode === "details" && selectedPlace && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h2 className="text-xl font-serif">{selectedPlace.name}</h2>
                  <p className="text-sm text-black/70">{selectedPlace.type}</p>
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

                  {selectedPlace.description && <p className="text-sm">{selectedPlace.description}</p>}

                  <div className="flex gap-2">
                    <button className="lo-button inline-block text-sm" onClick={() => setSidebarMode("add")}>
                      ADD TO LIST
                    </button>
                  </div>

                  {/* Lists that contain this place */}
                  <div className="mt-4 pt-4 border-t border-black/10">
                    <h3 className="text-sm font-medium mb-2">Appears in these lists</h3>
                    {PLACE_LIST_RELATIONSHIPS.filter((rel) => rel.placeId === selectedPlace.id).length > 0 ? (
                      <div className="space-y-2">
                        {PLACE_LIST_RELATIONSHIPS.filter((rel) => rel.placeId === selectedPlace.id).map((rel) => {
                          const list = userLists.find((l) => l.id === rel.listId)
                          return list ? (
                            <Link
                              href={`/lists/${list.id}`}
                              key={list.id}
                              className="block p-2 border border-black/10 hover:border-black hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{list.title}</p>
                                  <p className="text-xs text-black/70">{list.placeCount} places</p>
                                </div>
                                <div className="text-xs text-black/70">
                                  {list.privacy === "private" ? "Private" : "Public"}
                                </div>
                              </div>
                            </Link>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-black/70">This place doesn't appear in any lists yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add Place Mode - Styled like the popup but in the sidebar */}
            {sidebarMode === "add" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-black/10">
                  {selectedPlace ? (
                    <div className="mb-4">
                      <h3 className="font-medium">{selectedPlace.name}</h3>
                      <p className="text-sm text-black/70">{selectedPlace.type}</p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <h3 className="font-medium">Add New Place</h3>
                      <p className="text-sm text-black/70">Fill in the details below</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {selectedPlace ? (
                    // Add to list form
                    <>
                      <p className="mb-4 text-sm">Select the lists you want to add this place to:</p>

                      <div className="max-h-60 overflow-y-auto mb-4">
                        {userLists.length > 0 ? (
                          <div className="space-y-2">
                            {userLists.map((list) => {
                              const isInList = PLACE_LIST_RELATIONSHIPS.some(
                                (rel) => rel.placeId === selectedPlace.id && rel.listId === list.id,
                              )

                              return (
                                <div
                                  key={list.id}
                                  className={`p-3 border cursor-pointer ${
                                    isInList ? "border-black bg-black/5" : "border-black/20 hover:border-black/50"
                                  }`}
                                  onClick={() => {
                                    // In a real app, you would toggle the relationship
                                    console.log(`Toggle ${selectedPlace.name} in list ${list.title}`)
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">{list.title}</h4>
                                      <p className="text-xs text-black/70">{list.placeCount} places</p>
                                    </div>
                                    {isInList && <Check className="h-5 w-5" />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-black/70">You don't have any lists yet.</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          className="lo-button w-full"
                          onClick={() => {
                            // In a real app, you would save the changes
                            console.log("Adding to selected lists")
                            setSidebarMode("search")
                          }}
                        >
                          ADD TO SELECTED LISTS
                        </button>

                        <button
                          className="lo-button w-full bg-transparent"
                          onClick={() => {
                            setSidebarMode("createList")
                          }}
                        >
                          <Plus size={16} className="mr-1 inline-block" />
                          CREATE NEW LIST
                        </button>
                      </div>
                    </>
                  ) : (
                    // Add new place form
                    <form onSubmit={handleAddPlace} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="block mb-1 font-medium">
                          Place Name
                        </Label>
                        <input
                          id="name"
                          name="name"
                          value={newPlace.name}
                          onChange={handleNewPlaceChange}
                          className="lo-input"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="type" className="block mb-1 font-medium">
                          Type
                        </Label>
                        <input
                          id="type"
                          name="type"
                          value={newPlace.type}
                          onChange={handleNewPlaceChange}
                          className="lo-input"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="address" className="block mb-1 font-medium">
                          Address
                        </Label>
                        <input
                          id="address"
                          name="address"
                          value={newPlace.address}
                          onChange={handleNewPlaceChange}
                          className="lo-input"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="block mb-1 font-medium">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={newPlace.description}
                          onChange={handleNewPlaceChange}
                          className="lo-input"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="block mb-1 font-medium">Location</Label>
                        <p className="text-sm text-black/70 mb-2">Click on the map to set the location</p>
                        <div className="text-sm mb-2">
                          Coordinates: {newPlace.coordinates.lat.toFixed(6)}, {newPlace.coordinates.lng.toFixed(6)}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="list" className="block mb-1 font-medium">
                          Add to List
                        </Label>
                        <select id="list" name="list" className="lo-input" required>
                          <option value="">Select a list...</option>
                          {userLists.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="lo-button w-full">
                          ADD PLACE
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Create List Mode */}
            {sidebarMode === "createList" && (
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleCreateNewList} className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="block mb-1 font-medium">
                        List Title
                      </Label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={newListData.title}
                        onChange={handleNewListChange}
                        className="lo-input border-black"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="block mb-1 font-medium">
                        Description (Optional)
                      </Label>
                      <textarea
                        id="description"
                        name="description"
                        value={newListData.description}
                        onChange={handleNewListChange}
                        rows={3}
                        className="lo-input border-black"
                      />
                    </div>

                    <div>
                      <span className="block mb-2 font-medium">Privacy</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "private" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="private"
                            checked={newListData.privacy === "private"}
                            onChange={() => handlePrivacyChange("private")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <Lock className="h-5 w-5 mb-1" />
                            <div className="font-medium">Private</div>
                            <div className="text-xs text-black/70">Sharable via link</div>
                          </div>
                        </label>

                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "open" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="open"
                            checked={newListData.privacy === "open"}
                            onChange={() => handlePrivacyChange("open")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <Globe className="h-5 w-5 mb-1" />
                            <div className="font-medium">Open</div>
                            <div className="text-xs text-black/70">Anyone can add</div>
                          </div>
                        </label>

                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "closed" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="closed"
                            checked={newListData.privacy === "closed"}
                            onChange={() => handlePrivacyChange("closed")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <ListIcon className="h-5 w-5 mb-1" />
                            <div className="font-medium">Closed</div>
                            <div className="text-xs text-black/70">Only you can add</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button type="submit" className="lo-button flex-1" disabled={!newListData.title.trim()}>
                      CREATE LIST
                    </button>
                    <button type="button" className="lo-button bg-transparent" onClick={() => setSidebarMode("add")}>
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit List Mode */}
            {sidebarMode === "editList" && editingList && (
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleUpdateList} className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="block mb-1 font-medium">
                        List Title
                      </Label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={newListData.title}
                        onChange={handleNewListChange}
                        className="lo-input border-black"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="block mb-1 font-medium">
                        Description (Optional)
                      </Label>
                      <textarea
                        id="description"
                        name="description"
                        value={newListData.description}
                        onChange={handleNewListChange}
                        rows={3}
                        className="lo-input border-black"
                      />
                    </div>

                    <div>
                      <span className="block mb-2 font-medium">Privacy</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "private" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="private"
                            checked={newListData.privacy === "private"}
                            onChange={() => handlePrivacyChange("private")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <Lock className="h-5 w-5 mb-1" />
                            <div className="font-medium">Private</div>
                            <div className="text-xs text-black/70">Sharable via link</div>
                          </div>
                        </label>

                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "open" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="open"
                            checked={newListData.privacy === "open"}
                            onChange={() => handlePrivacyChange("open")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <Globe className="h-5 w-5 mb-1" />
                            <div className="font-medium">Open</div>
                            <div className="text-xs text-black/70">Anyone can add</div>
                          </div>
                        </label>

                        <label
                          className={`border p-3 cursor-pointer ${
                            newListData.privacy === "closed" ? "border-black" : "border-black/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="privacy"
                            value="closed"
                            checked={newListData.privacy === "closed"}
                            onChange={() => handlePrivacyChange("closed")}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center text-center">
                            <ListIcon className="h-5 w-5 mb-1" />
                            <div className="font-medium">Closed</div>
                            <div className="text-xs text-black/70">Only you can add</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button type="submit" className="lo-button flex-1" disabled={!newListData.title.trim()}>
                      UPDATE LIST
                    </button>
                    <button
                      type="button"
                      className="lo-button bg-transparent"
                      onClick={() => {
                        setSidebarMode("search")
                        setEditingList(null)
                        setNewListData({
                          title: "",
                          description: "",
                          privacy: "private",
                        })
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Map container */}
        <div
          className="flex-1 relative transition-all duration-300 w-full h-full"
          style={{
            marginLeft: showSidebar && !isMobile ? "24rem" : "0",
            width: showSidebar && !isMobile ? "calc(100% - 24rem)" : "100%",
          }}
        >
          <VanillaMap
            places={filteredPlaces}
            height="100%"
            onPlaceSelect={sidebarMode === "search" ? handlePlaceSelect : undefined}
            onMapClick={
              sidebarMode === "add" && !selectedPlace ? (lat, lng) => handleLocationSelect(lat, lng) : undefined
            }
          />
        </div>

        {/* Unified sidebar toggle button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`fixed top-20 z-30 bg-white px-3 py-2 border border-black/10 shadow-md hover:bg-gray-50 flex items-center transition-all duration-300 ${
            showSidebar ? "left-[calc(100%-0.5rem)] md:left-[24rem] border-l-0" : "left-0 border-l-0"
          }`}
          style={{
            borderTopRightRadius: showSidebar ? "4px" : "4px",
            borderBottomRightRadius: showSidebar ? "4px" : "4px",
            borderTopLeftRadius: showSidebar ? "0" : "0",
            borderBottomLeftRadius: showSidebar ? "0" : "0",
          }}
          aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
        >
          {showSidebar ? (
            <ChevronLeft size={20} />
          ) : (
            <>
              <ChevronRight size={20} className="mr-1" />
              <span className="text-sm">Search & Add</span>
            </>
          )}
        </button>
      </div>

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
