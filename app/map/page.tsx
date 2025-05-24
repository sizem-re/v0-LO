"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"
import { Sidebar } from "@/components/sidebar/sidebar"
import { SearchDialog } from "@/components/search-dialog"
import { useRouter } from "next/navigation"
import { fetchPlaces } from "@/lib/place-utils"

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import("@/components/map/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const placesData = await fetchPlaces()
        console.log(`Loaded ${placesData.length} places from database`)
        setPlaces(placesData)
        setFilteredPlaces(placesData)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "Failed to load places")
      } finally {
        setIsLoading(false)
      }
    }

    loadPlaces()
  }, [])

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
  }

  useEffect(() => {
    if (!isLoading && places.length === 0 && !error) {
      router.replace("/")
    }
  }, [places, isLoading, error, router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading places</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-row overflow-hidden">
      {/* Sidebar - absolutely positioned to prevent layout issues */}
      <div className="relative z-10" style={{ maxWidth: "320px" }}>
        <Sidebar />
      </div>

      {/* Map container - takes remaining space */}
      <div className="flex-1 relative z-0">
        <MapComponent places={filteredPlaces} onPlaceSelect={handlePlaceSelect} />
      </div>

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
