"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, Plus, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDistanceToNow } from "date-fns"

interface PlacesListViewProps {
  onPlaceSelect: (place: any) => void
  onAddPlace?: () => void
}

export function PlacesListView({ onPlaceSelect, onAddPlace }: PlacesListViewProps) {
  const { dbUser } = useAuth()
  const [places, setPlaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch places
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/places?t=${Date.now()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch places: ${response.status}`)
        }

        const data = await response.json()
        setPlaces(data)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "Failed to load places")
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
        place.name?.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query) ||
        place.type?.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query),
    )
  }, [places, searchQuery])

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "Unknown date"
    }
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)

    fetch(`/api/places?t=${Date.now()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch places: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setPlaces(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Error retrying places fetch:", err)
        setError(err instanceof Error ? err.message : "Failed to load places")
        setIsLoading(false)
      })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-black/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col">
                <span>Error loading places: {error}</span>
                <Button variant="outline" size="sm" className="mt-2 self-start" onClick={handleRetry}>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? <p>No places match your search</p> : <p>No places found. Add your first place!</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {searchQuery && (
              <div className="px-4 py-2 text-xs text-gray-500">
                Found {filteredPlaces.length} {filteredPlaces.length === 1 ? "place" : "places"}
              </div>
            )}

            {filteredPlaces.map((place) => (
              <button
                key={place.id}
                className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start"
                onClick={() => onPlaceSelect(place)}
              >
                <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 mr-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{place.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  {place.created_at && (
                    <p className="text-xs text-gray-400 mt-1">Added {formatDate(place.created_at)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {dbUser && (
        <div className="p-4 border-t border-black/10">
          <Button className="w-full bg-black text-white hover:bg-black/80" onClick={onAddPlace}>
            <Plus size={16} className="mr-1" /> Add Place
          </Button>
        </div>
      )}
    </div>
  )
}
