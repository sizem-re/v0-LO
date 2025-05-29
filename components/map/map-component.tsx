"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useMap } from "react-leaflet"
import type { Place } from "@/types/place"
import { calculateSimpleFitBoundsOptions, applyFullScreenView } from "@/lib/map-utils"

// Fix for Leaflet marker icons
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/marker-icon-2x.png",
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
  })
}

interface MapComponentProps {
  places: Place[]
  height?: string | number
  onPlaceSelect?: (place: Place) => void
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
      // Get container dimensions
      const container = map.getContainer()
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      
      // Use full screen view to eliminate grey bars
      applyFullScreenView(map, places, containerWidth, containerHeight)
    }
  }, [map, places])

  return null
}

export default function MapComponent({ places, height = "100%", onPlaceSelect }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return

    // Create map if it doesn't exist
    if (!mapRef.current) {
      const map = L.map("map", {
        center: [40.7128, -74.006], // Default to NYC
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      mapRef.current = map
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when places change
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const currentMarkerIds = Object.keys(markersRef.current)
    const newMarkerIds = places.map((place) => place.id)

    // Remove markers that are no longer in the places array
    currentMarkerIds.forEach((id) => {
      if (!newMarkerIds.includes(id)) {
        map.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })

    // Add or update markers for each place
    const bounds = L.latLngBounds([])
    let hasValidCoordinates = false

    places.forEach((place) => {
      if (!place.coordinates || !place.coordinates.lat || !place.coordinates.lng) {
        return
      }

      hasValidCoordinates = true
      const position = L.latLng(place.coordinates.lat, place.coordinates.lng)
      bounds.extend(position)

      // Create or update marker
      if (!markersRef.current[place.id]) {
        const marker = L.marker(position, {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-pin ${selectedMarker === place.id ? "selected" : ""}">${place.name.charAt(0)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        })

        marker.on("click", () => {
          if (onPlaceSelect) {
            onPlaceSelect(place)
          }
          setSelectedMarker(place.id)
        })

        marker.addTo(map)
        markersRef.current[place.id] = marker
      } else {
        // Update existing marker position
        markersRef.current[place.id].setLatLng(position)

        // Update marker icon to reflect selection state
        markersRef.current[place.id].setIcon(
          L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-pin ${selectedMarker === place.id ? "selected" : ""}">${place.name.charAt(0)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        )
      }
    })

    // Fit bounds if we have valid coordinates
    if (hasValidCoordinates && bounds.isValid()) {
      // Get container dimensions
      const container = map.getContainer()
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      
      // Use full screen view to eliminate grey bars
      applyFullScreenView(map, places, containerWidth, containerHeight)
    }
  }, [places, onPlaceSelect, selectedMarker])

  // Listen for centerMap events
  useEffect(() => {
    const handleCenterMap = (event: Event) => {
      if (!mapRef.current) return

      const customEvent = event as CustomEvent<{ lat: number; lng: number }>
      const { lat, lng } = customEvent.detail

      if (lat && lng) {
        mapRef.current.setView([lat, lng], 16)
      }
    }

    window.addEventListener("centerMap", handleCenterMap as EventListener)

    return () => {
      window.removeEventListener("centerMap", handleCenterMap as EventListener)
    }
  }, [])

  return (
    <div style={{ height, width: "100%" }}>
      <style jsx global>{`
        .custom-marker {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: #000;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-weight: bold;
          transform-origin: center;
        }
        .marker-pin::after {
          content: '';
          width: 24px;
          height: 24px;
          margin: 3px 0 0 3px;
          background: #fff;
          position: absolute;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .marker-pin::before {
          content: attr(data-initial);
          color: #000;
          position: relative;
          z-index: 1;
          transform: rotate(45deg);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .marker-pin.selected {
          background: #3b82f6;
          z-index: 1000 !important;
          width: 36px;
          height: 36px;
          margin: -18px 0 0 -18px;
        }
        .marker-pin.selected::after {
          width: 28px;
          height: 28px;
          margin: 4px 0 0 4px;
        }
      `}</style>
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  )
}
