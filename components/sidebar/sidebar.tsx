"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, ListIcon, Plus, ChevronLeft, ChevronRight, User, Home, Menu } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginView } from "./login-view"
import { useMiniApp } from "@/hooks/use-mini-app"
import { UserProfileView } from "./user-profile-view"
import { CreateListModal } from "@/components/create-list-modal"
import { UserListsDisplay } from "@/components/user-lists-display"
import { ListDetailView } from "./list-detail-view"

export function Sidebar() {
  // Get miniapp context
  const { isMiniApp } = useMiniApp()

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
  const [listsKey, setListsKey] = useState(0) // Used to force refresh lists
  const [selectedListId, setSelectedListId] = useState<string | null>(null)

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

  const handleProfileClick = () => {
    if (!userIsAuthenticated) {
      setShowLogin(true)
      setIsCollapsed(false) // Always expand sidebar when showing login
    } else {
      // If user is authenticated, toggle profile view or navigate to profile
      setActiveTab("profile")
      setSelectedListId(null) // Clear any selected list
      setIsCollapsed(false)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setShowLogin(false)
    setSelectedListId(null) // Clear any selected list
    setIsCollapsed(false) // Always expand sidebar when changing tabs
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
  }

  const handleBackFromList = () => {
    setSelectedListId(null)
  }

  const handlePlaceClick = (place: any) => {
    console.log("Place clicked:", place)
    // Here you would typically center the map on this place
    // or show a place detail view
    setIsCollapsed(true) // Collapse sidebar to show the map better
  }

  const handleEditList = (list: any) => {
    console.log("Edit list:", list)
    // Here you would show an edit list modal or navigate to edit page
  }

  const handleDeleteList = async (list: any) => {
    console.log("Delete list:", list)
    // After successful deletion, go back to the lists view
    setSelectedListId(null)
    // Force refresh the lists
    setListsKey((prev) => prev + 1)
  }

  const handleAddPlace = (listId: string) => {
    console.log("Add place to list:", listId)
    // Here you would show an add place modal or navigate to add place page
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
        className="bg-white h-full border-r border-black/10 flex flex-col items-center py-4 transition-all duration-300 ease-in-out"
        style={{ width: isMobile || isMiniApp ? "40px" : "48px" }}
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
          <h1 className="font-serif text-xl">LO</h1>
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
                    </div>
                  </div>

                  {/* Content based on active tab */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "discover" && (
                      <div className="text-center py-8">
                        <p>Discover places and lists from the community.</p>
                        {!userIsAuthenticated && (
                          <Button
                            className="mt-4 bg-black text-white hover:bg-black/80"
                            onClick={() => setShowLogin(true)}
                          >
                            Connect to get started
                          </Button>
                        )}
                      </div>
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
                      <div className="text-center py-8">
                        <p className="mb-4">Explore places on the map</p>
                        {userIsAuthenticated && (
                          <Button className="bg-black text-white hover:bg-black/80">
                            <Plus size={16} className="mr-1" /> Add Place
                          </Button>
                        )}
                      </div>
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
    </>
  )
}
