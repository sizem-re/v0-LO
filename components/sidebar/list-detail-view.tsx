"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Edit, Trash2, Plus, Globe, Users, Lock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"
import type { Place } from "@/types/place"

interface ListOwner {
  id: string
  farcaster_id?: string
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
}

interface ListData {
  id: string
  title: string
  description: string
  visibility: string
  cover_image_url?: string
  created_at: string
  updated_at: string
  owner: ListOwner
  places: Place[]
}

interface ListDetailViewProps {
  listId: string
  onBack: () => void
  onPlaceClick: (place: Place) => void
  onEditList: (list: ListData) => void
  onDeleteList: (list: ListData) => void
  onAddPlace: (listId: string) => void
}

export function ListDetailView({
  listId,
  onBack,
  onPlaceClick,
  onEditList,
  onDeleteList,
  onAddPlace,
}: ListDetailViewProps) {
  const [list, setList] = useState<ListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()
  const { isAuthenticated: neynarAuthenticated, user: neynarUser } = useNeynarContext()

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true)
        console.log(`Fetching list with ID: ${listId}`)

        const response = await fetch(`/api/lists/${listId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || response.statusText
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("List data received:", data)
        setList(data)
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    if (listId) {
      fetchList()
    } else {
      setError("List ID is missing")
      setLoading(false)
    }
  }, [listId])

  // Check if the current user is the owner of the list
  const isOwner = () => {
    if (!list || !list.owner) return false

    if (isAuthenticated && user) {
      return user.id === list.owner.id
    }

    if (neynarAuthenticated && neynarUser) {
      return neynarUser.fid.toString() === list.owner.farcaster_id
    }

    return false
  }

  const getVisibilityIcon = () => {
    switch (list?.visibility) {
      case "public":
        return <Globe size={16} className="text-green-600" />
      case "community":
        return <Users size={16} className="text-blue-600" />
      case "private":
        return <Lock size={16} className="text-orange-600" />
      default:
        return <Globe size={16} className="text-green-600" />
    }
  }

  const getVisibilityText = () => {
    switch (list?.visibility) {
      case "public":
        return "Public - Anyone can view"
      case "community":
        return "Community - Anyone can add places"
      case "private":
        return "Private - Only you can view"
      default:
        return "Public - Anyone can view"
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-4 w-full">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ChevronLeft size={18} />
          </Button>
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-5 w-20 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="h-full overflow-y-auto p-4 w-full">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-lg font-serif">Error</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error || "Failed to load list"}</p>
          <Button variant="ghost" className="mt-2" onClick={onBack}>
            Go back
          </Button>
        </div>
      </div>
    )
  }

  // Get owner display name safely
  const ownerName = list.owner
    ? list.owner.farcaster_display_name || list.owner.farcaster_username || "Unknown user"
    : "Unknown user"

  return (
    <div className="h-full overflow-y-auto p-4 w-full">
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 -ml-2">
          <ChevronLeft size={18} />
        </Button>
        <h2 className="text-lg font-serif truncate">{list.title}</h2>
      </div>

      <div className="flex items-center gap-1 text-sm text-black/70 mb-1">
        {getVisibilityIcon()}
        <span>{getVisibilityText()}</span>
      </div>

      <p className="text-xs text-black/60 mb-4">Created by {ownerName}</p>

      {list.description && <p className="text-sm mb-4">{list.description}</p>}

      {isOwner() && (
        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => onEditList(list)}>
            <Edit size={14} />
            Edit List
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDeleteList(list)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 ml-auto"
            onClick={() => onAddPlace(list.id)}
          >
            <Plus size={14} />
            Add Place
          </Button>
        </div>
      )}

      <h3 className="font-medium mb-3 flex items-center gap-1">
        <MapPin size={16} />
        Places
      </h3>

      {list.places && list.places.length > 0 ? (
        <div className="space-y-3">
          {list.places.map((place) => (
            <div
              key={place.id}
              className="border border-black/10 rounded-md p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onPlaceClick(place)}
            >
              <h4 className="font-medium mb-1">{place.name}</h4>
              {place.address && <p className="text-sm text-black/70 mb-1">{place.address}</p>}
              {place.description && <p className="text-sm">{place.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-black/10 rounded-md p-6 text-center">
          <p className="text-black/60 mb-4">No places in this list yet</p>
          {isOwner() && (
            <Button onClick={() => onAddPlace(list.id)} className="bg-black text-white hover:bg-black/80">
              <Plus size={16} className="mr-2" />
              Add Your First Place
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
