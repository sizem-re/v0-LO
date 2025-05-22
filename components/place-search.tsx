"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search,
  LinkIcon,
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
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import debounce from "lodash/debounce"

interface PlaceCoordinates {
  lat: number
  lng: number
}

interface Place {
  id: string
  name: string
  address: string
  coordinates: PlaceCoordinates
  type: string
  url?: string
  description?: string
  image?: string
  website?: string
}

interface AutocompleteResponse {
  places: Place[]
  error?: string
}

interface ExtractUrlResponse {
  place?: Place
  partialPlace?: {
    name: string
    address?: string
    coordinates?: PlaceCoordinates
    url?: string
  }
  error?: string
  details?: string
  debug?: any
  message?: string
  fallbackOption?: string
}

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  placeholder?: string
  className?: string
  initialValue?: string
}

export function PlaceSearch({
  onPlaceSelect,
  placeholder = "Search for a place or paste a URL",
  className,
  initialValue = "",
}: PlaceSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inputType, setInputType] = useState<"text" | "url">("text")
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const detectInputType = (value: string): "text" | "url" => {
    const urlRegex =
      /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i
    return urlRegex.test(value.trim()) ? "url" : "text"
  }

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

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log("Searching for places:", query)
      const response = await fetch(`/api/places/autocomplete?query=${encodeURIComponent(query)}`, {
        signal,
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search places")
      }

      const data: AutocompleteResponse = await response.json()
      console.log("Search response:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      setSuggestions(data.places || [])
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error searching places:", err)
        setError(err.message || "Failed to search places")
        setSuggestions([])
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const extractPlaceFromUrl = useCallback(async (url: string) => {
    if (!url.trim()) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`
      }

      console.log("Extracting place from URL:", url)
      const response = await fetch("/api/places/extract-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal,
      })

      const data: ExtractUrlResponse = await response.json()
      console.log("URL extraction response:", data)

      if (!response.ok) {
        if (data.debug) {
          setDebugInfo(data.debug)
        }
        throw new Error(data.error || "Failed to extract place from URL")
      }

      if (data.error) {
        if (data.debug) {
          setDebugInfo(data.debug)
        }
        throw new Error(data.error)
      }

      if (data.place) {
        setSuggestions([data.place])
      } else if (data.partialPlace) {
        // Create a place object from partial data
        const partialPlace = data.partialPlace
        const place: Place = {
          id: `partial-${Date.now()}`,
          name: partialPlace.name,
          address: partialPlace.address || "Address not available",
          coordinates: partialPlace.coordinates || { lat: 0, lng: 0 },
          type: "place",
          url: partialPlace.url,
        }
        setSuggestions([place])
      } else {
        setSuggestions([])
        setError("No place information found in this URL")
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error extracting place from URL:", err)
        setError(err.message || "Failed to extract place from URL")
        setSuggestions([])
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const debouncedSearch = useRef(
    debounce((query: string, type: "text" | "url") => {
      if (type === "text") {
        searchPlaces(query)
      } else {
        extractPlaceFromUrl(query)
      }
    }, 300),
  ).current

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
      setDebugInfo(null)
    }
  }

  const handlePlaceSelect = (place: Place) => {
    onPlaceSelect(place)
    setInputValue("")
    setSuggestions([])
    setIsDropdownOpen(false)
    setError(null)
    setDebugInfo(null)
  }

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

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (initialValue) {
      setInputType(detectInputType(initialValue))
    }
  }, [initialValue])

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
          className={cn("pr-10", error ? "border-red-300 focus-visible:ring-red-200" : "")}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "place-search-error" : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : inputType === "url" ? (
            <LinkIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {error && (
        <div id="place-search-error" className="mt-1 text-xs text-red-500">
          {error}
          {debugInfo && (
            <details className="mt-1 text-xs text-gray-500">
              <summary>Debug Info</summary>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

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
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {inputType === "url" ? "Couldn't extract place from this URL" : "No places found"}
              <p className="text-xs mt-1">Try a different {inputType === "url" ? "URL" : "search term"}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100" role="listbox">
              {suggestions.map((place) => (
                <li key={place.id} role="option">
                  <button
                    type="button"
                    className="w-full text-left p-3 hover:bg-gray-50 flex items-start transition-colors"
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
