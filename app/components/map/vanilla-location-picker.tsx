"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix the marker icon path issue in Leaflet
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

type LocationPickerProps = {
  initialLocation: { lat: number; lng: number }
  onLocationChange: (location: { lat: number; lng: number }) => void
  height?: string
}

export default function VanillaLocationPicker({
  initialLocation,
  onLocationChange,
  height = "300px",
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [location, setLocation] = useState(initialLocation)

  // Initialize map on component mount
  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      fixLeafletIcon()
      
      leafletMap.current = L.map(mapRef.current).setView(
        [initialLocation.lat, initialLocation.lng],
        13
      )
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(leafletMap.current)
      
      // Add initial marker
      markerRef.current = L.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true,
      }).addTo(leafletMap.current)
      
      // Update location when marker is dragged
      markerRef.current.on("dragend", () => {
        if (markerRef.current) {
          const position = markerRef.current.getLatLng()
          const newLocation = { lat: position.lat, lng: position.lng }
          setLocation(newLocation)
          onLocationChange(newLocation)
        }
      })
      
      // Update location when map is clicked
      leafletMap.current.on("click", (e) => {
        if (markerRef.current && leafletMap.current) {
          const { lat, lng } = e.latlng
          markerRef.current.setLatLng([lat, lng])
          const newLocation = { lat, lng }
          setLocation(newLocation)
          onLocationChange(newLocation)
        }
      })
    }
    
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
        markerRef.current = null
      }
    }
  }, [initialLocation, onLocationChange])

  // Update marker position if initialLocation changes
  useEffect(() => {
    if (
      markerRef.current &&
      (location.lat !== initialLocation.lat || location.lng !== initialLocation.lng)
    ) {
      markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng])
      setLocation(initialLocation)
      
      if (leafletMap.current) {
        leafletMap.current.setView([initialLocation.lat, initialLocation.lng], 13)
      }
    }
  }, [initialLocation, location])

  return <div ref={mapRef} style={{ height, width: "100%" }} />
} 