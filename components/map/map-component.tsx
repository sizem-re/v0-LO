"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Place } from "@/types/place"
import Link from "next/link"

interface MapComponentProps {
  places: Place[]
  height?: string | number
  onPlaceSelect?: (place: Place) => void
}

const MapComponent = ({ places, height = "500px", onPlaceSelect }: MapComponentProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Set up Leaflet icons
  useEffect(() => {
    // Fix for Leaflet marker icons in Next.js
    delete L.Icon.Default.prototype._getIconUrl

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })
  }, [])

  // Calculate the center and zoom based on the places
  const { center, zoom } = useMemo(() => {
    if (places.length === 0) {
      return { center: [40.7128, -74.006] as [number, number], zoom: 13 }
    }

    if (places.length === 1) {
      return {
        center: [places[0].coordinates.lat, places[0].coordinates.lng] as [number, number],
        zoom: 15,
      }
    }

    // Calculate bounds
    const lats = places.map((place) => place.coordinates.lat)
    const lngs = places.map((place) => place.coordinates.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)

    let zoom = 13
    if (maxDiff > 0.2) zoom = 10
    if (maxDiff > 1) zoom = 8
    if (maxDiff > 5) zoom = 6

    return { center: [centerLat, centerLng] as [number, number], zoom }
  }, [places])

  const handleMarkerClick = (place: Place) => {
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
  }

  useEffect(() => {
    // Initialize map only on client-side
    if (typeof window !== "undefined" && !mapRef.current && mapContainerRef.current) {
      // Create map instance
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)

      // Add markers for each place
      places.forEach((place) => {
        L.marker([place.coordinates.lat, place.coordinates.lng])
          .addTo(mapRef.current!)
          .bindPopup(() => (
            <div className="p-1">
              <h3 className="font-bold text-base">{place.name}</h3>
              <p className="text-xs text-black/70">{place.type}</p>
              {place.address && <p className="text-xs mt-1">{place.address}</p>}
              <Link href={`/places/${place.id}`} className="text-xs underline block mt-2">
                View details
              </Link>
            </div>
          ))
      })
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [places, center, zoom])

  return <div ref={mapContainerRef} style={{ height }} className="border border-black/10 z-0" />
}

export default MapComponent
