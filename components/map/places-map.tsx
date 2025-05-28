"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Marker, Popup } from "react-leaflet"
import { MapBase } from "./map-base"
import type { Place } from "@/types/place"
import Link from "next/link"
import { calculateOptimalMapView } from "@/lib/map-utils"
import { useMapSize } from "@/hooks/use-map-size"

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
  const mapSize = useMapSize()

  // Calculate the center and zoom based on the places using smart calculation
  const { center, zoom } = useMemo(() => {
    if (places.length === 0) {
      return { center: [40.7128, -74.006] as [number, number], zoom: 13 }
    }

    // Use the smart calculation that considers aspect ratio
    const containerWidth = mapSize.width || 800
    const containerHeight = typeof height === 'string' ? 500 : height
    
    return calculateOptimalMapView(places, containerWidth, containerHeight)
  }, [places, mapSize.width, height])

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
