"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, MapPin, Share2, Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ListDetailsProps {
  listId: string | null
  onBack: () => void
  onPlaceClick: (place: any) => void
  onShare?: (listId: string) => void
  onDelete?: (listId: string) => void
  onAddPlace?: (listId: string) => void
}

export function ListDetails({ listId, onBack, onPlaceClick, onShare, onDelete, onAddPlace }: ListDetailsProps) {
  const router = useRouter()
  const { dbUser } = useAuth()
  const [list, setList] = useState<any>(null)
  const [places, setPlaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListDetails = async () => {
      if (!listId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lists/${listId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch list details")
        }

        const data = await response.json()
        setList(data)

        // Extract places from the list data
        if (data.places && Array.isArray(data.places)) {
          const extractedPlaces = data.places.filter((item: any) => item.place).map((item: any) => item.place)
          setPlaces(extractedPlaces)
        }
      } catch (err) {
        console.error("Error fetching list details:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchListDetails()
  }, [listId])

  const isOwner = list && dbUser ? list.owner_id === dbUser.id : false

  const handleAddPlace = () => {
    if (listId && onAddPlace) {
      onAddPlace(listId)
    }
  }

  const handleEditList = () => {
    if (listId) {
      router.push(`/lists/${listId}/edit`)
    }
  }

  const handleShareList = () => {
    if (listId && onShare) {
      onShare(listId)
    }
  }

  const handleDeleteList = () => {
    if (listId && onDelete) {
      onDelete(listId)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-black/10 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-1 mr-2 hover:bg-gray-100 rounded-sm" aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-medium">List Details</h2>
        </div>
        <div className="flex">
          <button onClick={handleShareList} className="p-1 hover:bg-gray-100 rounded-sm mr-1" aria-label="Share List">
            <Share2 size={18} />
          </button>
          {isOwner && (
            <>
              <button onClick={handleEditList} className="p-1 hover:bg-gray-100 rounded-sm mr-1" aria-label="Edit List">
                <Settings size={18} />
              </button>
              <button onClick={handleDeleteList} className="p-1 hover:bg-gray-100 rounded-sm" aria-label="Delete List">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <p>Loading list details...</p>
        </div>
      ) : error ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : list ? (
        <>
          <div className="p-4 border-b border-black/10">
            <h3 className="font-serif text-xl mb-1">{list.title}</h3>
            {list.description && <p className="text-sm text-black/70 mb-2">{list.description}</p>}
            <div className="flex items-center text-xs text-black/60">
              <span>
                {list.visibility === "private" ? "Private" : list.visibility === "public" ? "Public" : "Community"}
              </span>
              <span className="mx-2">•</span>
              <span>{places.length} places</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {places.length === 0 ? (
              <div className="p-4 text-center">
                <p className="mb-4">This list doesn't have any places yet.</p>
                {isOwner && (
                  <Button className="bg-black text-white hover:bg-black/80" onClick={handleAddPlace}>
                    Add Your First Place
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onPlaceClick(place)}
                  >
                    <div className="flex items-start">
                      <div
                        className="h-12 w-12 bg-gray-200 rounded mr-3 flex-shrink-0"
                        style={{
                          backgroundImage: `url(/placeholder.svg?height=200&width=300&query=${encodeURIComponent(place.name)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>
                      <div>
                        <h4 className="font-medium">{place.name}</h4>
                        <div className="flex items-start mt-1">
                          <MapPin size={14} className="mr-1 flex-shrink-0 mt-0.5 text-black/60" />
                          <p className="text-xs text-black/60 line-clamp-2">{place.address || "No address"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="p-4 border-t border-black/10">
              <Button
                className="w-full bg-black text-white hover:bg-black/80 flex items-center justify-center"
                onClick={handleAddPlace}
              >
                <Plus size={16} className="mr-2" />
                Add Place
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p>List not found</p>
        </div>
      )}
    </div>
  )
}
