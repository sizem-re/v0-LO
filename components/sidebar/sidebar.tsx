"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, ListIcon, MapPin, User, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { LoginView } from "./login-view"
import { UserProfileView } from "./user-profile-view"
import { CreateListModal } from "@/components/create-list-modal"
import { ListDetailView } from "./list-detail-view"
import { PlaceDetailView } from "./place-detail-view"
import { PlacesListView } from "./places-list-view"
import { SidebarSearch } from "./sidebar-search"
import { AddPlaceModal } from "./add-place-modal"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onCenterMap?: (coordinates: { lat: number; lng: number }) => void
  initialView?: "lists" | "places" | "profile" | "search"
  initialListId?: string
  initialPlaceId?: string
}

export function Sidebar({ isOpen, onToggle, onCenterMap, initialView, initialListId, initialPlaceId }: SidebarProps) {
  const { isAuthenticated } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user } = useNeynarContext()
  const router = useRouter()
  const pathname = usePathname()

  const userIsAuthenticated = isAuthenticated || neynarAuthenticated

  const [activeTab, setActiveTab] = useState<"lists" | "places" | "profile" | "search">(initialView || "lists")
  const [activeView, setActiveView] = useState<"list" | "lists" | "place" | "places" | "profile" | "search" | "login">(
    initialView || "lists",
  )
  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId || null)
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [listsKey, setListsKey] = useState(0) // Used to force refresh lists
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)
  const [addPlaceListId, setAddPlaceListId] = useState<string | null>(null)

  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      // setIsMobile(mobile)

      // Only auto-collapse on initial load, not on resize
      if (!sidebarRef.current) {
        // setIsCollapsed(mobile || isMiniApp)
      }
    }

    // Check on mount and window resize
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [initialListId, initialPlaceId, initialView, userIsAuthenticated])

  useEffect(() => {
    if (initialListId) {
      setActiveView("list")
      setSelectedListId(initialListId)
    } else if (initialPlaceId) {
      // Fetch place details and set selected place
      fetch(`/api/places/${initialPlaceId}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedPlace(data)
          setActiveView("place")
        })
        .catch((err) => console.error("Error fetching place:", err))
    } else if (initialView) {
      setActiveTab(initialView)

      if (initialView === "profile" && !userIsAuthenticated) {
        setActiveView("login")
      } else {
        setActiveView(initialView === "places" ? "places" : "lists")
      }
    }
  }, [initialListId, initialPlaceId, initialView, userIsAuthenticated])

  const handleProfileClick = () => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      // setIsCollapsed(false) // Always expand sidebar when showing login
    } else {
      // If user is authenticated, toggle profile view or navigate to profile
      setActiveTab("profile")
      setSelectedListId(null) // Clear any selected list
      setSelectedPlace(null) // Clear any selected place
      // setIsCollapsed(false)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setShowLogin(false)
    setSelectedListId(null) // Clear any selected list
    setSelectedPlace(null) // Clear any selected place
    // setIsCollapsed(false) // Always expand sidebar when changing tabs
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
  }

  const handleBackFromList = () => {
    setSelectedListId(null)
    setSelectedPlace(null) // Clear any selected place
  }

  const handlePlaceClick = (place: any) => {
    console.log("Place clicked:", place)
    setSelectedPlace(place)
    // Don't collapse sidebar here to show the place details
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
    // You would typically call a function on the map component to center the map
    // For now, we'll just dispatch a custom event that the map can listen for
    const event = new CustomEvent("centerMap", { detail: coordinates })
    window.dispatchEvent(event)
  }

  const handleNavigateToList = (listId: string) => {
    console.log("Navigate to list:", listId)
    setSelectedListId(listId)
    setSelectedPlace(null) // Clear any selected place when navigating to a list
  }

  const handleTabChange = (tab: "lists" | "places" | "profile" | "search") => {
    setActiveTab(tab)

    if (tab === "profile" && !userIsAuthenticated) {
      setActiveView("login")
    } else if (tab === "search") {
      setActiveView("search")
    } else {
      setActiveView(tab === "places" ? "places" : "lists")
    }
  }

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId)
    setActiveView("list")

    // Update URL without full navigation
    router.push(`/lists/${listId}`, { scroll: false })
  }

  const handlePlaceSelect = (place: any) => {
    setSelectedPlace(place)
    setActiveView("place")

    // Update URL without full navigation
    if (place.id) {
      router.push(`/places/${place.id}`, { scroll: false })
    }
  }

  const handleBack = () => {
    if (activeView === "list") {
      setActiveView("lists")
      router.push("/lists", { scroll: false })
    } else if (activeView === "place") {
      setActiveView(activeTab === "places" ? "places" : "lists")
      router.push(activeTab === "places" ? "/places" : "/lists", { scroll: false })
    } else if (activeView === "login") {
      setActiveView("lists")
      setActiveTab("lists")
    }
  }

  const handleAddPlaceModal = (listId?: string) => {
    setAddPlaceListId(listId || null)
    setShowAddPlaceModal(true)
  }

  const handlePlaceAdded = (place: any) => {
    // If we're in the places tab, refresh the places list
    if (activeTab === "places") {
      // This would ideally update the places list without a full reload
      setActiveView("places")
    }

    // If a list ID was provided, navigate to that list
    if (addPlaceListId) {
      setSelectedListId(addPlaceListId)
      setActiveView("list")
    }

    setShowAddPlaceModal(false)
  }

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-full max-w-sm bg-white shadow-lg transition-transform duration-300 ease-in-out sm:border-r sm:border-black/10",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-black/10 px-4">
          <div className="flex items-center">
            <span className="font-serif text-xl">LO</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggle}
              className="rounded-full p-2 text-black hover:bg-black/5"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex h-[calc(100%-3.5rem)] flex-col">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Lists View */}
            {activeView === "lists" && (
              <div className="p-4">
                <h2 className="mb-4 text-lg font-medium">Your Lists</h2>
                {/* Lists content would go here */}
                <div className="text-center py-8">
                  <p className="mb-4">Create and manage your lists of places</p>
                  {userIsAuthenticated && (
                    <Button className="bg-black text-white hover:bg-black/80">
                      <Plus size={16} className="mr-1" /> Create List
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Places View */}
            {activeView === "places" && (
              <PlacesListView onPlaceSelect={handlePlaceSelect} onAddPlace={() => handleAddPlaceModal()} />
            )}

            {/* List Detail View */}
            {activeView === "list" && selectedListId && (
              <ListDetailView
                listId={selectedListId}
                onBack={handleBack}
                onPlaceSelect={handlePlaceSelect}
                onAddPlace={() => handleAddPlaceModal(selectedListId)}
                onCenterMap={handleCenterMap}
              />
            )}

            {/* Place Detail View */}
            {activeView === "place" && selectedPlace && (
              <PlaceDetailView
                place={selectedPlace}
                listId={selectedListId || ""}
                onBack={handleBack}
                onPlaceUpdated={handlePlaceUpdated}
                onCenterMap={handleCenterMap}
                onNavigateToList={handleListSelect}
              />
            )}

            {/* Profile View */}
            {activeView === "profile" && userIsAuthenticated && <UserProfileView />}

            {/* Login View */}
            {activeView === "login" && <LoginView onBack={handleBack} />}

            {/* Search View */}
            {activeView === "search" && (
              <SidebarSearch onPlaceSelect={handlePlaceSelect} onListSelect={handleListSelect} />
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="flex h-14 shrink-0 items-center justify-around border-t border-black/10">
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2",
                activeTab === "lists" ? "text-black" : "text-black/60 hover:text-black",
              )}
              onClick={() => handleTabChange("lists")}
            >
              <ListIcon size={20} />
              <span className="mt-1 text-xs">Lists</span>
            </button>
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2",
                activeTab === "places" ? "text-black" : "text-black/60 hover:text-black",
              )}
              onClick={() => handleTabChange("places")}
            >
              <MapPin size={20} />
              <span className="mt-1 text-xs">Places</span>
            </button>
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2",
                activeTab === "search" ? "text-black" : "text-black/60 hover:text-black",
              )}
              onClick={() => handleTabChange("search")}
            >
              <Search size={20} />
              <span className="mt-1 text-xs">Search</span>
            </button>
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2",
                activeTab === "profile" ? "text-black" : "text-black/60 hover:text-black",
              )}
              onClick={() => handleTabChange("profile")}
            >
              <User size={20} />
              <span className="mt-1 text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && <div className="fixed inset-0 z-10 bg-black/20 sm:hidden" onClick={onToggle} aria-hidden="true" />}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onListCreated={handleListCreated}
      />

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <AddPlaceModal
          listId={addPlaceListId || ""}
          onClose={() => setShowAddPlaceModal(false)}
          onPlaceAdded={handlePlaceAdded}
        />
      )}
    </>
  )
}
