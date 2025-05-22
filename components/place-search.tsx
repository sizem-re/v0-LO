"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "use-debounce"

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
  source?: string
}

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  placeholder?: string
  className?: string
}

export function PlaceSearch({
  onPlaceSelect,
  placeholder = "Search for a place...",
  className = "",
}: PlaceSearchProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 500)
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [apiSource, setApiSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Search for places when the debounced query changes
  useEffect(() => {
    const searchPlaces = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setPlaces([])
        setApiSource(null)
        return
      }

      setIsLoading(true)
      setError(null)
      setIsOpen(true)

      try {
        const response = await fetch(`/api/places/autocomplete?query=${encodeURIComponent(debouncedQuery)}`)

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }

        const data = await response.json()
        console.log("Place search response:", data)

        if (data.places) {
          setPlaces(data.places)
          setApiSource(data.source || null)
        } else {
          setPlaces([])
          setApiSource(null)
        }
      } catch (err) {
        console.error("Error searching for places:", err)
        setError(err instanceof Error ? err.message : "Failed to search for places")
        setPlaces([])
        setApiSource(null)
      } finally {
        setIsLoading(false)
      }
    }

    searchPlaces()
  }, [debouncedQuery])

  // Handle place selection
  const handlePlaceSelect = (place: Place) => {
    onPlaceSelect(place)
    setQuery("")
    setPlaces([])
    setIsOpen(false)
  }

  // Handle input focus
  const handleFocus = () => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      setIsOpen(true)
    }
  }

  // Get source badge color
  const getSourceBadgeVariant = (source: string | null) => {
    if (!source) return "outline"
    if (source.includes("google")) return "default"
    return "outline"
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          {apiSource && (
            <div className="flex justify-end px-3 pt-2">
              <Badge variant={getSourceBadgeVariant(apiSource)}>Source: {apiSource}</Badge>
            </div>
          )}

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : places.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-2">
              {places.map((place, index) => (
                <li
                  key={place.id || index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-start gap-2"
                  onClick={() => handlePlaceSelect(place)}
                >
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <div>
                    <div className="font-medium">{place.name}</div>
                    <div className="text-sm text-gray-500 truncate">{place.address}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No places found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
