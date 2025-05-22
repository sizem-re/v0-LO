"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet"
import type { Place } from "@/types/place"
import { useMapSize } from "@/hooks/use-map-size"

// Fix for Leaflet marker icons
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/marker-icon-2x.png",
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
  })
}

// Default coordinates (Tacoma, WA)
const DEFAULT_COORDINATES: [number, number] = [47.2529, -122.4443]

interface MapComponentProps {
  places: Place[]
  onPlaceSelect?: (place: Place) => void
  onMapClick?: (lat: number, lng: number) => void
  center?: [number, number]
  zoom?: number
}

function MapController({
  places,
  onPlaceSelect,
}: {
  places: Place[]
  onPlaceSelect?: (place: Place) => void
}) {
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

export default function MapComponent({
  places,
  onPlaceSelect,
  onMapClick,
  center = DEFAULT_COORDINATES,
  zoom = 13,
}: MapComponentProps) {
  const { height, width } = useMapSize()
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  }

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
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      ref={mapRef}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

      {validPlaces.map((place) => (
        <Marker
          key={place.id}
          position={[
            place.coordinates?.lat || place.latitude || DEFAULT_COORDINATES[0],
            place.coordinates?.lng || place.longitude || DEFAULT_COORDINATES[1],
          ]}
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
              {place.description && <p className="text-sm mt-1">{place.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      <MapController places={validPlaces} onPlaceSelect={onPlaceSelect} />

      {onMapClick && (
        <div
          onClick={handleMapClick}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 400,
            pointerEvents: "auto",
          }}
        />
      )}
    </MapContainer>
  )
}
