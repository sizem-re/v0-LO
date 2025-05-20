"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import type { Place } from "@/types/place"
import { FarcasterReady } from "@/components/farcaster-ready"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export default function HomePage() {
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
    return null
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Keep FarcasterReady component to ensure miniapp functionality */}
      <FarcasterReady />

      {/* Map container with lower z-index */}
      <div className="w-full h-full relative z-0">
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
      </div>

      {/* Sidebar with higher z-index */}
      <div className="absolute top-0 left-0 h-full z-50">
        <SidebarWrapper />
      </div>
    </div>
  )
}
