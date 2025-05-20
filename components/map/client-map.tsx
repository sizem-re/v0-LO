"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"

// Types for props that will be passed to the dynamic component
interface MapProps {
  places: Place[]
  height?: string | number
  onPlaceSelect?: (place: Place) => void
}

// This is a client-side only component that will load the actual map
export default function ClientMap({ places, height = "500px", onPlaceSelect }: MapProps) {
  // State to track if we're in the browser
  const [isMounted, setIsMounted] = useState(false)

  // Dynamically import the map component with no SSR
  const MapComponent = dynamic(() => import("./map-component"), {
    ssr: false,
    loading: () => (
      <div style={{ height }} className="border border-black/10 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  })

  // Only render on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render anything during SSR
  if (typeof window === "undefined") {
    return (
      <div style={{ height }} className="border border-black/10 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  if (!isMounted) {
    return (
      <div style={{ height }} className="border border-black/10 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return <MapComponent places={places} height={height} onPlaceSelect={onPlaceSelect} />
}
