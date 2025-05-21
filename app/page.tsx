"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import { FarcasterReady } from "@/components/farcaster-ready"
import type { Place } from "@/types/place"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

// Mock data for places in case API fails
const MOCK_PLACES: Place[] = [
  {
    id: "p1",
    name: "The Fish House Cafe",
    type: "Restaurant",
    address: "1814 Martin Luther King Jr Way, Tacoma, WA 98405",
    coordinates: { lat: 47.2529, lng: -122.4443 },
    description: "No-frills spot for fried seafood & soul food sides in a tiny, counter-serve setting.",
  },
]

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Fetch places from API
    const fetchPlaces = async () => {
      try {
        const response = await fetch("/api/places")
        if (response.ok) {
          const data = await response.json()
          setPlaces(data.length > 0 ? data : MOCK_PLACES)
        } else {
          console.error("Error fetching places:", response.statusText)
          setPlaces(MOCK_PLACES)
          setError("Failed to fetch places")
        }
      } catch (error) {
        console.error("Error fetching places:", error)
        setPlaces(MOCK_PLACES)
        setError("Failed to fetch places")
      } finally {
        setIsLoading(false)
        setIsMounted(true)
      }
    }

    fetchPlaces()
  }, [])

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) {
    return null
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Keep FarcasterReady component to ensure miniapp functionality */}
      <FarcasterReady />

      {/* Map container with lower z-index */}
      <div className="w-full h-full relative z-0">
        <VanillaMap places={places} height="100%" />
      </div>

      {/* Sidebar with higher z-index */}
      <div className="absolute top-0 left-0 h-full z-50">
        <SidebarWrapper />
      </div>

      {/* Error message if needed */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
