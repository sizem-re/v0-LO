"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  MapPin,
  Navigation,
  Image as ImageIcon,
  Map,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Target,
  Edit3,
  MapPinIcon
} from "lucide-react"
import {
  extractLocationFromPhoto,
  getCurrentLocation,
  isValidCoordinate,
  formatCoordinates,
  reverseGeocode,
  type LocationData
} from "@/lib/geolocation-utils"

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null
  onLocationChange: (location: { lat: number; lng: number } | null, address?: string, source?: string) => void
  photoFile?: File | null
  disabled?: boolean
  showMap?: boolean
  className?: string
}

type LocationSource = 'photo' | 'current' | 'map' | 'search' | 'manual' | 'address'

interface LocationOption {
  id: LocationSource
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
  available: boolean
}

export function LocationPicker({
  value,
  onLocationChange,
  photoFile,
  disabled = false,
  showMap = true,
  className
}: LocationPickerProps) {
  const [loading, setLoading] = useState<LocationSource | null>(null)
  const [extractedLocation, setExtractedLocation] = useState<LocationData | null>(null)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [manualLat, setManualLat] = useState(value?.lat?.toString() || "")
  const [manualLng, setManualLng] = useState(value?.lng?.toString() || "")
  const [manualAddress, setManualAddress] = useState("")
  const [selectedSource, setSelectedSource] = useState<LocationSource | null>(
    value ? 'manual' : null
  )
  const [locationAddress, setLocationAddress] = useState<string>("")
  const mapRef = useRef<HTMLDivElement>(null)

  // Define available location sources
  const locationOptions: LocationOption[] = [
    {
      id: 'photo',
      label: 'From Photo',
      icon: ImageIcon,
      description: 'Extract GPS coordinates from uploaded image',
      available: !!photoFile
    },
    {
      id: 'current',
      label: 'Current Location',
      icon: Navigation,
      description: 'Use your current GPS location',
      available: typeof navigator !== 'undefined' && !!navigator.geolocation
    },
    {
      id: 'map',
      label: 'Pick on Map',
      icon: Map,
      description: 'Click on map to choose location',
      available: showMap
    },
    {
      id: 'search',
      label: 'Search Places',
      icon: Search,
      description: 'Search using Google Places',
      available: true
    },
    {
      id: 'manual',
      label: 'Enter Coordinates',
      icon: Edit3,
      description: 'Manually input latitude and longitude',
      available: true
    },
    {
      id: 'address',
      label: 'Enter Address',
      icon: MapPinIcon,
      description: 'Manually enter an address',
      available: true
    }
  ]

  // Extract location from photo when file changes
  useEffect(() => {
    if (photoFile && selectedSource !== 'photo') {
      handleExtractFromPhoto()
    }
  }, [photoFile])

  // Update manual inputs when value changes externally
  useEffect(() => {
    if (value && selectedSource !== 'manual') {
      setManualLat(value.lat.toString())
      setManualLng(value.lng.toString())
    }
  }, [value, selectedSource])

  const handleExtractFromPhoto = async () => {
    if (!photoFile) return

    setLoading('photo')
    try {
      const result = await extractLocationFromPhoto(photoFile)
      
      if (result.location) {
        setExtractedLocation(result.location)
        setSelectedSource('photo')
        onLocationChange(
          { lat: result.location.lat, lng: result.location.lng },
          undefined,
          'photo'
        )
        
        // Try to get address
        const address = await reverseGeocode(result.location.lat, result.location.lng)
        if (address) {
          setLocationAddress(address)
          onLocationChange(
            { lat: result.location.lat, lng: result.location.lng },
            address,
            'photo'
          )
        }
        
        toast({
          title: "Location found in photo",
          description: `Coordinates: ${formatCoordinates(result.location.lat, result.location.lng)}`,
        })
      } else {
        toast({
          title: "No location in photo",
          description: result.error || "This photo doesn't contain GPS coordinates",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error extracting photo location:', error)
      toast({
        title: "Error reading photo",
        description: "Failed to extract location from image",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const handleGetCurrentLocation = async () => {
    setLoading('current')
    try {
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      setSelectedSource('current')
      onLocationChange(
        { lat: location.lat, lng: location.lng },
        undefined,
        'current'
      )
      
      // Try to get address
      const address = await reverseGeocode(location.lat, location.lng)
      if (address) {
        setLocationAddress(address)
        onLocationChange(
          { lat: location.lat, lng: location.lng },
          address,
          'current'
        )
      }
      
      toast({
        title: "Current location found",
        description: `Accuracy: ±${Math.round(location.accuracy || 0)}m`,
      })
    } catch (error) {
      console.error('Error getting current location:', error)
      toast({
        title: "Location access failed",
        description: error instanceof Error ? error.message : "Failed to get location",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const handleManualInput = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (!manualLat || !manualLng) {
      onLocationChange(null)
      setSelectedSource(null)
      return
    }
    
    if (!isValidCoordinate(lat, lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive"
      })
      return
    }
    
    setSelectedSource('manual')
    onLocationChange({ lat, lng }, undefined, 'manual')
    
    // Try to get address
    reverseGeocode(lat, lng).then(address => {
      if (address) {
        setLocationAddress(address)
        onLocationChange({ lat, lng }, address, 'manual')
      }
    })
  }

  const handleAddressInput = async () => {
    if (!manualAddress.trim()) {
      onLocationChange(null)
      setSelectedSource(null)
      return
    }

    setLoading('address')
    try {
      // Use Nominatim API for geocoding the address
      const encodedAddress = encodeURIComponent(manualAddress.trim())
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable')
      }

      const results = await response.json()
      
      if (results.length === 0) {
        toast({
          title: "Address not found",
          description: "Could not find coordinates for this address. Please check the spelling or try a different format.",
          variant: "destructive"
        })
        return
      }

      const result = results[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)

      if (!isValidCoordinate(lat, lng)) {
        throw new Error('Invalid coordinates returned')
      }

      setSelectedSource('address')
      setLocationAddress(manualAddress.trim())
      onLocationChange({ lat, lng }, manualAddress.trim(), 'address')
      
      toast({
        title: "Address found",
        description: `Located at ${formatCoordinates(lat, lng)}`,
      })
    } catch (error) {
      console.error('Error geocoding address:', error)
      toast({
        title: "Geocoding failed",
        description: error instanceof Error ? error.message : "Failed to find coordinates for this address",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const getLocationDisplay = () => {
    if (!value) return null
    
    return (
      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Location set from {selectedSource === 'photo' ? 'photo' : 
                               selectedSource === 'current' ? 'current location' :
                               selectedSource === 'map' ? 'map selection' :
                               selectedSource === 'search' ? 'place search' :
                               selectedSource === 'manual' ? 'manual input' : 'address input'}
          </span>
        </div>
        <div className="text-xs text-green-700">
          {formatCoordinates(value.lat, value.lng)}
        </div>
        {locationAddress && (
          <div className="text-xs text-green-600 mt-1">
            {locationAddress}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="text-sm font-medium">Choose Location Source</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {locationOptions.filter(option => option.available).map((option) => {
            const Icon = option.icon
            const isLoading = loading === option.id
            const isSelected = selectedSource === option.id
            
            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-blue-500 bg-blue-50",
                  !option.available && "opacity-50 cursor-not-allowed",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => {
                  if (disabled || !option.available) return
                  
                  if (option.id === 'photo') {
                    handleExtractFromPhoto()
                  } else if (option.id === 'current') {
                    handleGetCurrentLocation()
                  } else if (option.id === 'manual') {
                    setSelectedSource('manual')
                    handleManualInput()
                  } else if (option.id === 'search') {
                    setSelectedSource('search')
                    // Place search will be handled by parent component
                  } else if (option.id === 'map') {
                    setSelectedSource('map')
                    // Map picker will be handled by parent component
                  } else if (option.id === 'address') {
                    setSelectedSource('address')
                    handleAddressInput()
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{option.label}</span>
                        {isSelected && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        {option.id === 'photo' && extractedLocation && (
                          <Badge variant="outline" className="text-xs">GPS Found</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Manual coordinate input */}
      {selectedSource === 'manual' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Manual Coordinates</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude" className="text-xs text-gray-600">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="40.7128"
                value={manualLat}
                onChange={(e) => {
                  setManualLat(e.target.value)
                  handleManualInput()
                }}
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-xs text-gray-600">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-74.0060"
                value={manualLng}
                onChange={(e) => {
                  setManualLng(e.target.value)
                  handleManualInput()
                }}
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual address input */}
      {selectedSource === 'address' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Enter Address</Label>
          <div className="space-y-2">
            <Input
              id="address"
              type="text"
              placeholder="123 Main St, City, State, Country"
              value={manualAddress}
              onChange={(e) => {
                setManualAddress(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddressInput()
                }
              }}
              disabled={disabled || loading === 'address'}
              className="w-full"
            />
            <Button
              type="button"
              onClick={handleAddressInput}
              disabled={disabled || loading === 'address' || !manualAddress.trim()}
              size="sm"
              className="w-full"
            >
              {loading === 'address' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Finding Location...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Find Location
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter a full address including city and country for best results
          </p>
        </div>
      )}

      {/* Location display */}
      {getLocationDisplay()}

      {/* Helper text */}
      {!value && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span>Choose a location source above to set coordinates</span>
        </div>
      )}
    </div>
  )
} 