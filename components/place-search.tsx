"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search,
  Link,
  Loader2,
  MapPin,
  Building,
  Navigation,
  Coffee,
  Home,
  Map,
  Store,
  Utensils,
  Landmark,
  Hotel,
  School,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { debounce } from "lodash"

interface Place {
  id: string
  name: string
  address: string
  type: string
  lat: number
  lng: number
  url?: string
}

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  placeholder?: string
  className?: string
}

export function PlaceSearch({
  onPlaceSelect,
  placeholder = "Search for a place or paste a URL",
  className,
}: PlaceSearchProps) {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inputType, setInputType] = useState<"text" | "url">("text")
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect if input is a URL
  const detectInputType = (value: string): "text" | "url" => {
    return value.trim().match(/^https?:\/\//i) ? "url" : "text"
  }

  // Get icon for place type
  const getPlaceTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase()

    if (lowerType.includes("restaurant") || lowerType.includes("food")) {
      return <Utensils className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("cafe") || lowerType.includes("coffee")) {
      return <Coffee className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("store") || lowerType.includes("shop") || lowerType.includes("market")) {
      return <Store className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("museum") || lowerType.includes("gallery") || lowerType.includes("attraction")) {
      return <Landmark className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("park") || lowerType.includes("garden") || lowerType.includes("outdoor")) {
      return <Map className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("hotel") || lowerType.includes("lodging")) {
      return <Hotel className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("school") || lowerType.includes("university") || lowerType.includes("college")) {
      return <School className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("building") || lowerType.includes("office")) {
      return <Building className="h-4 w-4 text-gray-500" />
    } else if (lowerType.includes("home") || lowerType.includes("residence") || lowerType.includes("apartment")) {
      return <Home className="h-4 w-4 text-gray-500" />
    } else {
      return <Navigation className="h-4 w-4 text-gray-500" />
    }
  }

  // Search for places using the autocomplete API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/places/autocomplete?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to search places")
      }

      const data = await response.json()
      setSuggestions(data)
    } catch (err) {
      console.error("Error searching places:", err)
      setError(err instanceof Error ? err.message : "Failed to search places")
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Extract place from URL
  const extractPlaceFromUrl = useCallback(async (url: string) => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/places/extract-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to extract place from URL")
      }

      const data = await response.json()
      setSuggestions(data.length ? [data[0]] : [])
    } catch (err) {
      console.error("Error extracting place from URL:", err)
      setError(err instanceof Error ? err.message : "Failed to extract place from URL")
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string, type: "text" | "url") => {
      if (type === "text") {
        searchPlaces(query)
      } else {
        extractPlaceFromUrl(query)
      }
    }, 500),
  ).current

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    const type = detectInputType(value)
    setInputType(type)

    if (value.trim()) {
      setIsLoading(true)
      setIsDropdownOpen(true)
      debouncedSearch(value, type)
    } else {
      setSuggestions([])
      setIsDropdownOpen(false)
      setIsLoading(false)
      setError(null)
    }
  }

  // Handle place selection
  const handlePlaceSelect = (place: Place) => {
    onPlaceSelect(place)
    setInputValue("")
    setSuggestions([])
    setIsDropdownOpen(false)
    setError(null)
  }

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.trim() && setIsDropdownOpen(true)}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : inputType === "url" ? (
            <Link className="h-5 w-5 text-gray-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              {inputType === "url" ? "Extracting place info..." : "Searching places..."}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">Try a different search or URL</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {inputType === "url" ? "Couldn't extract place from this URL" : "No places found"}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {suggestions.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="w-full text-left p-3 hover:bg-gray-50 flex items-start"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-gray-500 truncate">{place.address}</div>
                    </div>
                    <div className="ml-2 flex items-center">
                      {getPlaceTypeIcon(place.type)}
                      <span className="text-xs text-gray-500 ml-1">{place.type}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
