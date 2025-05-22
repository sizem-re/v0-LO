"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, ArrowLeft } from "lucide-react"
import type { Place } from "@/types/place"
import dynamic from "next/dynamic"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] border border-black/10 flex items-center justify-center bg-gray-100">
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

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const [place, setPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // First try to fetch from API
    const fetchPlace = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/places/${params.id}`)

        if (response.ok) {
          const data = await response.json()
          if (data && data.place) {
            // Ensure coordinates are properly formatted
            const placeWithValidCoords = {
              ...data.place,
              coordinates: data.place.coordinates || { lat: 47.6062, lng: -122.3321 },
            }
            setPlace(placeWithValidCoords)
            return
          }
        }

        // If API fails, try mock data
        const foundPlace = MOCK_PLACES.find((p) => p.id === params.id)
        if (foundPlace) {
          setPlace(foundPlace)
        } else {
          setError("Place not found")
        }
      } catch (err) {
        console.error("Error fetching place:", err)
        // Try mock data as fallback
        const foundPlace = MOCK_PLACES.find((p) => p.id === params.id)
        if (foundPlace) {
          setPlace(foundPlace)
        } else {
          setError("Error loading place")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPlace()
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Link href="/map" className="flex items-center text-sm hover:underline mb-8">
          <ArrowLeft size={16} className="mr-1" />
          Back to Map
        </Link>
        <div className="text-center py-12">
          <p>Loading place details...</p>
        </div>
      </div>
    )
  }

  if (error || !place) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Link href="/map" className="flex items-center text-sm hover:underline mb-8">
          <ArrowLeft size={16} className="mr-1" />
          Back to Map
        </Link>
        <div className="text-center py-12">
          <p>{error || "Place not found"}</p>
        </div>
      </div>
    )
  }

  // Ensure we have valid coordinates
  const safePlace = {
    ...place,
    coordinates: place.coordinates || { lat: 47.6062, lng: -122.3321 },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/map" className="flex items-center text-sm hover:underline mb-8">
        <ArrowLeft size={16} className="mr-1" />
        Back to Map
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">{safePlace.name}</h1>
          {safePlace.type && <p className="inline-block bg-gray-100 px-2 py-1 text-sm mb-4">{safePlace.type}</p>}

          {safePlace.address && (
            <div className="flex items-start mb-4">
              <MapPin size={18} className="mr-2 mt-1 flex-shrink-0" />
              <p>{safePlace.address}</p>
            </div>
          )}

          {safePlace.description && (
            <div className="mb-6">
              <h2 className="text-xl font-serif mb-2">About</h2>
              <p>{safePlace.description}</p>
            </div>
          )}

          {safePlace.website && (
            <div className="mb-6">
              <h2 className="text-xl font-serif mb-2">Website</h2>
              <a
                href={safePlace.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {safePlace.website}
              </a>
            </div>
          )}
        </div>

        <div>
          {safePlace.image && (
            <div
              className="w-full h-64 bg-gray-100 mb-6"
              style={{
                backgroundImage: `url(${safePlace.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          <h2 className="text-xl font-serif mb-2">Location</h2>
          <VanillaMap places={[safePlace]} height="300px" />
        </div>
      </div>
    </div>
  )
}
