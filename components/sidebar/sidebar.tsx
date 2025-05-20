"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  MapPin,
  ListIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Filter,
  X,
  Home,
  Menu,
  Share2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { CreateListModal } from "./create-list-modal"
import { AddPlaceModal } from "./add-place-modal"
import { PlaceDetails } from "./place-details"
import { ListDetails } from "./list-details"
import { ProfileView } from "./profile-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginView } from "./login-view"
import { useMiniApp } from "@/hooks/use-mini-app"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { AddPlaceToList } from "./add-place-to-list"

interface SidebarList {
  id: string
  title: string
  description: string | null
  visibility: string
  created_at: string
  owner_id: string
  cover_image_url: string | null
  places: { id: string; place: any }[]
  owner?: {
    farcaster_username?: string
  }
}

interface Place {
  id: string
  name: string
  description: string | null
  address: string | null
  lat: number
  lng: number
  type: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  website_url: string | null
}

interface SidebarInitialState {
  activeTab: string
  showListDetails: boolean
  showPlaceDetails: boolean
  selectedListId: string | null
  selectedPlaceId: string | null
  showAddPlaceToList?: boolean
}

interface SidebarProps {
  initialState?: SidebarInitialState
}

export function Sidebar({ initialState }: SidebarProps) {
  // Get miniapp context and router
  const { isMiniApp } = useMiniApp()
  const router = useRouter()
  const pathname = usePathname()

  // Detect mobile devices
  const [isMobile, setIsMobile] = useState(false)

  // State for sidebar visibility
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Sidebar content state
  const [activeTab, setActiveTab] = useState(initialState?.activeTab || "discover")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)
  const [showPlaceDetails, setShowPlaceDetails] = useState(initialState?.showPlaceDetails || false)
  const [showListDetails, setShowListDetails] = useState(initialState?.showListDetails || false)
  const [showAddPlaceToList, setShowAddPlaceToList] = useState(initialState?.showAddPlaceToList || false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [selectedList, setSelectedList] = useState<string | null>(initialState?.selectedListId || null)
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialState?.selectedPlaceId || null)

  // Lists and places state
  const [userLists, setUserLists] = useState<SidebarList[]>([])
  const [savedLists, setSavedLists] = useState<SidebarList[]>([])
  const [popularLists, setPopularLists] = useState<SidebarList[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [listsError, setListsError] = useState<string | null>(null)
  const [placesError, setPlacesError] = useState<string | null>(null)

  // Auth context
  const { isAuthenticated, dbUser, signOut } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user, signOut: neynarSignOut } = useNeynarContext()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated

  // Ref for the sidebar element
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Ref to track if URL has been updated
  const hasUpdatedUrlRef = useRef(false)

  // Detect mobile devices and set initial sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Only auto-collapse on initial load, not on resize
      if (!sidebarRef.current) {
        setIsCollapsed(mobile || isMiniApp)
      }
    }

    // Check on mount and window resize
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [isMiniApp])

  // Handle clicks outside the sidebar to auto-collapse on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && !isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCollapsed(true)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isCollapsed])

  // Fetch user's lists
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!dbUser?.id) return

      setIsLoadingLists(true)
      setListsError(null)

      try {
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch lists")
        }

        const data = await response.json()
        setUserLists(data)
      } catch (err) {
        console.error("Error fetching user lists:", err)
        setListsError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingLists(false)
      }
    }

    // Fetch popular lists (public and community)
    const fetchPopularLists = async () => {
      setIsLoadingLists(true)
      setListsError(null)

      try {
        const response = await fetch(`/api/lists?visibility=public-community`)

        if (!response.ok) {
          throw new Error("Failed to fetch popular lists")
        }

        const data = await response.json()
        // Sort by number of places (most places first)
        const sortedLists = data.sort(
          (a: SidebarList, b: SidebarList) => (b.places?.length || 0) - (a.places?.length || 0),
        )
        setPopularLists(sortedLists.slice(0, 5)) // Take top 5
      } catch (err) {
        console.error("Error fetching popular lists:", err)
        setListsError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingLists(false)
      }
    }

    // Fetch nearby places
    const fetchNearbyPlaces = async () => {
      setIsLoadingPlaces(true)
      setPlacesError(null)

      try {
        const response = await fetch(`/api/places`)

        if (!response.ok) {
          throw new Error("Failed to fetch places")
        }

        const data = await response.json()
        setNearbyPlaces(data.slice(0, 5)) // Take top 5 for now

        // If we have a selectedPlaceId, find the place and set it
        if (selectedPlaceId) {
          const place = data.find((p: Place) => p.id === selectedPlaceId)
          if (place) {
            setSelectedPlace(place)
          }
        }
      } catch (err) {
        console.error("Error fetching places:", err)
        setPlacesError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingPlaces(false)
      }
    }

    if (userIsAuthenticated) {
      fetchUserLists()
    }

    fetchPopularLists()
    fetchNearbyPlaces()
  }, [dbUser?.id, userIsAuthenticated, selectedPlaceId])

  // Update URL when sidebar state changes - use a debounced approach
  useEffect(() => {
    // Only update URL if we're on the home page and not during initial render
    if (pathname !== "/" || !hasUpdatedUrlRef.current) {
      hasUpdatedUrlRef.current = true
      return
    }

    // Use a timeout to debounce URL updates
    const updateUrlTimeout = setTimeout(() => {
      const params = new URLSearchParams()

      if (activeTab !== "discover") {
        params.set("tab", activeTab)
      }

      if (showListDetails && selectedList) {
        params.set("list", selectedList)
      }

      if (showPlaceDetails && selectedPlace?.id) {
        params.set("place", selectedPlace.id)
      }

      if (showAddPlaceToList && selectedList) {
        params.set("list", selectedList)
        params.set("action", "addPlace")
      }

      const queryString = params.toString()
      const url = queryString ? `/?${queryString}` : "/"

      // Use router.replace to avoid adding to history
      router.replace(url, { scroll: false })
    }, 300) // 300ms debounce

    return () => clearTimeout(updateUrlTimeout)
  }, [activeTab, showListDetails, selectedList, showPlaceDetails, selectedPlace, showAddPlaceToList, pathname, router])

  const handleProfileClick = () => {
    if (userIsAuthenticated) {
      setShowProfile(true)
      setShowPlaceDetails(false)
      setShowListDetails(false)
      setShowLogin(false)
      setShowAddPlaceToList(false)
      setIsCollapsed(false) // Always expand sidebar when showing profile
    } else {
      setShowLogin(true)
      setShowPlaceDetails(false)
      setShowListDetails(false)
      setShowProfile(false)
      setShowAddPlaceToList(false)
      setIsCollapsed(false) // Always expand sidebar when showing login
    }
  }

  const handlePlaceClick = (place: any) => {
    setSelectedPlace(place)
    setShowPlaceDetails(true)
    setShowListDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setShowAddPlaceToList(false)
    setIsCollapsed(false) // Always expand sidebar when showing place details
  }

  const handleListClick = (list: any) => {
    setSelectedList(list.id)
    setShowListDetails(true)
    setShowPlaceDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setShowAddPlaceToList(false)
    setIsCollapsed(false) // Always expand sidebar when showing list details
  }

  const handleBackClick = () => {
    setShowPlaceDetails(false)
    setShowListDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setShowAddPlaceToList(false)
  }

  const handleAddPlace = () => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      setIsCollapsed(false) // Always expand sidebar when showing login
      return
    }

    setShowAddPlaceModal(true)
  }

  const handleAddPlaceToList = (listId: string) => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      setIsCollapsed(false)
      return
    }

    setSelectedList(listId)
    setShowAddPlaceToList(true)
    setShowListDetails(false)
    setShowPlaceDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setIsCollapsed(false)
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    handleBackClick()
    setIsCollapsed(false) // Always expand sidebar when changing tabs
  }

  const handleSignOut = async () => {
    if (neynarAuthenticated) {
      await neynarSignOut()
    } else if (isAuthenticated) {
      await signOut()
    }

    // Reset state
    setShowProfile(false)
    setActiveTab("discover")
  }

  const handleShareList = (listId: string) => {
    // Implement sharing functionality
    console.log(`Sharing list: ${listId}`)

    // Create a shareable URL
    const shareUrl = `${window.location.origin}/?list=${listId}`

    // Use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "Check out this list on LO",
          text: "I found this interesting list of places on LO",
          url: shareUrl,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert("Link copied to clipboard!")
        })
        .catch((err) => {
          console.error("Failed to copy: ", err)
        })
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete list")
      }

      // Remove the list from the state
      setUserLists(userLists.filter((list) => list.id !== listId))

      // Go back to the lists view
      handleBackClick()
    } catch (error) {
      console.error("Error deleting list:", error)
      alert("Failed to delete list. Please try again.")
    }
  }

  // For very small screens, we can completely hide the sidebar
  if (isHidden) {
    return (
      <button
        className="absolute top-2 left-2 z-50 bg-white p-2 rounded-full shadow-md"
        onClick={() => setIsHidden(false)}
        aria-label="Show sidebar"
      >
        <Menu size={20} />
      </button>
    )
  }

  // Collapsed sidebar view
  if (isCollapsed) {
    return (
      <div
        className={`bg-white h-full border-r border-black/10 flex flex-col items-center py-4 transition-all duration-300 ease-in-out ${
          isMobile || isMiniApp ? "w-10 shadow-md" : "w-12"
        }`}
      >
        {/* LO Logotype */}
        <div className="mb-2 flex flex-col items-center">
          <Link href="/" className="font-serif text-xl font-bold">
            LO
          </Link>
          <button
            className="mt-2 p-1 hover:bg-gray-100 rounded-full"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-full h-px bg-black/10 my-2"></div>

        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "discover" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => handleTabClick("discover")}
          aria-label="Discover"
        >
          <Home size={20} />
        </button>
        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "mylists" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => handleTabClick("mylists")}
          aria-label="My Lists"
        >
          <ListIcon size={20} />
        </button>
        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "places" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => handleTabClick("places")}
          aria-label="Places"
        >
          <MapPin size={20} />
        </button>
        <div className="flex-grow"></div>
        <button
          className="p-2 rounded-full text-black hover:bg-gray-100"
          onClick={handleProfileClick}
          aria-label="Profile"
        >
          {userIsAuthenticated && user?.pfp_url ? (
            <img
              src={user.pfp_url || "/placeholder.svg"}
              alt="Profile"
              className="w-6 h-6 rounded-full border border-black/10"
            />
          ) : (
            <User size={20} />
          )}
        </button>

        {/* Hide button for very small screens */}
        {(isMobile || isMiniApp) && (
          <button
            className="mt-2 p-2 rounded-full text-black hover:bg-gray-100"
            onClick={() => setIsHidden(true)}
            aria-label="Hide sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>
    )
  }

  // Expanded sidebar view
  return (
    <div
      ref={sidebarRef}
      className={`bg-white h-full border-r border-black/10 flex flex-col transition-all duration-300 ease-in-out ${
        isMobile || isMiniApp ? "w-[85vw] max-w-[320px] shadow-md" : "w-80"
      }`}
    >
      {/* Header with collapse button */}
      <div className="flex justify-between items-center border-b border-black/10 px-4 py-3">
        <Link href="/" className="font-serif text-xl">
          LO
        </Link>
        <button
          className="p-1 hover:bg-gray-100 rounded-full"
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Content based on what's being viewed */}
      {showPlaceDetails ? (
        <PlaceDetails place={selectedPlace} onBack={handleBackClick} />
      ) : showListDetails ? (
        <ListDetails
          listId={selectedList}
          onBack={handleBackClick}
          onPlaceClick={handlePlaceClick}
          onShare={handleShareList}
          onDelete={handleDeleteList}
          onAddPlace={handleAddPlaceToList}
        />
      ) : showAddPlaceToList && selectedList ? (
        <AddPlaceToList
          listId={selectedList}
          onBack={() => {
            setShowAddPlaceToList(false)
            setShowListDetails(true)
          }}
          onSuccess={() => {
            setShowAddPlaceToList(false)
            setShowListDetails(true)
            // Refresh the list details
            // This could be improved by updating the state directly
            router.refresh()
          }}
        />
      ) : showProfile ? (
        <ProfileView user={user} onBack={handleBackClick} onSignOut={handleSignOut} />
      ) : showLogin ? (
        <LoginView
          onBack={handleBackClick}
          onLoginSuccess={() => {
            setShowLogin(false)
            setShowProfile(true)
          }}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-black/10">
            <button
              className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "discover" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
            <button
              className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "mylists" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
              onClick={() => setActiveTab("mylists")}
            >
              My Lists
            </button>
            <button
              className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "places" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
              onClick={() => setActiveTab("places")}
            >
              Places
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Input
                type="text"
                className="w-full border border-black/20 pl-9 pr-4 py-2 text-sm"
                placeholder={`Search ${activeTab === "mylists" ? "lists" : "places"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-black/40" />
              {searchQuery && (
                <button
                  className="absolute right-3 top-2.5 text-black/40"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="flex-grow overflow-y-auto p-4">
            {activeTab === "discover" && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-serif text-lg">Popular Lists</h2>
                  <button className="text-sm hover:underline" onClick={() => setActiveTab("mylists")}>
                    See All
                  </button>
                </div>
                <div className="mb-6">
                  {isLoadingLists ? (
                    <div className="text-center py-4">Loading lists...</div>
                  ) : listsError ? (
                    <div className="text-red-500 text-center py-4">Error: {listsError}</div>
                  ) : popularLists.length === 0 ? (
                    <div className="text-center py-4">No lists found</div>
                  ) : (
                    popularLists.map((list) => (
                      <div
                        key={list.id}
                        className="mb-2 p-2 hover:bg-gray-50 border border-black/10 cursor-pointer"
                        onClick={() => handleListClick(list)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{list.title}</h3>
                            <p className="text-xs text-black/60">
                              by {list.owner?.farcaster_username || "Anonymous"} • {list.places?.length || 0} places
                            </p>
                          </div>
                          <button
                            className="text-black hover:bg-black/5 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareList(list.id)
                            }}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-serif text-lg">Places Near You</h2>
                  <button className="flex items-center text-sm text-black/70 hover:bg-black/5 p-1 rounded">
                    <Filter size={14} className="mr-1" /> Filter
                  </button>
                </div>
                <div>
                  {isLoadingPlaces ? (
                    <div className="text-center py-4">Loading places...</div>
                  ) : placesError ? (
                    <div className="text-red-500 text-center py-4">Error: {placesError}</div>
                  ) : nearbyPlaces.length === 0 ? (
                    <div className="text-center py-4">No places found</div>
                  ) : (
                    nearbyPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="mb-2 p-2 hover:bg-gray-50 border border-black/10 cursor-pointer flex"
                        onClick={() => handlePlaceClick(place)}
                      >
                        <div
                          className="h-12 w-12 bg-gray-200 rounded mr-3"
                          style={{
                            backgroundImage: `url(/placeholder.svg?height=200&width=300&query=${encodeURIComponent(place.name)})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        ></div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{place.name}</h3>
                          <p className="text-xs text-black/60">{place.address || "No address"}</p>
                          <div className="flex text-xs text-black/60 mt-1">
                            <span className="mr-3">{place.type || "Place"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "mylists" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-serif text-lg">My Lists</h2>
                  <Button
                    className="bg-black text-white hover:bg-black/80 px-3 py-1 text-sm flex items-center"
                    onClick={() => setShowNewListModal(true)}
                  >
                    <Plus size={16} className="mr-1" /> New List
                  </Button>
                </div>

                {!userIsAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="mb-4">Connect with Farcaster to create and manage lists</p>
                    <Button className="bg-black text-white hover:bg-black/80" onClick={() => setShowLogin(true)}>
                      Connect
                    </Button>
                  </div>
                ) : isLoadingLists ? (
                  <div className="text-center py-4">Loading your lists...</div>
                ) : listsError ? (
                  <div className="text-red-500 text-center py-4">Error: {listsError}</div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-black/60 mb-2">YOUR LISTS</h3>
                      {userLists.length === 0 ? (
                        <div className="text-center py-4">
                          <p>You haven't created any lists yet.</p>
                          <Button
                            className="mt-2 bg-black text-white hover:bg-black/80"
                            onClick={() => setShowNewListModal(true)}
                          >
                            Create Your First List
                          </Button>
                        </div>
                      ) : (
                        userLists.map((list) => (
                          <div
                            key={list.id}
                            className="mb-2 p-3 border rounded cursor-pointer border-black/20 hover:bg-gray-50"
                            onClick={() => handleListClick(list)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{list.title}</h3>
                                <p className="text-sm text-black/60">{list.places?.length || 0} places</p>
                              </div>
                              <div className="flex">
                                <button
                                  className="text-black/60 hover:text-black hover:bg-black/5 p-1 rounded mr-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareList(list.id)
                                  }}
                                >
                                  <Share2 size={16} />
                                </button>
                                <button
                                  className="text-black/60 hover:text-black hover:bg-black/5 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Open settings for this list
                                    router.push(`/?list=${list.id}&edit=true`)
                                  }}
                                >
                                  <Settings size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {savedLists.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-black/60 mb-2">SAVED LISTS</h3>
                        {savedLists.map((list) => (
                          <div
                            key={list.id}
                            className="mb-2 p-3 border rounded cursor-pointer border-black/20 hover:bg-gray-50"
                            onClick={() => handleListClick(list)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{list.title}</h3>
                                <p className="text-sm text-black/60">{list.places?.length || 0} places</p>
                              </div>
                              <button
                                className="text-black/60 hover:text-black hover:bg-black/5 p-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShareList(list.id)
                                }}
                              >
                                <Share2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "places" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-serif text-lg">All Places</h2>
                  <Button
                    className="bg-black text-white hover:bg-black/80 px-3 py-1 text-sm flex items-center"
                    onClick={handleAddPlace}
                  >
                    <Plus size={16} className="mr-1" /> Add Place
                  </Button>
                </div>

                <div className="mb-4 flex items-center">
                  <button className="flex items-center mr-3 text-sm text-black/60 hover:bg-black/5 p-1 rounded">
                    <Filter size={14} className="mr-1" /> Filter
                  </button>
                  <button className="flex items-center text-sm text-black/60 hover:bg-black/5 p-1 rounded">
                    Sort: <span className="font-medium ml-1">Recent</span>
                  </button>
                </div>

                {isLoadingPlaces ? (
                  <div className="text-center py-4">Loading places...</div>
                ) : placesError ? (
                  <div className="text-red-500 text-center py-4">Error: {placesError}</div>
                ) : nearbyPlaces.length === 0 ? (
                  <div className="text-center py-4">No places found</div>
                ) : (
                  nearbyPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="mb-2 p-2 hover:bg-gray-50 border border-black/10 cursor-pointer flex"
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div
                        className="h-12 w-12 bg-gray-200 rounded mr-3"
                        style={{
                          backgroundImage: `url(/placeholder.svg?height=200&width=300&query=${encodeURIComponent(place.name)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{place.name}</h3>
                        <p className="text-xs text-black/60">{place.address || "No address"}</p>
                        <div className="flex text-xs text-black/60 mt-1">
                          <span>{place.type || "Place"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Show modals if active */}
      {showNewListModal && <CreateListModal onClose={() => setShowNewListModal(false)} />}
      {showAddPlaceModal && <AddPlaceModal onClose={() => setShowAddPlaceModal(false)} userLists={userLists} />}
    </div>
  )
}
