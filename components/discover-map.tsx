"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"
import { fetchPlaces } from "@/lib/place-utils"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export function DiscoverMap() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const placesData = await fetchPlaces({ limit: 20 })
        console.log(`Loaded ${placesData.length} places for discover map`)
        setPlaces(placesData)
      } catch (err) {
        console.error("Error fetching places for discover map:", err)
        setError(err instanceof Error ? err.message : "Failed to load places")
      } finally {
        setIsLoading(false)
      }
    }

    loadPlaces()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[600px] border border-black/10 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[600px] border border-black/10 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading places</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <VanillaMap places={places} height="600px" />
}
