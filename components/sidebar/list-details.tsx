"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, MapPin, ExternalLink, Calendar, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface Place {
  id: string
  name: string
  address: string | null
  description: string | null
  lat: number
  lng: number
  type: string | null
  created_at: string
  website_url: string | null
}

interface ListDetailsProps {
  listId: string | null
  onBack: () => void
  onPlaceClick: (place: any) => void
}

export function ListDetails({ listId, onBack, onPlaceClick }: ListDetailsProps) {
  const [list, setList] = useState<any>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { dbUser } = useAuth()
  const router = useRouter()

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
        const listPlaces = data.places?.map((item: any) => item.place) || []
        setPlaces(listPlaces)
      } catch (err) {
        console.error("Error fetching list details:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchListDetails()
  }, [listId])

  const isOwner = dbUser?.id && list?.owner_id === dbUser.id

  const handleEditList = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (listId) {
      router.push(`/lists/${listId}/edit`)
    }
  }

  const handleAddPlace = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (listId) {
      router.push(`/lists/${listId}/add-place`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-2 p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif text-lg">Loading...</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-2 p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif text-lg">Error</h2>
        </div>
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={onBack} className="bg-black text-white hover:bg-black/80">
          Go Back
        </Button>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-2 p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif text-lg">List Not Found</h2>
        </div>
        <p className="mb-4">The list you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack} className="bg-black text-white hover:bg-black/80">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-black/10">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="mr-2 p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif text-lg">{list.title}</h2>
        </div>
        <div className="flex items-center text-sm text-black/60 mb-2">
          <span className="mr-2">
            by {list.owner?.farcaster_username || list.owner?.farcaster_display_name || "Anonymous"}
          </span>
          <span>
            {list.visibility === "public"
              ? "🌎 Public"
              : list.visibility === "community"
                ? "👥 Community"
                : "🔒 Private"}
          </span>
        </div>
        {list.description && <p className="text-sm mb-3">{list.description}</p>}

        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button
                className="bg-black text-white hover:bg-black/80 px-3 py-1 text-xs flex items-center"
                onClick={handleEditList}
              >
                <Edit size={14} className="mr-1" /> Edit List
              </Button>
              <Button
                className="bg-black text-white hover:bg-black/80 px-3 py-1 text-xs flex items-center"
                onClick={handleAddPlace}
              >
                <MapPin size={14} className="mr-1" /> Add Place
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-black/60 mb-2">PLACES ({places.length})</h3>

        {places.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-black/20 rounded-md">
            <p className="text-black/60 mb-2">No places in this list yet</p>
            {isOwner && (
              <Button className="bg-black text-white hover:bg-black/80 px-3 py-1 text-xs" onClick={handleAddPlace}>
                Add Your First Place
              </Button>
            )}
          </div>
        ) : (
          places.map((place) => (
            <div
              key={place.id}
              className="mb-2 p-3 border rounded cursor-pointer border-black/20 hover:bg-gray-50"
              onClick={() => onPlaceClick(place)}
            >
              <h3 className="font-medium">{place.name}</h3>
              {place.address && <p className="text-sm text-black/60">{place.address}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {place.type && <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{place.type}</span>}
                {place.website_url && (
                  <a
                    href={place.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center hover:underline text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} className="mr-1" /> Website
                  </a>
                )}
                <span className="text-xs flex items-center text-black/60">
                  <Calendar size={12} className="mr-1" />
                  {new Date(place.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
