"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Marker, Popup } from "react-leaflet"
import { MapBase } from "./map-base"
import type { Place } from "@/types/place"
import Link from "next/link"

interface PlacesMapProps {
  places: Place[]
  height?: string | number
  className?: string
  style?: React.CSSProperties
  onPlaceSelect?: (place: Place) => void
  selectedPlaceId?: string
  interactive?: boolean
}

export function PlacesMap({
  places,
  height = "500px",
  className = "",
  style = {},
  onPlaceSelect,
  selectedPlaceId,
  interactive = true,
}: PlacesMapProps) {
  const [activePlace, setActivePlace] = useState<Place | null>(null)

  // Calculate the center and zoom based on the places
  const { center, zoom } = useMemo(() => {
    if (places.length === 0) {
      return { center: [40.7128, -74.006] as [number, number], zoom: 13 }
    }

    if (places.length === 1) {
      return {
        center: [places[0].coordinates.lat, places[0].coordinates.lng] as [number, number],
        zoom: 15,
      }
    }

    // Calculate bounds
    const lats = places.map((place) => place.coordinates.lat)
    const lngs = places.map((place) => place.coordinates.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)

    let zoom = 13
    if (maxDiff > 0.2) zoom = 10
    if (maxDiff > 1) zoom = 8
    if (maxDiff > 5) zoom = 6

    return { center: [centerLat, centerLng] as [number, number], zoom }
  }, [places])

  const handleMarkerClick = (place: Place) => {
    setActivePlace(place)
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
  }

  return (
    <MapBase
      center={center}
      zoom={zoom}
      height={height}
      className={`border border-black/10 ${className}`}
      style={style}
      scrollWheelZoom={interactive}
      dragging={interactive}
    >
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.coordinates.lat, place.coordinates.lng]}
          eventHandlers={{
            click: () => handleMarkerClick(place),
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-base">{place.name}</h3>
              <p className="text-xs text-black/70">{place.type}</p>
              {place.address && <p className="text-xs mt-1">{place.address}</p>}
              {interactive && (
                <Link href={`/places/${place.id}`} className="text-xs underline block mt-2">
                  View details
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapBase>
  )
}

// Default export for dynamic imports
export default { PlacesMap }
