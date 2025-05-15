"use client"

import { useEffect, useRef, useState } from "react"

interface VanillaLocationPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationChange: (location: { lat: number; lng: number }) => void
  height?: string | number
}

export default function VanillaLocationPicker({
  initialLocation,
  onLocationChange,
  height = "400px",
}: VanillaLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const mapId = useRef(`location-picker-${Math.random().toString(36).substring(2, 9)}`).current

  // Function to clean up the map instance
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      // Remove marker if it exists
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }

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

    try {
      // Default center if no initial location
      const center = initialLocation ? [initialLocation.lat, initialLocation.lng] : [40.7128, -74.006]

      // Create map
      const map = window.L.map(mapRef.current.id, {
        center,
        zoom: 13,
        zoomControl: false,
      })

      // Add zoom control to bottom right
      window.L.control.zoom({ position: "bottomright" }).addTo(map)

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: "grayscale",
      }).addTo(map)

      // Add initial marker if location is provided
      if (initialLocation) {
        markerRef.current = window.L.marker([initialLocation.lat, initialLocation.lng]).addTo(map)
      }

      // Handle map clicks
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = window.L.marker([lat, lng]).addTo(map)
        }

        // Call the callback with the new location
        onLocationChange({ lat, lng })
      })

      // Try to get user's location if no initial position
      if (!initialLocation) {
        map.locate({ setView: true, maxZoom: 16 })

        map.on("locationfound", (e: any) => {
          const { lat, lng } = e.latlng

          // Update marker position
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            markerRef.current = window.L.marker([lat, lng]).addTo(map)
          }

          // Call the callback with the new location
          onLocationChange({ lat, lng })
        })
      }

      // Save map instance
      mapInstanceRef.current = map
      setIsMapInitialized(true)
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }

  useEffect(() => {
    // Check if Leaflet is available
    if (typeof window !== "undefined" && window.L) {
      initMap()
    } else {
      console.error("Leaflet library not available. Please include it in your project.")
    }

    // Cleanup function
    return () => {
      cleanupMap()
    }
  }, []) // Empty dependency array to run only once on mount

  // Effect to update marker when initialLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && isMapInitialized && initialLocation) {
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng])
      } else {
        markerRef.current = window.L.marker([initialLocation.lat, initialLocation.lng]).addTo(mapInstanceRef.current)
      }

      // Center map on the marker
      mapInstanceRef.current.setView([initialLocation.lat, initialLocation.lng], 13)
    }
  }, [initialLocation, isMapInitialized])

  return (
    <div id={mapId} ref={mapRef} style={{ height, width: "100%" }} className="border border-black/10 bg-gray-100" />
  )
}
