"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import type { Place } from "@/types/place"

// Default coordinates (Tacoma, WA)
const DEFAULT_COORDINATES: [number, number] = [47.2529, -122.4443]

// Fix for Leaflet marker icons
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/marker-icon-2x.png",
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
  })
}

interface VanillaMapProps {
  places: Place[]
  height?: string
  width?: string
  className?: string
}

function MapController({ places }: { places: Place[] }) {
  const map = useMap()

  useEffect(() => {
    if (places.length > 0) {
      try {
        // Create bounds from all places with valid coordinates
        const validPlaces = places.filter(
          (place) =>
            (place.coordinates?.lat !== undefined && place.coordinates?.lng !== undefined) ||
            (place.latitude !== undefined && place.longitude !== undefined),
        )

        if (validPlaces.length > 0) {
          const bounds = L.latLngBounds(
            validPlaces.map((place) => [
              place.coordinates?.lat || place.latitude || DEFAULT_COORDINATES[0],
              place.coordinates?.lng || place.longitude || DEFAULT_COORDINATES[1],
            ]),
          )

          // Fit map to bounds with padding
          map.fitBounds(bounds, { padding: [50, 50] })
        } else {
          // If no valid places, center on default
          map.setView(DEFAULT_COORDINATES, 13)
        }
      } catch (error) {
        console.error("Error fitting bounds:", error)
        // Fallback to default view
        map.setView(DEFAULT_COORDINATES, 13)
      }
    }
  }, [map, places])

  return null
}

export default function VanillaMap({ places, height = "400px", width = "100%", className = "" }: VanillaMapProps) {
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  // Ensure all places have valid coordinates
  const validPlaces = places.map((place) => {
    // If coordinates are missing or invalid, use default coordinates
    if (!place.coordinates?.lat || !place.coordinates?.lng) {
      return {
        ...place,
        coordinates: {
          lat: place.latitude || DEFAULT_COORDINATES[0],
          lng: place.longitude || DEFAULT_COORDINATES[1],
        },
      }
    }
    return place
  })

  return (
    <div style={{ height, width }} className={className}>
      <MapContainer center={DEFAULT_COORDINATES} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[
              place.coordinates?.lat || place.latitude || DEFAULT_COORDINATES[0],
              place.coordinates?.lng || place.longitude || DEFAULT_COORDINATES[1],
            ]}
          >
            <Popup>
              <div>
                <h3 className="font-medium">{place.name}</h3>
                {place.address && <p className="text-sm">{place.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController places={validPlaces} />
      </MapContainer>
    </div>
  )
}
