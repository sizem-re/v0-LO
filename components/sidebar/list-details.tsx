"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Edit, Share2, MapPin, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Place {
  id: string
  name: string
  type: string
  address: string
  image?: string
  coordinates: {
    lat: number
    lng: number
  }
}

interface ListDetailsProps {
  listId: string | null
  onBack: () => void
  onPlaceClick: (place: any) => void
}

export function ListDetails({ listId, onBack, onPlaceClick }: ListDetailsProps) {
  const router = useRouter()
  const [list, setList] = useState<any>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) {
        setLoading(false)
        setError("List ID is missing")
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/lists/${listId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch list: ${response.statusText}`)
        }

        const data = await response.json()
        setList(data)
        setPlaces(data.places || [])
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [listId])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p>{error || "Failed to load list"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex gap-2">
          <button className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
            <Share2 size={16} />
          </button>
          <Link href={`/lists/${listId}/edit`} className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
            <Edit size={16} />
          </Link>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{list.title}</h2>
          <p className="text-sm text-black/60 mb-2">
            by {list.owner?.farcaster_username || "Unknown"} • {places.length} places
          </p>
          {list.description && <p className="text-sm text-black/80 mb-4">{list.description}</p>}

          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="font-medium">Places</h3>
            <Button
              className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8 flex items-center"
              onClick={() => router.push(`/lists/${listId}/add-place`)}
            >
              <Plus size={14} className="mr-1" /> Add Place
            </Button>
          </div>

          {places.length > 0 ? (
            <div className="space-y-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="p-2 border border-black/10 rounded hover:bg-black/5 cursor-pointer flex"
                  onClick={() => onPlaceClick(place)}
                >
                  <div
                    className="h-12 w-12 bg-gray-200 rounded mr-3"
                    style={{
                      backgroundImage: place.image ? `url(${place.image})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div>
                    <h4 className="font-medium">{place.name}</h4>
                    <div className="flex items-center text-black/60 text-xs">
                      <MapPin size={12} className="mr-1" />
                      {place.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-black/10 rounded">
              <p className="text-black/60 mb-4">No places in this list yet</p>
              <Button
                className="bg-black text-white hover:bg-black/80"
                onClick={() => router.push(`/lists/${listId}/add-place`)}
              >
                <Plus size={16} className="mr-1" /> Add Your First Place
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
