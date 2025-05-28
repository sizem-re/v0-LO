"use client"

import { useEffect, useRef, useState } from "react"
import type { Place } from "@/types/place"
import { calculateSmartFitBoundsOptions } from "@/lib/map-utils"

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
            <div class="p-3 min-w-[200px]">
              <div class="mb-2">
                <h3 class="font-serif font-semibold text-base text-gray-900 leading-tight">${place.name}</h3>
                ${place.type ? `<p class="text-xs text-gray-600 mt-1">${place.type}</p>` : ""}
              </div>
              ${place.address ? `
                <div class="flex items-start gap-2 mb-3">
                  <svg class="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                  </svg>
                  <p class="text-xs text-gray-700 leading-relaxed">${place.address}</p>
                </div>
              ` : ""}
              ${place.website ? `
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-3 h-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"></path>
                  </svg>
                  <a href="${place.website}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                    ${place.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ` : ""}
              <div class="pt-2 border-t border-gray-200">
                <button class="w-full bg-black text-white text-xs font-medium py-2 px-3 rounded hover:bg-gray-800 transition-colors view-details" data-id="${place.id}">
                  View Details
                </button>
              </div>
            </div>
          `, {
            maxWidth: 250,
            className: 'custom-popup'
          })

        marker.on("click", () => {
          if (onPlaceSelect) {
            onPlaceSelect(place)
          }
        })

        return marker
      })

      // Add event listener for popup content clicks
      map.on("popupopen", (e: any) => {
        // Find all view details buttons in the popup
        const popup = e.popup
        const container = popup.getElement()
        const viewDetailsButtons = container.querySelectorAll(".view-details")

        viewDetailsButtons.forEach((button: Element) => {
          button.addEventListener("click", (event) => {
            event.preventDefault()
            const placeId = (button as HTMLElement).dataset.id
            const place = places.find((p) => p.id === placeId)
            if (place) {
              // Dispatch custom event to navigate to place details in sidebar
              const placeSelectEvent = new CustomEvent("selectPlaceFromMap", { 
                detail: { place, navigateToPlaces: true } 
              })
              window.dispatchEvent(placeSelectEvent)
              
              // Also call onPlaceSelect if provided
              if (onPlaceSelect) {
                onPlaceSelect(place)
              }
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
            <div class="p-3 min-w-[200px]">
              <div class="mb-2">
                <h3 class="font-serif font-semibold text-base text-gray-900 leading-tight">${place.name}</h3>
                ${place.type ? `<p class="text-xs text-gray-600 mt-1">${place.type}</p>` : ""}
              </div>
              ${place.address ? `
                <div class="flex items-start gap-2 mb-3">
                  <svg class="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                  </svg>
                  <p class="text-xs text-gray-700 leading-relaxed">${place.address}</p>
                </div>
              ` : ""}
              ${place.website ? `
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-3 h-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"></path>
                  </svg>
                  <a href="${place.website}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                    ${place.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ` : ""}
              <div class="pt-2 border-t border-gray-200">
                <button class="w-full bg-black text-white text-xs font-medium py-2 px-3 rounded hover:bg-gray-800 transition-colors view-details" data-id="${place.id}">
                  View Details
                </button>
              </div>
            </div>
          `, {
            maxWidth: 250,
            className: 'custom-popup'
          })

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
          
          // Get container dimensions
          const container = mapInstanceRef.current.getContainer()
          const containerWidth = container.offsetWidth
          const containerHeight = container.offsetHeight
          
          // Calculate smart fit bounds options to avoid grey bars
          const fitOptions = calculateSmartFitBoundsOptions(bounds, containerWidth, containerHeight)
          
          mapInstanceRef.current.fitBounds(bounds, fitOptions)
        }
      }
    }
  }, [places, onPlaceSelect, isMapInitialized])

  // Listen for centerMap events
  useEffect(() => {
    const handleCenterMap = (event: Event) => {
      if (!mapInstanceRef.current) return

      const customEvent = event as CustomEvent<{ lat: number; lng: number }>
      const { lat, lng } = customEvent.detail

      if (lat && lng) {
        mapInstanceRef.current.setView([lat, lng], 16)
      }
    }

    window.addEventListener("centerMap", handleCenterMap as EventListener)

    return () => {
      window.removeEventListener("centerMap", handleCenterMap as EventListener)
    }
  }, [])

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
    >
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-top: none;
          border-right: none;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #6b7280;
          font-size: 18px;
          padding: 4px 8px;
        }
        .custom-popup .leaflet-popup-close-button:hover {
          color: #374151;
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  )
}
