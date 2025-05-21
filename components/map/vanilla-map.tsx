"use client"

import { useEffect, useState } from "react"
import { MapBase } from "./map-base"
import { Marker, Popup } from "react-leaflet"
import type { Place } from "@/types/place"

interface VanillaMapProps {
  places: Place[]
  height?: string | number
  onPlaceSelect?: (place: Place) => void
}

export default function VanillaMap({ places = [], height = "100%", onPlaceSelect }: VanillaMapProps) {
  const [center, setCenter] = useState<[number, number]>([47.6062, -122.3321]) // Default to Seattle
  const [zoom, setZoom] = useState(13)

  // If places are provided, center the map on the first place
  useEffect(() => {
    if (places.length > 0 && places[0].coordinates) {
      setCenter([places[0].coordinates.lat, places[0].coordinates.lng])
    }
  }, [places])

  return (
    <MapBase center={center} zoom={zoom} height={height}>
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.coordinates.lat, place.coordinates.lng]}
          eventHandlers={{
            click: () => {
              if (onPlaceSelect) {
                onPlaceSelect(place)
              }
            },
          }}
        >
          <Popup>
            <div>
              <h3 className="font-medium">{place.name}</h3>
              {place.address && <p className="text-sm">{place.address}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapBase>
  )
}
