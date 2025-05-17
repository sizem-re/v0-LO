"use client"

import type React from "react"

import { useState } from "react"
import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"

// Dynamically import the map component with no SSR
const VanillaLocationPicker = dynamic(() => import("@/components/map/vanilla-location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

interface LocationPickerModalProps {
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
  initialAddress?: string
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void
}

export function LocationPickerModal({
  onClose,
  initialLocation,
  initialAddress,
  onLocationSelect,
}: LocationPickerModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null)
  const [address, setAddress] = useState(initialAddress || "")
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  // Function to geocode an address to coordinates
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setSearchError("Please enter an address to search")
      return
    }

    setIsSearching(true)
    setSearchError("")

    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setLocation({ lat: Number.parseFloat(lat), lng: Number.parseFloat(lon) })
      } else {
        setSearchError("No location found for this address")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setSearchError("Error searching for location")
    } finally {
      setIsSearching(false)
    }
  }

  // Handle location change from the map
  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation)
    // Optionally, you could do reverse geocoding here to get the address from coordinates
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (location) {
      onLocationSelect({ ...location, address })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="bg-white w-full max-w-lg border border-black/10 shadow-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">Set Location</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-black/10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              geocodeAddress(address)
            }}
            className="flex gap-2"
          >
            <div className="flex-1">
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Search for an address"
                className="border-black/20"
              />
              {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
            </div>
            <Button type="submit" className="bg-black text-white hover:bg-black/80" disabled={isSearching}>
              {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <div className="flex-grow overflow-hidden p-4">
          <div className="h-[300px] w-full">
            <VanillaLocationPicker
              initialLocation={location || undefined}
              onLocationChange={handleLocationChange}
              height="100%"
            />
          </div>

          {location && (
            <div className="mt-4 text-sm">
              <p className="font-medium">Selected coordinates:</p>
              <p className="text-black/70">
                Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/10 flex gap-3">
          <Button
            type="button"
            className="bg-transparent text-black border border-black/20 hover:bg-black/5"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-black text-white hover:bg-black/80"
            onClick={handleSubmit}
            disabled={!location}
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  )
}
