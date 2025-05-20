"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Place } from "@/types/place"

interface MapPreviewProps {
  places?: Place[]
  center: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{ lat: number; lng: number; title?: string }>
  height?: string | number
  width?: string | number
  className?: string
}

export function MapPreview({
  places,
  center,
  zoom = 13,
  markers = [],
  height = "100%",
  width = "100%",
  className = "",
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([center.lat, center.lng], zoom)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)
    } else {
      // Update view if map already exists
      mapInstanceRef.current.setView([center.lat, center.lng], zoom)
    }

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    // Add markers
    markers.forEach((marker) => {
      L.marker([marker.lat, marker.lng])
        .addTo(mapInstanceRef.current!)
        .bindPopup(marker.title || "")
    })

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, markers])

  if (places && places.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ height, width }}>
        <p className="text-gray-500 text-sm">No places to display</p>
      </div>
    )
  }

  return <div ref={mapRef} style={{ height, width }} className={`border border-black/10 ${className}`} />
}
