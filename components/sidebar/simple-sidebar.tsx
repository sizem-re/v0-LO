"use client"

import { useState } from "react"
import { ChevronLeft, ListIcon, MapPin, Search, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLists } from "@/hooks/use-lists"
import { usePlaces } from "@/hooks/use-places"
import { ListCard } from "@/components/lists/list-card"
import { PlaceCard } from "@/components/places/place-card"

interface SimpleSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SimpleSidebar({ isOpen, onClose }: SimpleSidebarProps) {
  const [activeTab, setActiveTab] = useState("discover")
  const [searchQuery, setSearchQuery] = useState("")

  // Get lists and places using our custom hooks
  const { lists: popularLists, isLoading: isLoadingLists } = useLists()
  const { lists: userLists, isLoading: isLoadingUserLists } = useLists("user123") // Mock user ID
  const { places, isLoading: isLoadingPlaces } = usePlaces()

  // Filter lists and places based on search query
  const filteredPopularLists = popularLists.filter(
    (list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredUserLists = userLists.filter(
    (list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredPlaces = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle list click
  const handleListClick = (list: any) => {
    console.log("List clicked:", list)
    // In a real app, this would navigate to the list details or show a modal
  }

  // Handle place click
  const handlePlaceClick = (place: any) => {
    console.log("Place clicked:", place)
    // In a real app, this would show place details or center the map on the place
  }

  // If sidebar is closed, don't render anything
  if (!isOpen) return null

  return (
    <div className="bg-white h-full border-r border-black/10 w-80 flex flex-col z-10">
      {/* Header with close button */}
      <div className="flex justify-between items-center border-b border-black/10 px-4 py-3">
        <h1 className="font-serif text-xl">LO</h1>
        <button className="p-1 hover:bg-gray-100 rounded-full" onClick={onClose} aria-label="Close sidebar">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10">
        <button
          className={`flex-1 text-center py-3 px-2 font-serif ${
            activeTab === "discover" ? "border-b-2 border-black font-medium" : "text-black/70"
          }`}
          onClick={() => setActiveTab("discover")}
        >
          Discover
        </button>
        <button
          className={`flex-1 text-center py-3 px-2 font-serif ${
            activeTab === "mylists" ? "border-b-2 border-black font-medium" : "text-black/70"
          }`}
          onClick={() => setActiveTab("mylists")}
        >
          My Lists
        </button>
        <button
          className={`flex-1 text-center py-3 px-2 font-serif ${
            activeTab === "places" ? "border-b-2 border-black font-medium" : "text-black/70"
          }`}
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
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-serif text-lg">Popular Lists</h2>
            </div>

            {isLoadingLists ? (
              <div className="text-center py-4">
                <p className="text-black/60">Loading lists...</p>
              </div>
            ) : filteredPopularLists.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-black/60">No lists found</p>
              </div>
            ) : (
              filteredPopularLists.map((list) => <ListCard key={list.id} list={list} onClick={handleListClick} />)
            )}

            <div className="mt-6 mb-3">
              <h2 className="font-serif text-lg">Popular Places</h2>
            </div>

            {isLoadingPlaces ? (
              <div className="text-center py-4">
                <p className="text-black/60">Loading places...</p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-black/60">No places found</p>
              </div>
            ) : (
              filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} onClick={handlePlaceClick} />)
            )}
          </>
        )}

        {activeTab === "mylists" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-lg">My Lists</h2>
              <Button
                className="bg-black text-white hover:bg-black/80 px-3 py-1 text-sm flex items-center"
                onClick={() => console.log("Create new list")}
              >
                <Plus size={16} className="mr-1" /> New List
              </Button>
            </div>

            {isLoadingUserLists ? (
              <div className="text-center py-4">
                <p className="text-black/60">Loading your lists...</p>
              </div>
            ) : filteredUserLists.length === 0 ? (
              <div className="text-center py-8">
                <ListIcon size={40} className="mx-auto mb-4 text-black/40" />
                <h2 className="text-xl font-medium mb-2">No Lists Yet</h2>
                <p className="text-black/60 mb-4">Create your first list to start organizing places.</p>
                <Button
                  className="bg-black text-white hover:bg-black/80"
                  onClick={() => console.log("Create new list")}
                >
                  Create List
                </Button>
              </div>
            ) : (
              filteredUserLists.map((list) => <ListCard key={list.id} list={list} onClick={handleListClick} />)
            )}
          </>
        )}

        {activeTab === "places" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-lg">Places</h2>
              <Button
                className="bg-black text-white hover:bg-black/80 px-3 py-1 text-sm flex items-center"
                onClick={() => console.log("Add new place")}
              >
                <Plus size={16} className="mr-1" /> Add Place
              </Button>
            </div>

            {isLoadingPlaces ? (
              <div className="text-center py-4">
                <p className="text-black/60">Loading places...</p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-8">
                <MapPin size={40} className="mx-auto mb-4 text-black/40" />
                <h2 className="text-xl font-medium mb-2">No Places Yet</h2>
                <p className="text-black/60 mb-4">Add your first place to start building your collection.</p>
                <Button className="bg-black text-white hover:bg-black/80" onClick={() => console.log("Add new place")}>
                  Add Place
                </Button>
              </div>
            ) : (
              filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} onClick={handlePlaceClick} />)
            )}
          </>
        )}
      </div>
    </div>
  )
}
