"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { MapPin, Target, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleMapPickerProps {
  initialLocation?: { lat: number; lng: number } | null
  onLocationSelect: (location: { lat: number; lng: number }) => void
  onCancel: () => void
  className?: string
}

export function SimpleMapPicker({
  initialLocation,
  onLocationSelect,
  onCancel,
  className
}: SimpleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  )
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const L = await import('leaflet')
        
        // Fix for default markers in webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })

        if (!mounted || !mapRef.current) return

        // Initialize map
        const map = L.map(mapRef.current).setView(
          initialLocation ? [initialLocation.lat, initialLocation.lng] : [40.7128, -74.0060],
          initialLocation ? 15 : 10
        )

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Add initial marker if location provided
        if (initialLocation) {
          const marker = L.marker([initialLocation.lat, initialLocation.lng])
            .addTo(map)
            .bindPopup('Selected location')
          markerRef.current = marker
        }

        // Handle map clicks
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng
          
          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }
          
          // Add new marker
          const marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
            .openPopup()
          
          markerRef.current = marker
          setSelectedLocation({ lat, lng })
        })

        mapInstanceRef.current = map
        setIsMapReady(true)

        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mounted && map) {
            map.invalidateSize()
          }
        }, 100)

      } catch (error) {
        console.error('Error initializing map:', error)
        toast({
          title: "Map loading failed",
          description: "Unable to load the interactive map",
          variant: "destructive"
        })
      }
    }

    initMap()

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [initialLocation])

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
    } else {
      toast({
        title: "No location selected",
        description: "Please click on the map to select a location",
        variant: "destructive"
      })
    }
  }

  const handleUseCurrentLocation = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported')
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }

          setSelectedLocation(location)

          if (mapInstanceRef.current) {
            const L = require('leaflet')
            
            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current)
            }
            
            // Add new marker at current location
            const marker = L.marker([location.lat, location.lng])
              .addTo(mapInstanceRef.current)
              .bindPopup('Your current location')
              .openPopup()
            
            markerRef.current = marker
            
            // Pan to current location
            mapInstanceRef.current.setView([location.lat, location.lng], 15)
          }

          toast({
            title: "Current location found",
            description: `Accuracy: ±${Math.round(position.coords.accuracy || 0)}m`
          })
        },
        (error) => {
          let message = 'Failed to get current location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          toast({
            title: "Location failed",
            description: message,
            variant: "destructive"
          })
        }
      )
    } catch (error) {
      toast({
        title: "Location failed",
        description: "Unable to access current location",
        variant: "destructive"
      })
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Pick Location on Map</span>
        </div>
        <p className="text-xs text-blue-700">
          Click anywhere on the map to select a location, or use your current location
        </p>
      </div>

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-64 md:h-80 border border-gray-300 rounded-md bg-gray-100 relative"
      >
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          Use Current Location
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmLocation}
            disabled={!selectedLocation}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Confirm Location
          </Button>
        </div>
      </div>

      {/* Selected location display */}
      {selectedLocation && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">
            Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  )
} 