"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
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

export default function MapClientWrapper() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/places")

        if (!response.ok) {
          throw new Error("Failed to fetch places")
        }

        const data = await response.json()
        setPlaces(data)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
    setIsMounted(true)
  }, [])

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <>
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map...</p>
        </div>
      ) : error ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : (
        <VanillaMap places={places} height="100%" />
      )}
    </>
  )
}
