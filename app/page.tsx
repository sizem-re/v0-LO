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

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch places from API
    const fetchPlaces = async () => {
      try {
        const response = await fetch("/api/places")
        if (response.ok) {
          const data = await response.json()
          setPlaces(data)
        }
      } catch (error) {
        console.error("Error fetching places:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [])

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
    </div>
  )
}
