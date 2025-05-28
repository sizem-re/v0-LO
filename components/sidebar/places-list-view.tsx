"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"

interface Place {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type?: string
  description?: string
  website_url?: string
  created_at: string
  created_by?: string
  list_count?: { count: number }[]
}

interface PlacesListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onPlaceClick: (place: Place) => void
  onAddPlace: () => void
  refreshTrigger?: number
  onCreateList?: () => void
}

export function PlacesListView({ searchQuery, onSearchChange, onPlaceClick, onAddPlace, refreshTrigger, onCreateList }: PlacesListViewProps) {
  const { dbUser } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(true)

  useEffect(() => {
    fetchPlaces()
    fetchUserLists()
  }, [dbUser?.id]) // Re-fetch when user authentication changes

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchPlaces()
      fetchUserLists()
    }
  }, [refreshTrigger])

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build URL with user ID if available
      const params = new URLSearchParams()
      if (dbUser?.id) {
        params.append("userId", dbUser.id)
      }
      
      const url = `/api/places${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch places")
      }

      const data = await response.json()
      setPlaces(data || [])
    } catch (err) {
      console.error("Error fetching places:", err)
      setError("Failed to load places")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserLists = async () => {
    if (!dbUser?.id) {
      setIsLoadingLists(false)
      return
    }

    try {
      const response = await fetch(`/api/lists?userId=${dbUser.id}`)
      if (response.ok) {
        const lists = await response.json()
        setUserLists(lists || [])
      }
    } catch (err) {
      console.error("Error fetching user lists:", err)
    } finally {
      setIsLoadingLists(false)
    }
  }

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places

    const query = searchQuery.toLowerCase()
    return places.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.type?.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query),
    )
  }, [places, searchQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeletons */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border border-black/10 rounded-lg">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchPlaces} variant="outline" className="border-black/20">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add place button with helpful guidance */}
      {!isLoadingLists && userLists.length === 0 ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium mb-1">Create a list first!</p>
            <p className="text-xs text-amber-700">You need at least one list to organize your places.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onCreateList} 
              className="bg-black text-white hover:bg-black/80"
              disabled={!onCreateList}
            >
              <Plus size={16} className="mr-2" />
              Create List
            </Button>
            <Button 
              onClick={onAddPlace} 
              variant="outline" 
              className="border-black/20"
              disabled
            >
              <Plus size={16} className="mr-2" />
              Add Place
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={onAddPlace} className="w-full bg-black text-white hover:bg-black/80">
          <Plus size={16} className="mr-2" />
          Add Place
        </Button>
      )}

      {/* Results summary */}
      <div className="text-sm text-black/60">
        {searchQuery ? <span>{filteredPlaces.length} places found</span> : <span>{places.length} total places</span>}
      </div>

      {/* Places list */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? <p>No places found matching "{searchQuery}"</p> : <p>No places yet. Add the first one!</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="p-3 border border-black/10 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onPlaceClick(place)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-medium text-sm mb-1 truncate">{place.name}</h3>
                  <p className="text-xs text-black/60 mb-1 truncate">{place.address}</p>
                  <div className="flex items-center text-xs text-black/50 mt-2">
                    <span>
                      In {place.list_count?.[0]?.count || 0} list{(place.list_count?.[0]?.count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <MapPin size={16} className="text-black/40" />
                  {place.website_url && <ExternalLink size={12} className="text-black/40" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
