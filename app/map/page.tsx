"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"
import { Sidebar } from "@/components/sidebar/sidebar"
import { SearchDialog } from "@/components/search-dialog"
import { useRouter } from "next/navigation"

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import("@/components/map/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

// Mock data for places
const MOCK_PLACES: Place[] = [
  {
    id: "p1",
    name: "The Fish House Cafe",
    type: "Restaurant",
    address: "1814 Martin Luther King Jr Way, Tacoma, WA 98405",
    coordinates: { lat: 47.2529, lng: -122.4443 },
    description: "No-frills spot for fried seafood & soul food sides in a tiny, counter-serve setting.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p2",
    name: "Vien Dong",
    type: "Vietnamese Restaurant",
    address: "3801 Yakima Ave, Tacoma, WA 98418",
    coordinates: { lat: 47.2209, lng: -122.4634 },
    description: "Casual Vietnamese spot serving pho, rice plates & other traditional dishes in a simple setting.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p3",
    name: "Burger Seoul",
    type: "Korean Fusion",
    address: "1750 S Prospect St, Tacoma, WA 98405",
    coordinates: { lat: 47.241, lng: -122.4556 },
    description: "Korean-inspired burgers and sides with unique flavors.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p4",
    name: "Central Park",
    type: "Park",
    address: "Central Park, New York, NY",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    description: "An urban park in Manhattan, New York City.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p5",
    name: "Golden Gate Bridge",
    type: "Landmark",
    address: "Golden Gate Bridge, San Francisco, CA",
    coordinates: { lat: 37.8199, lng: -122.4783 },
    description:
      "A suspension bridge spanning the Golden Gate, the one-mile-wide strait connecting San Francisco Bay and the Pacific Ocean.",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // On mobile, start with sidebar closed
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    // In a real app, you would fetch places from an API
    setPlaces(MOCK_PLACES)
    setFilteredPlaces(MOCK_PLACES)
  }, [])

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    if (isMobile) {
      setIsSidebarOpen(true)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    // Handle location selection
    console.log("Selected location:", lat, lng)
  }

  useEffect(() => {
    if (places.length === 0) {
      router.replace("/")
    }
  }, [places, router])

  return (
    <div className="fixed inset-0 flex h-full">
      {/* Sidebar */}
      <div className="h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Map container */}
      <div className="flex-1 relative h-full">
        <MapComponent places={filteredPlaces} onPlaceSelect={handlePlaceSelect} onMapClick={handleLocationSelect} />
      </div>

      {/* Search dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
