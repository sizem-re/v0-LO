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
    
    console.log('EXIF GPS Debug - Raw GPS tags:', {
      GPSLatitude: tags.GPSLatitude,
      GPSLongitude: tags.GPSLongitude,
      GPSLatitudeRef: tags.GPSLatitudeRef,
      GPSLongitudeRef: tags.GPSLongitudeRef
    })
    
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
    let lat: number
    let lng: number
    
    try {
      lat = convertGPSToDD(gpsLat)
      lng = convertGPSToDD(gpsLng)
      console.log('GPS conversion result:', { lat, lng })
    } catch (conversionError) {
      console.error('GPS conversion error:', conversionError)
      return {
        location: null,
        error: 'Failed to parse GPS coordinates from image'
      }
    }
    
    // Apply direction references (N/S for latitude, E/W for longitude)
    if (gpsLatRef && typeof gpsLatRef.value === 'string' && gpsLatRef.value.startsWith('S')) lat = -lat
    if (gpsLngRef && typeof gpsLngRef.value === 'string' && gpsLngRef.value.startsWith('W')) lng = -lng
    
    console.log('GPS after direction adjustment:', { lat, lng, latRef: gpsLatRef, lngRef: gpsLngRef })
    
    // Validate coordinates
    if (!isValidCoordinate(lat, lng)) {
      console.error('Invalid coordinates after conversion:', { lat, lng })
      return {
        location: null,
        error: 'Invalid GPS coordinates in image'
      }
    }
    
    // Check for 0,0 coordinates which are likely invalid
    if (lat === 0 && lng === 0) {
      console.error('GPS coordinates are 0,0 - likely invalid:', { lat, lng })
      return {
        location: null,
        error: 'GPS coordinates appear to be invalid (0,0)'
      }
    }
    
    console.log('Final GPS coordinates:', { lat, lng })
    
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
 * Convert GPS coordinate from EXIF data to decimal degrees
 * Handles multiple formats: arrays, strings, and objects
 */
function convertGPSToDD(gpsCoordinate: any): number {
  console.log('Converting GPS coordinate:', JSON.stringify(gpsCoordinate, null, 2))
  
  // If it's already a number, return it
  if (typeof gpsCoordinate === 'number') {
    console.log('GPS coordinate is already a number:', gpsCoordinate)
    return gpsCoordinate
  }
  
  // Check if it has a value property (common in EXIF data)
  if (gpsCoordinate && gpsCoordinate.value !== undefined) {
    const value = gpsCoordinate.value
    console.log('GPS coordinate has value property:', value)
    
    // If value is an array of coordinate parts [degrees, minutes, seconds]
    if (Array.isArray(value) && value.length >= 1) {
      let degrees = 0
      let minutes = 0
      let seconds = 0
      
      // Handle fractional format: [[47, 1], [15, 1], [4272, 100]]
      if (value.length > 0 && Array.isArray(value[0]) && value[0].length === 2) {
        // Fractional format - each value is [numerator, denominator]
        degrees = value[0][0] / value[0][1]
        if (value.length > 1) {
          minutes = value[1][0] / value[1][1]
        }
        if (value.length > 2) {
          seconds = value[2][0] / value[2][1]
        }
      } else {
        // Simple number format
        degrees = Number(value[0]) || 0
        minutes = Number(value[1]) || 0
        seconds = Number(value[2]) || 0
      }
      
      console.log('GPS DMS from array:', { degrees, minutes, seconds })
      const result = degrees + (minutes / 60) + (seconds / 3600)
      console.log('GPS decimal result:', result)
      return result
    }
    
    // If value is already a decimal number
    if (typeof value === 'number') {
      console.log('GPS value is decimal number:', value)
      return value
    }
    
    // If value is a string, try to parse it
    if (typeof value === 'string') {
      console.log('GPS value is string, parsing:', value)
      return parseGPSString(value)
    }
  }
  
  // Check if it has a description property and use that if it's a decimal
  if (gpsCoordinate && gpsCoordinate.description && typeof gpsCoordinate.description === 'number') {
    console.log('Using description as decimal:', gpsCoordinate.description)
    return gpsCoordinate.description
  }
  
  // Check if it has a description property as string
  if (gpsCoordinate && gpsCoordinate.description) {
    if (typeof gpsCoordinate.description === 'string') {
      console.log('GPS has description, parsing:', gpsCoordinate.description)
      return parseGPSString(gpsCoordinate.description)
    }
  }
  
  // If it's an array directly
  if (Array.isArray(gpsCoordinate) && gpsCoordinate.length >= 1) {
    let degrees = 0
    let minutes = 0
    let seconds = 0
    
    // Handle fractional format
    if (Array.isArray(gpsCoordinate[0]) && gpsCoordinate[0].length === 2) {
      degrees = gpsCoordinate[0][0] / gpsCoordinate[0][1]
      if (gpsCoordinate.length > 1) {
        minutes = gpsCoordinate[1][0] / gpsCoordinate[1][1]
      }
      if (gpsCoordinate.length > 2) {
        seconds = gpsCoordinate[2][0] / gpsCoordinate[2][1]
      }
    } else {
      // Simple number format
      degrees = Number(gpsCoordinate[0]) || 0
      minutes = Number(gpsCoordinate[1]) || 0
      seconds = Number(gpsCoordinate[2]) || 0
    }
    
    console.log('GPS DMS from direct array:', { degrees, minutes, seconds })
    const result = degrees + (minutes / 60) + (seconds / 3600)
    console.log('GPS decimal result:', result)
    return result
  }
  
  // If it's a string directly
  if (typeof gpsCoordinate === 'string') {
    console.log('GPS is direct string, parsing:', gpsCoordinate)
    return parseGPSString(gpsCoordinate)
  }
  
  throw new Error(`Unsupported GPS coordinate format: ${JSON.stringify(gpsCoordinate)}`)
}

/**
 * Parse GPS coordinate string in various formats
 */
function parseGPSString(str: string): number {
  if (!str || typeof str !== 'string') {
    throw new Error('GPS string is empty or not a string')
  }
  
  // Try to parse as decimal degrees first
  const decimal = parseFloat(str)
  if (!isNaN(decimal)) {
    return decimal
  }
  
  // Try to parse DMS format: "40° 42' 51.37" N" or "40 42 51.37"
  const dmsRegex = /(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)['\s]*(\d+(?:\.\d+)?)?/
  const match = str.match(dmsRegex)
  
  if (match) {
    const degrees = parseFloat(match[1]) || 0
    const minutes = parseFloat(match[2]) || 0
    const seconds = parseFloat(match[3]) || 0
    
    return degrees + (minutes / 60) + (seconds / 3600)
  }
  
  // Try space-separated format: "40 42 51.37"
  const parts = str.trim().split(/\s+/)
  if (parts.length >= 1) {
    const degrees = parseFloat(parts[0]) || 0
    const minutes = parseFloat(parts[1]) || 0
    const seconds = parseFloat(parts[2]) || 0
    
    return degrees + (minutes / 60) + (seconds / 3600)
  }
  
  throw new Error(`Unable to parse GPS string: "${str}"`)
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @deprecated Use convertGPSToDD instead for better format support
 */
function convertDMSToDD(dms: string): number {
  if (!dms || typeof dms !== 'string') {
    throw new Error('DMS string is empty or not a string')
  }
  
  const parts = dms.split(' ')
  const degrees = parseFloat(parts[0]) || 0
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