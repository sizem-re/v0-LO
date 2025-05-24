"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, Plus, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

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
}

interface PlacesListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onPlaceClick: (place: Place) => void
  onAddPlace: () => void
  refreshTrigger?: number
}

export function PlacesListView({ searchQuery, onSearchChange, onPlaceClick, onAddPlace, refreshTrigger }: PlacesListViewProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlaces()
  }, [])

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchPlaces()
    }
  }, [refreshTrigger])

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/places")
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Input
            type="text"
            className="w-full border border-black/20 pl-9 pr-4 py-2 text-sm"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search size={16} className="absolute left-3 top-2.5 text-black/40" />
        </div>

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
      {/* Search bar */}
      <div className="relative">
        <Input
          type="text"
          className="w-full border border-black/20 pl-9 pr-4 py-2 text-sm"
          placeholder="Search places..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search size={16} className="absolute left-3 top-2.5 text-black/40" />
      </div>

      {/* Add place button */}
      <Button onClick={onAddPlace} className="w-full bg-black text-white hover:bg-black/80">
        <Plus size={16} className="mr-2" />
        Add Place
      </Button>

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
                  {place.type && (
                    <span className="inline-block px-2 py-1 bg-black/5 text-xs rounded text-black/70 mb-1">
                      {place.type}
                    </span>
                  )}
                  <div className="flex items-center text-xs text-black/50 mt-2">
                    <Clock size={12} className="mr-1" />
                    <span>{formatTimeAgo(place.created_at)}</span>
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
