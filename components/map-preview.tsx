"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This is a placeholder for the actual map implementation
    // We're using a placeholder image instead of Leaflet to avoid issues
    if (mapRef.current) {
      const mapElement = mapRef.current
      mapElement.style.backgroundImage = "url('/placeholder.svg?height=300&width=500')"
      mapElement.style.backgroundSize = "cover"
      mapElement.style.backgroundPosition = "center"
    }
  }, [])

  return (
    <Card className="brutalist-card h-[300px] w-full overflow-hidden">
      <div ref={mapRef} className="w-full h-full flex items-center justify-center text-gray-500">
        Map will be displayed here
      </div>
    </Card>
  )
}
