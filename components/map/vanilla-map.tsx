"use client"

import { useEffect, useRef, useState } from "react"
import type { Place } from "@/types/place"

interface VanillaMapProps {
  places: Place[]
  height?: string | number
  onPlaceSelect?: (place: Place) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

export default function VanillaMap({
  places = [],
  height = "500px",
  onPlaceSelect,
  onMapClick,
  className = "",
}: VanillaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`).current

  // Function to clean up the map instance
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      // Remove all markers
      markersRef.current.forEach((marker) => {
        if (marker) marker.remove()
      })
      markersRef.current = []

      // Remove the map
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      setIsMapInitialized(false)
    }
  }

  // Function to initialize the map
  const initMap = () => {
    if (!mapRef.current || !window.L || isMapInitialized || !mapRef.current.id) return

    // Clean up any existing map first
    cleanupMap()

    // Calculate center and zoom
    let center = [40.7128, -74.006]
    let zoom = 13

    if (places.length > 0) {
      if (places.length === 1) {
        center = [places[0].coordinates.lat, places[0].coordinates.lng]
        zoom = 15
      } else {
        // Calculate bounds
        const lats = places.map((place) => place.coordinates.lat)
        const lngs = places.map((place) => place.coordinates.lng)

        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)

        center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2]

        // Calculate appropriate zoom level
        const latDiff = maxLat - minLat
        const lngDiff = maxLng - minLng
        const maxDiff = Math.max(latDiff, lngDiff)

        zoom = 13
        if (maxDiff > 0.2) zoom = 10
        if (maxDiff > 1) zoom = 8
        if (maxDiff > 5) zoom = 6
      }
    }

    // Create map
    try {
      const map = window.L.map(mapRef.current.id, {
        center,
        zoom,
        zoomControl: false,
      })

      // Add zoom control to bottom right
      window.L.control.zoom({ position: "bottomright" }).addTo(map)

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: "grayscale",
      }).addTo(map)

      // Add map click handler for adding new places
      if (onMapClick) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng
          onMapClick(lat, lng)
        })
      }

      // Add markers
      markersRef.current = places.map((place) => {
        const marker = window.L.marker([place.coordinates.lat, place.coordinates.lng])
          .addTo(map)
          .bindPopup(`
            <div class="p-1">
              <h3 class="font-bold text-base">${place.name}</h3>
              <p class="text-xs text-black/70">${place.type || ""}</p>
              ${place.address ? `<p class="text-xs mt-1">${place.address}</p>` : ""}
              <button class="text-xs underline block mt-2 view-details" data-id="${place.id}">Show details</button>
            </div>
          `)

        marker.on("click", () => {
          if (onPlaceSelect) {
            onPlaceSelect(place)
          }
        })

        return marker
      })

      // Add event listener for popup content clicks
      map.on("popupopen", (e) => {
        // Find all view details buttons in the popup
        const popup = e.popup
        const container = popup.getElement()
        const viewDetailsButtons = container.querySelectorAll(".view-details")

        viewDetailsButtons.forEach((button: Element) => {
          button.addEventListener("click", (event) => {
            event.preventDefault()
            const placeId = (button as HTMLElement).dataset.id
            const place = places.find((p) => p.id === placeId)
            if (place && onPlaceSelect) {
              onPlaceSelect(place)
              popup.close()
            }
          })
        })
      })

      // Save map instance
      mapInstanceRef.current = map
      setIsMapInitialized(true)
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      link.crossOrigin = ""
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    if (typeof window !== "undefined") {
      if (!window.L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""
        script.onload = initMap
        document.head.appendChild(script)
      } else {
        // If Leaflet is already loaded, initialize the map
        initMap()
      }
    }

    // Cleanup function
    return () => {
      cleanupMap()
    }
  }, []) // Empty dependency array to run only once on mount

  // Effect to update markers when places change
  useEffect(() => {
    if (mapInstanceRef.current && isMapInitialized && places.length > 0) {
      // Remove existing markers
      markersRef.current.forEach((marker) => {
        if (marker) marker.remove()
      })
      markersRef.current = []

      // Add new markers
      markersRef.current = places.map((place) => {
        const marker = window.L.marker([place.coordinates.lat, place.coordinates.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
          <div class="p-1">
            <h3 class="font-bold text-base">${place.name}</h3>
            <p class="text-xs text-black/70">${place.type || ""}</p>
            ${place.address ? `<p class="text-xs mt-1">${place.address}</p>` : ""}
            <button class="text-xs underline block mt-2 view-details" data-id="${place.id}">Show details</button>
          </div>
        `)

        if (onPlaceSelect) {
          marker.on("click", () => {
            onPlaceSelect(place)
          })
        }

        return marker
      })

      // Update map view if places have changed
      if (places.length > 0) {
        if (places.length === 1) {
          mapInstanceRef.current.setView([places[0].coordinates.lat, places[0].coordinates.lng], 15)
        } else {
          // Create bounds from all places
          const bounds = window.L.latLngBounds(places.map((place) => [place.coordinates.lat, place.coordinates.lng]))
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    }
  }, [places, onPlaceSelect, isMapInitialized])

  return (
    <div
      id={mapId}
      ref={mapRef}
      style={{
        height,
        width: "100%",
        position: "relative",
        zIndex: 1,
      }}
      className={`border border-black/10 bg-gray-100 ${className}`}
    />
  )
}
