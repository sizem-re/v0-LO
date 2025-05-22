"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Link, Loader2, MapPin, Building, Navigation, Coffee, Home, Map } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Mock data for place suggestions
const MOCK_SUGGESTIONS = [
  {
    id: "1",
    name: "Cozy Corner Cafe",
    address: "123 Main St, Portland, OR 97201",
    type: "cafe",
    lat: 45.523064,
    lng: -122.676483,
  },
  {
    id: "2",
    name: "Portland Art Museum",
    address: "1219 SW Park Ave, Portland, OR 97205",
    type: "museum",
    lat: 45.516247,
    lng: -122.683285,
  },
  {
    id: "3",
    name: "Powell's City of Books",
    address: "1005 W Burnside St, Portland, OR 97209",
    type: "bookstore",
    lat: 45.523118,
    lng: -122.681427,
  },
  {
    id: "4",
    name: "Voodoo Doughnut",
    address: "22 SW 3rd Ave, Portland, OR 97204",
    type: "bakery",
    lat: 45.522788,
    lng: -122.673061,
  },
  {
    id: "5",
    name: "Japanese Garden",
    address: "611 SW Kingston Ave, Portland, OR 97205",
    type: "garden",
    lat: 45.518898,
    lng: -122.705957,
  },
]

interface Place {
  id: string
  name: string
  address: string
  type: string
  lat: number
  lng: number
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

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect if input is a URL
  const detectInputType = (value: string): "text" | "url" => {
    // Simple URL detection - checks if input starts with http:// or https://
    return value.trim().match(/^https?:\/\//i) ? "url" : "text"
  }

  // Get icon for place type
  const getPlaceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "cafe":
      case "restaurant":
      case "bakery":
        return <Coffee className="h-4 w-4 text-gray-500" />
      case "museum":
      case "gallery":
      case "library":
      case "bookstore":
        return <Building className="h-4 w-4 text-gray-500" />
      case "park":
      case "garden":
        return <Map className="h-4 w-4 text-gray-500" />
      case "residence":
      case "apartment":
        return <Home className="h-4 w-4 text-gray-500" />
      default:
        return <Navigation className="h-4 w-4 text-gray-500" />
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setInputType(detectInputType(value))

    if (value.trim()) {
      // Show loading state
      setIsLoading(true)
      setIsDropdownOpen(true)

      // Simulate API call with delay
      setTimeout(() => {
        if (detectInputType(value) === "text") {
          // Filter mock suggestions based on input
          const filtered = MOCK_SUGGESTIONS.filter(
            (place) =>
              place.name.toLowerCase().includes(value.toLowerCase()) ||
              place.address.toLowerCase().includes(value.toLowerCase()),
          )
          setSuggestions(filtered)
        } else {
          // For URL, just return the first mock suggestion
          setSuggestions([MOCK_SUGGESTIONS[0]])
        }
        setIsLoading(false)
      }, 800)
    } else {
      setSuggestions([])
      setIsDropdownOpen(false)
      setIsLoading(false)
    }
  }

  // Handle place selection
  const handlePlaceSelect = (place: Place) => {
    onPlaceSelect(place)
    setInputValue("")
    setSuggestions([])
    setIsDropdownOpen(false)
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
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No places found</div>
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
