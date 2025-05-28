// Geolocation utilities for extracting and managing location data

export interface LocationData {
  lat: number
  lng: number
  accuracy?: number
  source: 'photo' | 'current' | 'map' | 'search' | 'manual'
  timestamp?: number
}

export interface PhotoLocationResult {
  location: LocationData | null
  error?: string
}

/**
 * Extract GPS coordinates from image EXIF data
 */
export async function extractLocationFromPhoto(file: File): Promise<PhotoLocationResult> {
  try {
    // Dynamic import to avoid SSR issues
    const ExifReader = await import('exifreader')
    
    const arrayBuffer = await file.arrayBuffer()
    const tags = ExifReader.load(arrayBuffer)
    
    // Check if GPS data exists
    const gpsLat = tags.GPSLatitude
    const gpsLng = tags.GPSLongitude
    const gpsLatRef = tags.GPSLatitudeRef
    const gpsLngRef = tags.GPSLongitudeRef
    
    if (!gpsLat || !gpsLng) {
      return {
        location: null,
        error: 'No GPS data found in image'
      }
    }
    
    // Convert GPS coordinates to decimal degrees
    let lat = convertDMSToDD(gpsLat.description)
    let lng = convertDMSToDD(gpsLng.description)
    
    // Apply direction references (N/S for latitude, E/W for longitude)
    if (gpsLatRef && typeof gpsLatRef.value === 'string' && gpsLatRef.value.startsWith('S')) lat = -lat
    if (gpsLngRef && typeof gpsLngRef.value === 'string' && gpsLngRef.value.startsWith('W')) lng = -lng
    
    // Validate coordinates
    if (!isValidCoordinate(lat, lng)) {
      return {
        location: null,
        error: 'Invalid GPS coordinates in image'
      }
    }
    
    return {
      location: {
        lat,
        lng,
        source: 'photo',
        timestamp: Date.now()
      }
    }
  } catch (error) {
    console.error('Error extracting location from photo:', error)
    return {
      location: null,
      error: 'Failed to read image location data'
    }
  }
}

/**
 * Get current location using browser geolocation API
 */
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'current',
          timestamp: Date.now()
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
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    )
  })
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 */
function convertDMSToDD(dms: string): number {
  const parts = dms.split(' ')
  const degrees = parseFloat(parts[0])
  const minutes = parseFloat(parts[2]) || 0
  const seconds = parseFloat(parts[4]) || 0
  
  return degrees + (minutes / 60) + (seconds / 3600)
}

/**
 * Validate coordinate values
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en',
          'User-Agent': 'LO Place App (https://llllllo.com)',
        },
      }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.display_name || null
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return null
  }
} 