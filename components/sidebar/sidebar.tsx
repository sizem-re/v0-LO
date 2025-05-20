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
import { useRouter } from "next/navigation"

interface SidebarList {
  id: string
  title: string
  description: string | null
  visibility: string
  created_at: string
  owner_id: string
  cover_image_url: string | null
  places_count: number
}

export function Sidebar() {
  // Get miniapp context
  const { isMiniApp } = useMiniApp()
  const router = useRouter()

  // Detect mobile devices
  const [isMobile, setIsMobile] = useState(false)

  // State for sidebar visibility
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Sidebar content state
  const [activeTab, setActiveTab] = useState("discover")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [showListDetails, setShowListDetails] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null)

  // Lists and places state
  const [userLists, setUserLists] = useState<SidebarList[]>([])
  const [savedLists, setSavedLists] = useState<SidebarList[]>([])
  const [popularLists, setPopularLists] = useState<SidebarList[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auth context
  const { isAuthenticated, dbUser } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user } = useNeynarContext()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated

  // Ref for the sidebar element
  const sidebarRef = useRef<HTMLDivElement>(null)

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

  // Fetch user lists when the user is authenticated and the active tab is "mylists"
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!dbUser?.id || activeTab !== "mylists") return

      setIsLoadingLists(true)
      setError(null)

      try {
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch lists")
        }

        const data = await response.json()
        setUserLists(data)
      } catch (err) {
        console.error("Error fetching user lists:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchUserLists()
  }, [dbUser?.id, activeTab])

  // Fetch popular lists when the active tab is "discover"
  useEffect(() => {
    const fetchPopularLists = async () => {
      if (activeTab !== "discover") return

      setIsLoadingLists(true)
      setError(null)

      try {
        const response = await fetch(`/api/lists?visibility=public&limit=5`)

        if (!response.ok) {
          throw new Error("Failed to fetch popular lists")
        }

        const data = await response.json()
        setPopularLists(data)
      } catch (err) {
        console.error("Error fetching popular lists:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchPopularLists()
  }, [activeTab])

  // Fetch nearby places when the active tab is "places"
  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (activeTab !== "places") return

      setIsLoadingPlaces(true)
      setError(null)

      try {
        const response = await fetch(`/api/places?limit=10`)

        if (!response.ok) {
          throw new Error("Failed to fetch places")
        }

        const data = await response.json()
        setNearbyPlaces(data)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingPlaces(false)
      }
    }

    fetchNearbyPlaces()
  }, [activeTab])

  const handleProfileClick = () => {
    if (userIsAuthenticated) {
      setShowProfile(true)
      setShowPlaceDetails(false)
      setShowListDetails(false)
      setShowLogin(false)
      setIsCollapsed(false) // Always expand sidebar when showing profile
    } else {
      setShowLogin(true)
      setShowPlaceDetails(false)
      setShowListDetails(false)
      setShowProfile(false)
      setIsCollapsed(false) // Always expand sidebar when showing login
    }
  }

  const handlePlaceClick = (place: any) => {
    setSelectedPlace(place)
    setShowPlaceDetails(true)
    setShowListDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setIsCollapsed(false) // Always expand sidebar when showing place details
  }

  const handleListClick = (list: any) => {
    setSelectedList(list.id)
    setShowListDetails(true)
    setShowPlaceDetails(false)
    setShowProfile(false)
    setShowLogin(false)
    setIsCollapsed(false) // Always expand sidebar when showing list details
  }

  const handleBackClick = () => {
    setShowPlaceDetails(false)
    setShowListDetails(false)
    setShowProfile(false)
    setShowLogin(false)
  }

  const handleAddPlace = () => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      setIsCollapsed(false) // Always expand sidebar when showing login
      return
    }

    setShowAddPlaceModal(true)
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    handleBackClick()
    setIsCollapsed(false) // Always expand sidebar when changing tabs
  }

  const handleCreateListSuccess = (newList: SidebarList) => {
    setShowNewListModal(false)
    setUserLists((prev) => [newList, ...prev])

    // Navigate to the list details
    setSelectedList(newList.id)
    setShowListDetails(true)
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
          <h1 className="font-serif text-xl font-bold">LO</h1>
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
        <h1 className="font-serif text-xl">LO</h1>
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
        <ListDetails listId={selectedList} onBack={handleBackClick} onPlaceClick={handlePlaceClick} />
      ) : showProfile ? (
        <ProfileView user={user} onBack={handleBackClick} />
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
                    <div className="text-center py-4">
                      <p className="text-black/60">Loading lists...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : popularLists.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-black/60">No popular lists found</p>
                    </div>
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
                            <p className="text-xs text-black/60">{list.places_count} places</p>
                          </div>
                          <button className="text-black hover:bg-black/5 p-1 rounded">
                            <Plus size={16} />
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
                    <div className="text-center py-4">
                      <p className="text-black/60">Loading places...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : nearbyPlaces.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-black/60">No places found nearby</p>
                    </div>
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
                            backgroundImage: place.photo_url ? `url(${place.photo_url})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        ></div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{place.name}</h3>
                          <p className="text-xs text-black/60">{place.address}</p>
                          <div className="flex text-xs text-black/60 mt-1">
                            <span className="mr-3">{place.lists_count || 0} lists</span>
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
                  <div className="text-center py-4">
                    <p className="text-black/60">Loading your lists...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : userLists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="mb-4">You haven't created any lists yet</p>
                    <Button className="bg-black text-white hover:bg-black/80" onClick={() => setShowNewListModal(true)}>
                      Create Your First List
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-black/60 mb-2">YOUR LISTS</h3>
                      {userLists.map((list) => (
                        <div
                          key={list.id}
                          className="mb-2 p-3 border rounded cursor-pointer border-black/20 hover:bg-gray-50"
                          onClick={() => handleListClick(list)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{list.title}</h3>
                              <p className="text-sm text-black/60">{list.places_count || 0} places</p>
                            </div>
                            <button
                              className="text-black/60 hover:text-black hover:bg-black/5 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/lists/${list.id}/edit`)
                              }}
                            >
                              <Settings size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
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
                                <p className="text-sm text-black/60">{list.places_count || 0} places</p>
                              </div>
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
                  <div className="text-center py-4">
                    <p className="text-black/60">Loading places...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : nearbyPlaces.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="mb-4">No places found</p>
                    <Button className="bg-black text-white hover:bg-black/80" onClick={handleAddPlace}>
                      Add Your First Place
                    </Button>
                  </div>
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
                          backgroundImage: place.photo_url ? `url(${place.photo_url})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{place.name}</h3>
                        <p className="text-xs text-black/60">{place.address}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {place.lists &&
                            place.lists.slice(0, 2).map((listName: string, idx: number) => (
                              <span key={idx} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                                {listName}
                              </span>
                            ))}
                          {place.lists && place.lists.length > 2 && (
                            <span className="text-xs text-black/60">+{place.lists.length - 2} more</span>
                          )}
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
      {showNewListModal && (
        <CreateListModal onClose={() => setShowNewListModal(false)} onSuccess={handleCreateListSuccess} />
      )}
      {showAddPlaceModal && <AddPlaceModal onClose={() => setShowAddPlaceModal(false)} userLists={userLists} />}
    </div>
  )
}
