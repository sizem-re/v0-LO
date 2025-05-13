"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Place } from "../../types/place"

// Fix the marker icon path issue in Leaflet
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

type VanillaMapProps = {
  places: Place[]
  height?: string
  onPlaceSelect?: (place: Place) => void
}

export default function VanillaMap({ places, height = "500px", onPlaceSelect }: VanillaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})

  useEffect(() => {
    // Initialize the map
    if (mapRef.current && !leafletMap.current) {
      fixLeafletIcon()
      
      leafletMap.current = L.map(mapRef.current).setView([40, -95], 4)
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(leafletMap.current)
    }
    
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [])

  // Update markers when places change
  useEffect(() => {
    if (!leafletMap.current) return
    
    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove()
    })
    markersRef.current = {}
    
    if (places.length === 0) return
    
    // Add new markers
    const bounds = L.latLngBounds([])
    
    places.forEach((place) => {
      const { lat, lng } = place.coordinates
      const marker = L.marker([lat, lng])
        .addTo(leafletMap.current!)
        .bindPopup(`<strong>${place.name}</strong><br>${place.address}`)
      
      if (onPlaceSelect) {
        marker.on("click", () => {
          onPlaceSelect(place)
        })
      }
      
      markersRef.current[place.id] = marker
      bounds.extend([lat, lng])
    })
    
    // Fit the map to show all markers if there are multiple places
    if (places.length > 1) {
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] })
    } else if (places.length === 1) {
      leafletMap.current.setView(
        [places[0].coordinates.lat, places[0].coordinates.lng],
        14
      )
    }
  }, [places, onPlaceSelect])

  return <div ref={mapRef} style={{ height, width: "100%" }} />
} 