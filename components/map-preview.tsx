"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"

interface MapPreviewProps {
  lat: number
  lng: number
  zoom?: number
  className?: string
}

export function MapPreview({ lat, lng, zoom = 13, className = "" }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], zoom)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)
    } else {
      // Update view if map already exists
      mapInstanceRef.current.setView([lat, lng], zoom)
    }

    // Add marker
    const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current)

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        marker.remove()
      }
    }
  }, [lat, lng, zoom])

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <Card className={`brutalist-card h-[300px] w-full overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </Card>
  )
}
