"use client"

import { useState, useEffect } from "react"
import { MapBase } from "./map-base"
import { Marker, useMapEvents } from "react-leaflet"

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationChange: (location: { lat: number; lng: number }) => void
  height?: string | number
  className?: string
}

export function LocationPicker({
  initialLocation,
  onLocationChange,
  height = "400px",
  className = "",
}: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialLocation || null)

  // Default center if no initial location
  const center = initialLocation
    ? ([initialLocation.lat, initialLocation.lng] as [number, number])
    : ([40.7128, -74.006] as [number, number])

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng }
        setPosition(newPosition)
        onLocationChange(newPosition)
      },
    })

    useEffect(() => {
      // Try to get user's location if no initial position
      if (!position && !initialLocation) {
        map.locate().on("locationfound", (e) => {
          const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng }
          setPosition(newPosition)
          onLocationChange(newPosition)
          map.flyTo(e.latlng, 15)
        })
      }
    }, [map])

    return position ? <Marker position={[position.lat, position.lng]} /> : null
  }

  return (
    <MapBase
      center={center}
      zoom={initialLocation ? 15 : 13}
      height={height}
      className={`border border-black/10 ${className}`}
    >
      <LocationMarker />
    </MapBase>
  )
}
