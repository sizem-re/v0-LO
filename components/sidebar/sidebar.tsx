"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, ListIcon, ChevronLeft, ChevronRight, User, Home, Menu } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginView } from "./login-view"
import { useMiniApp } from "@/hooks/use-mini-app"
import { UserProfileView } from "./user-profile-view"
import { CreateListModal } from "@/components/create-list-modal"
import { UserListsDisplay } from "@/components/user-lists-display"
import { ListDetailView } from "./list-detail-view"
import { PlaceDetailView } from "./place-detail-view"
import { PlacesListView } from "./places-list-view"
import { AddPlaceModal } from "./add-place-modal"
import { DiscoverView } from "./discover-view"

interface SidebarProps {
  initialListId?: string | null
}

export function Sidebar({ initialListId }: SidebarProps = {}) {
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
  const [showLogin, setShowLogin] = useState(false)
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)
  const [listsKey, setListsKey] = useState(0) // Used to force refresh lists
  const [placesRefreshTrigger, setPlacesRefreshTrigger] = useState(0)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null)

  // Auth context
  const { isAuthenticated } = useAuth()
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
    
    // Add debounce to resize handler to prevent rapid state changes
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkMobile, 100)
    }
    
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer)
    }
  }, [isMiniApp])

  // Handle clicks outside the sidebar to auto-collapse on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle click-outside if:
      // 1. We're on mobile
      // 2. The sidebar is expanded
      // 3. The click is not within the sidebar
      // 4. The click is not on a modal or dialog (they usually have role="dialog")
      // 5. We're not in the middle of an interaction (like adding a place)
      if (
        isMobile && 
        !isCollapsed && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node)
      ) {
        const clickedElement = event.target as HTMLElement
        const isModalClick = clickedElement.closest('[role="dialog"]') !== null
        const isInInteraction = showCreateListModal || showAddPlaceModal || showLogin
        
        if (!isModalClick && !isInInteraction) {
          setIsCollapsed(true)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isCollapsed, showCreateListModal, showAddPlaceModal, showLogin])

  // Prevent sidebar collapse during certain interactions
  useEffect(() => {
    if (showCreateListModal || showAddPlaceModal || showLogin) {
      setIsCollapsed(false)
    }
  }, [showCreateListModal, showAddPlaceModal, showLogin])

  // Listen for place selection from map
  useEffect(() => {
    const handlePlaceSelectFromMap = (event: Event) => {
      const customEvent = event as CustomEvent<{ place: any; navigateToPlaces: boolean }>
      const { place, navigateToPlaces } = customEvent.detail

      if (navigateToPlaces) {
        // Switch to places tab and show place details
        setActiveTab("places")
        setSelectedPlace(place)
        setSelectedListId(null)
        setIsCollapsed(false) // Ensure sidebar is expanded
      }
    }

    window.addEventListener("selectPlaceFromMap", handlePlaceSelectFromMap as EventListener)

    return () => {
      window.removeEventListener("selectPlaceFromMap", handlePlaceSelectFromMap as EventListener)
    }
  }, [])

  // Handle initial list ID from URL
  useEffect(() => {
    console.log('Sidebar initialListId effect:', { initialListId, selectedListId, userIsAuthenticated })
    
    if (initialListId && !selectedListId) {
      console.log("Setting initial list ID from URL:", initialListId)
      setSelectedListId(initialListId)
      setActiveTab("mylists")
      setIsCollapsed(false) // Ensure sidebar is expanded to show the list
    }
    // Note: We removed the auto-clearing logic here because it was interfering with manual list selection
    // The URL parameter clearing is handled by navigation functions (handleBackFromList, handleTabClick, etc.)
  }, [initialListId, selectedListId])

  const handleProfileClick = () => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      setIsCollapsed(false) // Always expand sidebar when showing login
    } else {
      // If user is authenticated, toggle profile view or navigate to profile
      setActiveTab("profile")
      setSelectedListId(null) // Clear any selected list
      setSelectedPlace(null) // Clear any selected place
      setIsCollapsed(false)
      // Clear the list parameter from URL if present
      if (typeof window !== 'undefined' && window.location.search.includes('list=')) {
        router.replace('/', { scroll: false })
      }
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setSearchQuery("") // Reset search when switching tabs
    setSelectedListId(null)
    setSelectedPlace(null)
    // Clear the list parameter from URL if present
    if (typeof window !== 'undefined' && window.location.search.includes('list=')) {
      router.replace('/', { scroll: false })
    }
  }

  const handleCreateList = () => {
    setShowCreateListModal(true)
  }

  const handleListCreated = (list: { id: string; title: string }) => {
    console.log("List created:", list)
    // Force refresh the lists
    setListsKey((prev) => prev + 1)
    // You could add additional logic here, like showing a success message
    // or navigating to the new list
  }

  const handleSelectList = (listId: string) => {
    setSelectedListId(listId)
    setSelectedPlace(null) // Clear any selected place
    // If we're currently in the profile view, switch away from it to show the list
    if (activeTab === "profile") {
      setActiveTab("mylists")
    }
  }

  const handleBackFromList = () => {
    setSelectedListId(null)
    setSelectedPlace(null) // Clear any selected place
    // Clear the list parameter from URL when going back from a list
    if (typeof window !== 'undefined' && window.location.search.includes('list=')) {
      router.replace('/', { scroll: false })
    }
  }

  const handlePlaceClick = (place: any) => {
    console.log("Place clicked:", place)
    setSelectedPlace(place)
    setIsCollapsed(false) // Ensure sidebar stays expanded when viewing place details
  }

  const handleBackFromPlace = () => {
    setSelectedPlace(null)
  }

  const handleEditList = (list: any) => {
    console.log("Edit list:", list)
    // Here you would show an edit list modal or navigate to edit page
  }

  const handleDeleteList = async (list: any) => {
    console.log("Delete list:", list)
    // After successful deletion, go back to the lists view
    setSelectedListId(null)
    setSelectedPlace(null) // Clear any selected place
    // Force refresh the lists
    setListsKey((prev) => prev + 1)
  }

  const handleAddPlace = (listId: string) => {
    console.log("Add place to list:", listId)
    // Here you would show an add place modal or navigate to add place page
  }

  const handlePlaceUpdated = (updatedPlace: any) => {
    console.log("Place updated:", updatedPlace)
    // Update the selected place with the new data
    setSelectedPlace(updatedPlace)
  }

  const handlePlaceDeleted = (placeId: string) => {
    console.log("Place deleted:", placeId)
    // Go back to the list view
    setSelectedPlace(null)
  }

  const handleCenterMap = (coordinates: { lat: number; lng: number }) => {
    // This function will be passed to the map component to center on a place
    console.log("Center map on:", coordinates)
    // Dispatch event to center the map
    const event = new CustomEvent("centerMap", { detail: coordinates })
    window.dispatchEvent(event)
    // Only collapse the sidebar if no place is currently selected
    // This allows the place details to remain visible when auto-centering
    if (!selectedPlace) {
      setIsCollapsed(true)
    }
  }

  const handleNavigateToList = (listId: string) => {
    console.log("Navigate to list:", listId)
    setSelectedListId(listId)
    setSelectedPlace(null) // Clear any selected place when navigating to a list
  }

  const handleAddPlaceFromTab = () => {
    setShowAddPlaceModal(true)
  }

  const handlePlaceAdded = (place: any) => {
    console.log("Place added:", place)
    setPlacesRefreshTrigger(prev => prev + 1) // Trigger places list refresh
    setShowAddPlaceModal(false)
  }

  // For very small screens, we can completely hide the sidebar
  if (isHidden) {
    return (
      <button
        className="absolute top-2 left-2 z-50 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
        onClick={() => {
          setIsHidden(false)
          setIsCollapsed(false) // Ensure sidebar expands when showing it again
        }}
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
        className="bg-white h-full border-r border-black/10 flex flex-col items-center py-4 transition-all duration-300 ease-in-out"
        style={{ width: isMobile || isMiniApp ? "40px" : "48px" }}
      >
        {/* LO Logotype */}
        <div className="mb-2 flex flex-col items-center">
          <button 
            onClick={() => {
              setActiveTab("discover")
              setSelectedListId(null)
              setSelectedPlace(null)
              setIsCollapsed(false)
              // Clear the list parameter from URL when clicking logo
              if (typeof window !== 'undefined' && window.location.search.includes('list=')) {
                router.replace('/', { scroll: false })
              }
            }}
            className="font-serif text-xl font-bold hover:opacity-70 transition-opacity"
          >
            LO
          </button>
          <button
            className="mt-2 p-1 hover:bg-gray-100 rounded-full"
            onClick={() => {
              setIsCollapsed(false)
              if (selectedPlace) {
                // If there's a selected place, make sure it stays visible
                setSelectedPlace(selectedPlace)
              }
            }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-full h-px bg-black/10 my-2"></div>

        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "discover" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => {
            setIsCollapsed(false)
            handleTabClick("discover")
          }}
          aria-label="Discover"
        >
          <Home size={20} />
        </button>
        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "mylists" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => {
            setIsCollapsed(false)
            handleTabClick("mylists")
          }}
          aria-label="My Lists"
        >
          <ListIcon size={20} />
        </button>
        <button
          className={`p-2 rounded-full mb-2 ${activeTab === "places" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          onClick={() => {
            setIsCollapsed(false)
            handleTabClick("places")
          }}
          aria-label="Places"
        >
          <MapPin size={20} />
        </button>
        <div className="flex-grow"></div>
        {userIsAuthenticated ? (
          <div className="flex flex-col items-center gap-2">
            <button
              className={`p-2 rounded-full ${activeTab === "profile" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
              onClick={handleProfileClick}
              aria-label="Profile"
            >
              {user?.pfp_url ? (
                <img
                  src={user.pfp_url || "/placeholder.svg"}
                  alt="Profile"
                  className="w-6 h-6 rounded-full border border-black/10"
                />
              ) : (
                <User size={20} />
              )}
            </button>
          </div>
        ) : (
          <button
            className="p-2 rounded-full text-black hover:bg-gray-100"
            onClick={() => {
              setShowLogin(true)
              setIsCollapsed(false)
            }}
            aria-label="Sign In"
          >
            <User size={20} />
          </button>
        )}

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
    <>
      <div
        ref={sidebarRef}
        className="bg-white h-full border-r border-black/10 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          width: isMobile || isMiniApp ? "85vw" : "320px",
          maxWidth: "320px",
        }}
      >
        {/* Header with collapse button and profile button */}
        <div className="flex justify-between items-center border-b border-black/10 px-4 py-3">
          <button 
            onClick={() => {
              setActiveTab("discover")
              setSelectedListId(null)
              setSelectedPlace(null)
              // Clear the list parameter from URL when clicking logo
              if (typeof window !== 'undefined' && window.location.search.includes('list=')) {
                router.replace('/', { scroll: false })
              }
            }}
            className="font-serif text-xl hover:opacity-70 transition-opacity"
          >
            LO
          </button>
          <div className="flex items-center gap-2">
            {/* Profile button in header */}
            {userIsAuthenticated ? (
              <button
                className={`p-1 hover:bg-gray-100 rounded-full ${activeTab === "profile" ? "bg-gray-100" : ""}`}
                onClick={handleProfileClick}
                aria-label="Profile"
              >
                {user?.pfp_url ? (
                  <img
                    src={user.pfp_url || "/placeholder.svg"}
                    alt="Profile"
                    className="w-6 h-6 rounded-full border border-black/10"
                  />
                ) : (
                  <User size={18} />
                )}
              </button>
            ) : (
              <button
                className="p-1 hover:bg-gray-100 rounded-full"
                onClick={() => setShowLogin(true)}
                aria-label="Sign In"
              >
                <User size={18} />
              </button>
            )}
            <button
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Content based on what's being viewed */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {showLogin ? (
            <div className="flex-1 overflow-y-auto">
              <LoginView
                onBack={() => setShowLogin(false)}
                onLoginSuccess={() => {
                  setShowLogin(false)
                }}
              />
            </div>
          ) : (
            <>
              {activeTab === "profile" ? (
                <div className="flex-1 overflow-y-auto">
                  <UserProfileView
                    onClose={() => setActiveTab("discover")}
                    expanded={true}
                    onCreateList={handleCreateList}
                    onSelectList={handleSelectList}
                    key={listsKey}
                  />
                </div>
              ) : selectedPlace ? (
                <div className="flex-1 overflow-y-auto">
                  <PlaceDetailView
                    place={selectedPlace}
                    listId={selectedListId || ""}
                    onBack={handleBackFromPlace}
                    onPlaceUpdated={handlePlaceUpdated}
                    onPlaceDeleted={handlePlaceDeleted}
                    onCenterMap={handleCenterMap}
                    onNavigateToList={handleNavigateToList}
                  />
                </div>
              ) : selectedListId ? (
                <div className="flex-1 overflow-y-auto">
                  <ListDetailView
                    listId={selectedListId}
                    onBack={handleBackFromList}
                    onPlaceClick={handlePlaceClick}
                    onEditList={handleEditList}
                    onDeleteList={handleDeleteList}
                    onAddPlace={handleAddPlace}
                  />
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-black/10">
                    <button
                      className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "discover" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
                      onClick={() => handleTabClick("discover")}
                    >
                      Discover
                    </button>
                    <button
                      className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "mylists" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
                      onClick={() => handleTabClick("mylists")}
                    >
                      My Lists
                    </button>
                    <button
                      className={`flex-1 text-center py-3 px-2 font-serif ${activeTab === "places" ? "border-b-2 border-black font-medium" : "text-black/70"}`}
                      onClick={() => handleTabClick("places")}
                    >
                      Places
                    </button>
                  </div>

                  {/* Search bar - show for discover, mylists, and places tabs */}
                  {(activeTab === "discover" || activeTab === "mylists" || activeTab === "places") && (
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
                      </div>
                    </div>
                  )}

                  {/* Content based on active tab */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "discover" && (
                      <DiscoverView
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelectList={handleSelectList}
                        onLogin={() => setShowLogin(true)}
                      />
                    )}

                    {activeTab === "mylists" && (
                      <UserListsDisplay
                        compact={true}
                        onCreateList={handleCreateList}
                        onSelectList={handleSelectList}
                        key={listsKey}
                      />
                    )}

                    {activeTab === "places" && (
                      <PlacesListView
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onPlaceClick={handlePlaceClick}
                        onAddPlace={handleAddPlaceFromTab}
                        refreshTrigger={placesRefreshTrigger}
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onListCreated={handleListCreated}
      />

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <AddPlaceModal
          listId=""
          onClose={() => setShowAddPlaceModal(false)}
          onPlaceAdded={handlePlaceAdded}
          onRefreshList={() => {
            setPlacesRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </>
  )
}
