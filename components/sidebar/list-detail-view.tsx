"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, MapPin, Globe, Users, Lock, Edit, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Place {
  id: string
  name: string
  type: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  image?: string
  notes?: string
  listPlaceId: string
}

interface ListOwner {
  id: string
  farcaster_id: string
  farcaster_username: string
  farcaster_display_name: string
  farcaster_pfp_url: string
}

interface List {
  id: string
  title: string
  description: string | null
  visibility: "public" | "community" | "private"
  owner: ListOwner
  places: Place[]
  created_at: string
}

interface ListDetailViewProps {
  listId: string
  onBack: () => void
  onPlaceClick?: (place: Place) => void
  onEditList?: (list: List) => void
  onDeleteList?: (list: List) => void
  onAddPlace?: (listId: string) => void
}

export function ListDetailView({
  listId,
  onBack,
  onPlaceClick,
  onEditList,
  onDeleteList,
  onAddPlace,
}: ListDetailViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) {
        setLoading(false)
        setError("List ID is missing")
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/lists/${listId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch list: ${response.status}`)
        }

        const data = await response.json()
        setList(data)
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [listId])

  const handlePlaceClick = (place: Place) => {
    if (onPlaceClick) {
      onPlaceClick(place)
    }
  }

  const handleEditList = () => {
    if (list && onEditList) {
      onEditList(list)
    }
  }

  const handleDeleteList = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    if (list && onDeleteList) {
      onDeleteList(list)
    }
  }

  const handleAddPlace = () => {
    if (onAddPlace) {
      onAddPlace(listId)
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe size={14} className="text-green-600" />
      case "community":
        return <Users size={14} className="text-blue-600" />
      case "private":
        return <Lock size={14} className="text-gray-600" />
      default:
        return <Globe size={14} className="text-green-600" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "Public"
      case "community":
        return "Community"
      case "private":
        return "Private"
      default:
        return "Public"
    }
  }

  const isOwner = list?.owner?.id === user?.id

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
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
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded hover:bg-black/5"
              onClick={handleEditList}
              aria-label="Edit list"
              title="Edit list"
            >
              <Edit size={16} />
            </button>
            <button
              className={`p-1 rounded hover:bg-black/5 ${deleteConfirm ? "text-red-600" : ""}`}
              onClick={handleDeleteList}
              aria-label="Delete list"
              title={deleteConfirm ? "Click again to confirm deletion" : "Delete list"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{list.title}</h2>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center text-xs text-black/60">
              {getVisibilityIcon(list.visibility)}
              <span className="ml-1">{getVisibilityText(list.visibility)}</span>
            </div>
            <span className="text-black/40">•</span>
            <div className="flex items-center text-xs text-black/60">
              by {list.owner.farcaster_username || "Unknown"}
            </div>
          </div>

          {list.description && <p className="text-sm text-black/80 mb-4">{list.description}</p>}

          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="font-medium">Places ({list.places.length})</h3>
            {(isOwner || list.visibility === "community") && (
              <Button
                className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8 flex items-center"
                onClick={handleAddPlace}
              >
                <Plus size={14} className="mr-1" /> Add Place
              </Button>
            )}
          </div>

          {list.places.length > 0 ? (
            <div className="space-y-3">
              {list.places.map((place) => (
                <div
                  key={place.listPlaceId}
                  className="p-2 border border-black/10 rounded hover:bg-black/5 cursor-pointer flex"
                  onClick={() => handlePlaceClick(place)}
                >
                  <div
                    className="h-12 w-12 bg-gray-200 rounded mr-3 flex-shrink-0"
                    style={{
                      backgroundImage: place.image ? `url(${place.image})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{place.name}</h4>
                    <div className="flex items-center text-black/60 text-xs">
                      <MapPin size={12} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{place.address}</span>
                    </div>
                    {place.notes && <p className="text-xs text-black/70 mt-1 truncate">{place.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-black/10 rounded">
              <p className="text-black/60 mb-4">No places in this list yet</p>
              {(isOwner || list.visibility === "community") && (
                <Button className="bg-black text-white hover:bg-black/80" onClick={handleAddPlace}>
                  <Plus size={16} className="mr-1" /> Add Your First Place
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
