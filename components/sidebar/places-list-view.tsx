"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useNeynarContext } from "@neynar/react"

interface Place {
  id: string
  name: string
  address: string
  type: string
  lat: string
  lng: string
  description?: string
  website_url?: string
  created_at: string
}

interface PlacesListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onPlaceClick: (place: Place) => void
  onAddPlace?: () => void
}

export function PlacesListView({ searchQuery, onSearchChange, onPlaceClick, onAddPlace }: PlacesListViewProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isAuthenticated } = useAuth()
  const { isAuthenticated: neynarAuthenticated } = useNeynarContext()
  const userIsAuthenticated = isAuthenticated || neynarAuthenticated

  // Fetch places from the API
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/places?limit=100")
        if (!response.ok) {
          throw new Error(`Failed to fetch places: ${response.status}`)
        }

        const data = await response.json()
        setPlaces(data || [])
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch places")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [])

  // Filter places based on search query
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) {
      return places
    }

    const query = searchQuery.toLowerCase()
    return places.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.type.toLowerCase().includes(query) ||
        (place.description && place.description.toLowerCase().includes(query)),
    )
  }, [places, searchQuery])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
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
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-black/10 rounded-md p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
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
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
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

      {/* Add Place Button */}
      {userIsAuthenticated && onAddPlace && (
        <Button onClick={onAddPlace} className="w-full bg-black text-white hover:bg-black/80 border border-black">
          <Plus size={16} className="mr-2" />
          Add New Place
        </Button>
      )}

      {/* Results Summary */}
      <div className="text-sm text-black/60">
        {searchQuery ? (
          <span>
            {filteredPlaces.length} result{filteredPlaces.length !== 1 ? "s" : ""} for "{searchQuery}"
          </span>
        ) : (
          <span>{places.length} places total</span>
        )}
      </div>

      {/* Places List */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? (
            <div>
              <p className="mb-4">No places found for "{searchQuery}"</p>
              <Button
                variant="outline"
                onClick={() => onSearchChange("")}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-4">No places have been added yet.</p>
              {userIsAuthenticated && onAddPlace && (
                <Button onClick={onAddPlace} className="bg-black text-white hover:bg-black/80">
                  <Plus size={16} className="mr-2" />
                  Add the First Place
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="border border-black/10 rounded-md p-3 cursor-pointer hover:border-black/30 hover:bg-gray-50 transition-colors"
              onClick={() => onPlaceClick(place)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm line-clamp-1">{place.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-black/70 ml-2 flex-shrink-0">
                  {place.type}
                </span>
              </div>

              {place.address && (
                <div className="flex items-center text-xs text-black/60 mb-1">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{place.address}</span>
                </div>
              )}

              {place.description && <p className="text-xs text-black/70 mb-2 line-clamp-2">{place.description}</p>}

              <div className="flex items-center justify-between text-xs text-black/50">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Added {formatDate(place.created_at)}</span>
                </div>
                {place.website_url && (
                  <span className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    Website
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
