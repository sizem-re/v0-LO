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
  places,
  height = "500px",
  onPlaceSelect,
  onMapClick,
  className = "",
}: VanillaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userLocationMarkerRef = useRef<any>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`).current

  // Function to clean up the map instance
  const cleanupMap = () => {
    if (typeof window === "undefined") return

    if (mapInstanceRef.current) {
      // Remove all markers
      markersRef.current.forEach((marker) => {
        if (marker) marker.remove()
      })
      markersRef.current = []

      // Remove user location marker if it exists
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove()
        userLocationMarkerRef.current = null
      }

      // Remove the map
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      setIsMapInitialized(false)
    }
  }

  // Function to initialize the map
  const initMap = () => {
    if (typeof window === "undefined") return
    if (!mapRef.current || !window.L || isMapInitialized || !mapRef.current.id) return

    // Clean up any existing map first
    cleanupMap()

    // Calculate center and zoom
    let center = [40.7128, -74.006]
    let zoom = 13

    if (places.length > 0) {
      if (places.length === 1) {
        center = [places[0].coordinates?.lat || places[0].lat, places[0].coordinates?.lng || places[0].lng]
        zoom = 15
      } else {
        // Calculate bounds
        const lats = places.map((place) => place.coordinates?.lat || place.lat)
        const lngs = places.map((place) => place.coordinates?.lng || place.lng)

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

      // Add locate control to bottom right
      const locateControl = window.L.control({ position: "bottomright" })

      locateControl.onAdd = () => {
        const container = window.L.DomUtil.create("div", "leaflet-bar leaflet-control")
        const button = window.L.DomUtil.create("a", "", container)
        button.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>'
        button.href = "#"
        button.title = "Show my location"
        button.style.display = "flex"
        button.style.alignItems = "center"
        button.style.justifyContent = "center"
        button.style.width = "30px"
        button.style.height = "30px"

        // Add click event
        window.L.DomEvent.on(button, "click", (e) => {
          window.L.DomEvent.stopPropagation(e)
          window.L.DomEvent.preventDefault(e)

          // Mock location for demo purposes
          const mockLocation = {
            lat: center[0] + (Math.random() * 0.01 - 0.005),
            lng: center[1] + (Math.random() * 0.01 - 0.005),
          }

          // Create a marker for the user's location if it doesn't exist
          if (!userLocationMarkerRef.current) {
            userLocationMarkerRef.current = window.L.marker([mockLocation.lat, mockLocation.lng], {
              icon: window.L.divIcon({
                className: "user-location-marker",
                html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              }),
            }).addTo(map)
          } else {
            // Update marker position
            userLocationMarkerRef.current.setLatLng([mockLocation.lat, mockLocation.lng])
          }

          // Fly to the location
          map.flyTo([mockLocation.lat, mockLocation.lng], 16)
        })

        return container
      }

      locateControl.addTo(map)

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

          // Update marker position if it exists for visual feedback
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([lat, lng])
          } else {
            userLocationMarkerRef.current = window.L.marker([lat, lng]).addTo(map)
          }
        })
      }

      // Add markers
      markersRef.current = places.map((place) => {
        const lat = place.coordinates?.lat || place.lat
        const lng = place.coordinates?.lng || place.lng

        const marker = window.L.marker([lat, lng])
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

      // Handle window resize
      const handleResize = () => {
        map.invalidateSize()
      }
      window.addEventListener("resize", handleResize)

      // Save map instance
      mapInstanceRef.current = map
      setIsMapInitialized(true)

      // Return cleanup function for resize listener
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

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

    // Cleanup function
    return () => {
      cleanupMap()
    }
  }, []) // Empty dependency array to run only once on mount

  // Effect to update markers when places change
  useEffect(() => {
    if (typeof window === "undefined") return

    if (mapInstanceRef.current && isMapInitialized) {
      // Remove existing markers
      markersRef.current.forEach((marker) => {
        if (marker) marker.remove()
      })
      markersRef.current = []

      // Add new markers
      markersRef.current = places.map((place) => {
        const lat = place.coordinates?.lat || place.lat
        const lng = place.coordinates?.lng || place.lng

        const marker = window.L.marker([lat, lng])
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
          const lat = places[0].coordinates?.lat || places[0].lat
          const lng = places[0].coordinates?.lng || places[0].lng
          mapInstanceRef.current.setView([lat, lng], 15)
        } else {
          // Create bounds from all places
          const bounds = window.L.latLngBounds(
            places.map((place) => {
              const lat = place.coordinates?.lat || place.lat
              const lng = place.coordinates?.lng || place.lng
              return [lat, lng]
            }),
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }

      // Update click handler based on onMapClick prop
      mapInstanceRef.current.off("click")
      if (onMapClick) {
        mapInstanceRef.current.on("click", (e: any) => {
          const { lat, lng } = e.latlng
          onMapClick(lat, lng)

          // Update marker position if it exists for visual feedback
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([lat, lng])
          } else {
            userLocationMarkerRef.current = window.L.marker([lat, lng]).addTo(mapInstanceRef.current)
          }
        })
      }

      // Invalidate size to handle any container size changes
      mapInstanceRef.current.invalidateSize()
    }
  }, [places, onPlaceSelect, onMapClick, isMapInitialized])

  return (
    <div
      id={mapId}
      ref={mapRef}
      style={{
        height,
        width: "100%",
        position: "relative",
        zIndex: 1, // Add this line to ensure map has a low z-index
      }}
      className={`border border-black/10 bg-gray-100 ${className}`}
    />
  )
}
