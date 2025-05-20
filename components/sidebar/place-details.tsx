"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Plus, MapPin, Globe, Edit, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToListDialog } from "@/components/add-to-list-dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { MapPreview } from "@/components/map-preview"

interface PlaceDetailsProps {
  place: any
  onBack: () => void
}

export function PlaceDetails({ place: initialPlace, onBack }: PlaceDetailsProps) {
  const [place, setPlace] = useState<any>(initialPlace)
  const [lists, setLists] = useState<any[]>([])
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoadingUserLists, setIsLoadingUserLists] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { isAuthenticated, dbUser } = useAuth()
  const router = useRouter()

  // Fetch place details and lists it belongs to
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!initialPlace?.id) return

      setIsLoading(true)
      setError(null)

      try {
        // Fetch place details
        const response = await fetch(`/api/places/${initialPlace.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch place details")
        }

        const data = await response.json()
        setPlace(data)

        // Fetch lists this place belongs to
        const listsResponse = await fetch(`/api/places/${initialPlace.id}/lists`)

        if (!listsResponse.ok) {
          throw new Error("Failed to fetch place lists")
        }

        const listsData = await listsResponse.json()
        setLists(listsData)
      } catch (err) {
        console.error("Error fetching place details:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaceDetails()
  }, [initialPlace?.id])

  // Fetch user's lists for the add to list dialog
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!isAuthenticated || !dbUser?.id) return

      setIsLoadingUserLists(true)

      try {
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch user lists")
        }

        const data = await response.json()
        setUserLists(data)
      } catch (err) {
        console.error("Error fetching user lists:", err)
      } finally {
        setIsLoadingUserLists(false)
      }
    }

    fetchUserLists()
  }, [isAuthenticated, dbUser?.id])

  const handleEditPlace = () => {
    router.push(`/places/${place.id}/edit`)
  }

  const handleDeletePlace = async () => {
    if (!confirm("Are you sure you want to delete this place?")) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/places/${place.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete place")
      }

      // Go back after successful deletion
      onBack()
    } catch (err) {
      console.error("Error deleting place:", err)
      alert("Failed to delete place. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddToList = async (listId: string) => {
    try {
      const response = await fetch(`/api/list-places`, {
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

      // Refresh lists
      const listsResponse = await fetch(`/api/places/${place.id}/lists`)
      const listsData = await listsResponse.json()
      setLists(listsData)

      setShowAddToListDialog(false)
    } catch (err) {
      console.error("Error adding place to list:", err)
      alert("Failed to add place to list. Please try again.")
    }
  }

  const handleGetDirections = () => {
    if (place.lat && place.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, "_blank")
    }
  }

  const handleSharePlace = () => {
    if (navigator.share) {
      navigator
        .share({
          title: place.name,
          text: `Check out ${place.name} on LO`,
          url: `${window.location.origin}/places/${place.id}`,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback for browsers that don't support the Web Share API
      const url = `${window.location.origin}/places/${place.id}`
      navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
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
          <p>Loading place details...</p>
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
          <p className="text-red-500">Error: {error || "Place not found"}</p>
        </div>
      </div>
    )
  }

  const isOwner = dbUser?.id === place.created_by

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex items-center">
          <button
            className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded mr-1"
            onClick={handleSharePlace}
          >
            <Share2 size={16} />
          </button>
          {isOwner && (
            <>
              <button
                className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded mr-1"
                onClick={handleEditPlace}
              >
                <Edit size={16} />
              </button>
              <button
                className="text-red-500/70 hover:text-red-500 hover:bg-red-500/5 p-1 rounded"
                onClick={handleDeletePlace}
                disabled={isDeleting}
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
            backgroundImage: `url(/placeholder.svg?height=300&width=400&query=${encodeURIComponent(place.name + " " + (place.type || ""))})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            className="absolute top-2 right-2 bg-white rounded-full p-1 cursor-pointer hover:bg-gray-100"
            onClick={() => setShowAddToListDialog(true)}
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{place.name}</h2>
          <div className="flex items-center text-black/60 text-sm mb-4">
            <MapPin size={14} className="mr-1" />
            {place.address || "No address provided"}
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">On these lists:</h3>
            <div className="flex flex-wrap gap-2">
              {lists.length === 0 ? (
                <p className="text-sm text-black/60">This place is not on any lists yet.</p>
              ) : (
                lists.map((list) => (
                  <button
                    key={list.id}
                    className="bg-gray-100 px-2 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                    onClick={() => {
                      router.push(`/lists/${list.id}`)
                    }}
                  >
                    {list.title}
                  </button>
                ))
              )}
              <button
                className="bg-black/5 text-black px-2 py-1 rounded-full text-xs flex items-center hover:bg-black/10 transition-colors"
                onClick={() => setShowAddToListDialog(true)}
              >
                <Plus size={12} className="mr-1" /> Add to list
              </button>
            </div>
          </div>

          {place.description && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-2">About:</h3>
              <p className="text-sm text-black/80">{place.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Location:</h3>
            <div className="h-40 bg-gray-200 rounded-md overflow-hidden">
              <MapPreview
                lat={Number.parseFloat(place.lat)}
                lng={Number.parseFloat(place.lng)}
                zoom={15}
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-black text-white hover:bg-black/80 w-full" onClick={handleGetDirections}>
              <MapPin size={16} className="mr-2" /> Get Directions
            </Button>
            {place.website_url && (
              <Button
                className="bg-transparent text-black border border-black/20 hover:bg-black/5"
                onClick={() => window.open(place.website_url, "_blank")}
              >
                <Globe size={16} className="mr-2" /> Website
              </Button>
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
          onAddToList={handleAddToList}
          onCreateList={() => {
            router.push(`/lists/create?placeId=${place.id}`)
          }}
        />
      )}
    </div>
  )
}
