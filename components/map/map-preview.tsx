"use client"

import { MapBase } from "./map-base"
import type { Place } from "@/types/place"
import { Marker } from "react-leaflet"

interface MapPreviewProps {
  places: Place[]
  height?: string | number
  className?: string
}

export function MapPreview({ places, height = "200px", className = "" }: MapPreviewProps) {
  // If no places, show a default location
  if (places.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">No places to display</p>
      </div>
    )
  }

  // Calculate center based on places
  const lats = places.map((place) => place.coordinates.lat)
  const lngs = places.map((place) => place.coordinates.lng)

  const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length
  const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length

  return (
    <MapBase
      center={[centerLat, centerLng]}
      zoom={12}
      height={height}
      className={`border border-black/10 ${className}`}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
    >
      {places.map((place) => (
        <Marker key={place.id} position={[place.coordinates.lat, place.coordinates.lng]} />
      ))}
    </MapBase>
  )
}
