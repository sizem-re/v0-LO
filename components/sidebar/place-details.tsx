"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Plus, MapPin, Edit, Share2, ExternalLink, Trash2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToListDialog } from "@/components/add-to-list-dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { MapPreview } from "@/components/map/map-preview"

interface PlaceDetailsProps {
  place: any
  onBack: () => void
}

export function PlaceDetails({ place: initialPlace, onBack }: PlaceDetailsProps) {
  const [place, setPlace] = useState<any>(initialPlace)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [listsError, setListsError] = useState<string | null>(null)
  const [isInFavorites, setIsInFavorites] = useState(false)
  const { isAuthenticated, dbUser } = useAuth()
  const router = useRouter()

  // Fetch the place details
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!initialPlace?.id) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/places/${initialPlace.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch place details")
        }

        const data = await response.json()
        setPlace(data)
      } catch (err) {
        console.error("Error fetching place details:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaceDetails()
  }, [initialPlace?.id])

  // Fetch user's lists
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!isAuthenticated || !dbUser?.id) return

      setIsLoadingLists(true)
      setListsError(null)

      try {
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch lists")
        }

        const data = await response.json()
        setUserLists(data)

        // Check if place is in any of the user's lists
        const isInAnyList = data.some((list: any) => list.places?.some((p: any) => p.place_id === initialPlace.id))
        setIsInFavorites(isInAnyList)
      } catch (err) {
        console.error("Error fetching user lists:", err)
        setListsError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchUserLists()
  }, [isAuthenticated, dbUser?.id, initialPlace?.id])

  const handleAddToList = async (listId: string) => {
    if (!isAuthenticated || !place?.id) return

    try {
      const response = await fetch("/api/list-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId,
          placeId: place.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add place to list")
      }

      // Refresh the lists
      const listsResponse = await fetch(`/api/lists?userId=${dbUser?.id}`)
      if (listsResponse.ok) {
        const data = await listsResponse.json()
        setUserLists(data)
      }

      setShowAddToListDialog(false)
    } catch (err) {
      console.error("Error adding place to list:", err)
      // Show error message
    }
  }

  const handleRemoveFromList = async (listId: string) => {
    if (!isAuthenticated || !place?.id) return

    try {
      const response = await fetch(`/api/list-places?listId=${listId}&placeId=${place.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove place from list")
      }

      // Refresh the lists
      const listsResponse = await fetch(`/api/lists?userId=${dbUser?.id}`)
      if (listsResponse.ok) {
        const data = await listsResponse.json()
        setUserLists(data)
      }
    } catch (err) {
      console.error("Error removing place from list:", err)
      // Show error message
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !place?.id) return

    try {
      // Find or create a "Favorites" list
      let favoritesListId = userLists.find((list) => list.title === "Favorites")?.id

      if (!favoritesListId) {
        // Create a new Favorites list
        const createResponse = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Favorites",
            description: "My favorite places",
            visibility: "private",
          }),
        })

        if (!createResponse.ok) {
          throw new Error("Failed to create Favorites list")
        }

        const newList = await createResponse.json()
        favoritesListId = newList.id
      }

      if (isInFavorites) {
        // Remove from favorites
        await handleRemoveFromList(favoritesListId)
        setIsInFavorites(false)
      } else {
        // Add to favorites
        await handleAddToList(favoritesListId)
        setIsInFavorites(true)
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
      // Show error message
    }
  }

  const handleEditPlace = () => {
    if (!place?.id) return
    router.push(`/places/${place.id}/edit`)
  }

  const handleDeletePlace = async () => {
    if (!isAuthenticated || !place?.id) return

    if (!confirm("Are you sure you want to delete this place?")) return

    try {
      const response = await fetch(`/api/places/${place.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete place")
      }

      onBack() // Go back to the previous view
    } catch (err) {
      console.error("Error deleting place:", err)
      // Show error message
    }
  }

  const handleSharePlace = () => {
    if (!place?.id) return

    // Create the URL to share
    const shareUrl = `${window.location.origin}/places/${place.id}`

    // Use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: place.name,
          text: `Check out ${place.name} on LO`,
          url: shareUrl,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert("Link copied to clipboard!")
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err)
        })
    }
  }

  const handleGetDirections = () => {
    if (!place?.lat || !place?.lng) return

    // Open Google Maps directions in a new tab
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 w-full mb-4"></div>
            <div className="h-6 bg-gray-200 w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 w-1/2 mb-4"></div>
            <div className="h-40 bg-gray-200 w-full mb-4"></div>
            <div className="h-10 bg-gray-200 w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !place) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading place details</p>
            <p className="text-sm text-black/60">{error || "Place not found"}</p>
            <Button className="mt-4" onClick={onBack}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get the lists that contain this place
  const listsWithPlace = userLists.filter((list) => list.places?.some((p: any) => p.place_id === place.id))

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex">
          <button
            className={`text-black/70 hover:text-black hover:bg-black/5 p-1 rounded mr-1 ${isInFavorites ? "text-red-500 hover:text-red-600" : ""}`}
            onClick={handleToggleFavorite}
            title={isInFavorites ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} fill={isInFavorites ? "currentColor" : "none"} />
          </button>
          <button
            className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded mr-1"
            onClick={handleSharePlace}
            title="Share place"
          >
            <Share2 size={16} />
          </button>
          {isAuthenticated && dbUser?.id === place.created_by && (
            <>
              <button
                className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded mr-1"
                onClick={handleEditPlace}
                title="Edit place"
              >
                <Edit size={16} />
              </button>
              <button
                className="text-black/70 hover:text-red-500 hover:bg-black/5 p-1 rounded"
                onClick={handleDeletePlace}
                title="Delete place"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div
          className="h-48 bg-gray-200 relative"
          style={{
            backgroundImage: `url(${place.image || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(place.name)}`})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            className="absolute top-2 right-2 bg-white rounded-full p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => setShowAddToListDialog(true)}
            title="Add to list"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{place.name}</h2>
          <div className="flex items-center text-black/60 text-sm mb-4">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="line-clamp-2">{place.address || "No address provided"}</span>
          </div>

          {listsWithPlace.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-2">On these lists:</h3>
              <div className="flex flex-wrap gap-2">
                {listsWithPlace.map((list) => (
                  <button
                    key={list.id}
                    className="bg-gray-100 px-2 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                    onClick={() => {
                      // Navigate to list or show list details
                      router.push(`/lists/${list.id}`)
                    }}
                  >
                    {list.title}
                  </button>
                ))}
                <button
                  className="bg-black/5 text-black px-2 py-1 rounded-full text-xs flex items-center hover:bg-black/10 transition-colors"
                  onClick={() => setShowAddToListDialog(true)}
                >
                  <Plus size={12} className="mr-1" /> Add to list
                </button>
              </div>
            </div>
          )}

          {place.description && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-2">About:</h3>
              <p className="text-sm text-black/80">{place.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Location:</h3>
            <div className="h-40 bg-gray-200 rounded-md overflow-hidden">
              {place.lat && place.lng ? (
                <MapPreview
                  center={{ lat: Number.parseFloat(place.lat), lng: Number.parseFloat(place.lng) }}
                  zoom={15}
                  markers={[
                    { lat: Number.parseFloat(place.lat), lng: Number.parseFloat(place.lng), title: place.name },
                  ]}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-black/60">No location data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-black text-white hover:bg-black/80 w-full"
              onClick={handleGetDirections}
              disabled={!place.lat || !place.lng}
            >
              <MapPin size={16} className="mr-2" /> Get Directions
            </Button>
            {place.website_url && (
              <Button
                className="bg-transparent text-black border border-black/20 hover:bg-black/5"
                onClick={() => window.open(place.website_url, "_blank")}
              >
                <ExternalLink size={16} className="mr-2" /> Website
              </Button>
            )}
          </div>

          {place.type && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Type:</h3>
              <div className="bg-gray-100 inline-block px-2 py-1 rounded-full text-xs">{place.type}</div>
            </div>
          )}

          <div className="mt-4 text-xs text-black/50">
            <p>Added {new Date(place.created_at).toLocaleDateString()}</p>
            {place.updated_at && place.updated_at !== place.created_at && (
              <p>Updated {new Date(place.updated_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
      {showAddToListDialog && (
        <AddToListDialog
          open={showAddToListDialog}
          onOpenChange={setShowAddToListDialog}
          place={place}
          lists={userLists}
          onCreateList={() => {
            // Handle create list action
            router.push(`/lists/create?placeId=${place.id}`)
            setShowAddToListDialog(false)
          }}
          onAddToList={handleAddToList}
        />
      )}
    </div>
  )
}
