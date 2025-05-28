/**
 * Utility functions for working with maps and generating static map images
 */

/**
 * Generate a static map image URL using OpenStreetMap tiles
 * This creates a map centered on the given coordinates with a 0.25 mile radius
 */
export function generateStaticMapUrl(
  lat: number,
  lng: number,
  options: {
    width?: number
    height?: number
    zoom?: number
    radiusMiles?: number
  } = {}
): string {
  const {
    width = 400,
    height = 300,
    zoom = 15, // Good zoom level for 0.25 mile radius
    radiusMiles = 0.25
  } = options

  // Primary option: Use a simple tile-based approach
  // This creates a URL that points to a single tile from OpenStreetMap
  // While not a perfect static map, it provides a map view of the area
  
  // Calculate the tile coordinates for the center point
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  
  // Return a tile URL - this is simple and reliable
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}

/**
 * Generate a basic static map using OpenStreetMap's embedding feature
 * This creates an embedded map URL that can be used in an iframe if needed
 */
export function generateEmbeddedStaticMap(
  lat: number,
  lng: number,
  zoom: number = 15
): string {
  // Calculate a bounding box for the map (roughly 0.25 miles)
  const bbox = 0.008 // Approximately 0.25 miles in degrees
  const west = lng - bbox
  const south = lat - bbox
  const east = lng + bbox
  const north = lat + bbox
  
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`
}

/**
 * Generate a static map image URL specifically for place detail views
 * Optimized for the sidebar dimensions and 0.25 mile radius
 */
export function generatePlaceMapImage(place: any): string | null {
  // Try to get coordinates from different possible fields
  let lat: number, lng: number
  
  if (place.coordinates) {
    lat = place.coordinates.lat
    lng = place.coordinates.lng
  } else if (place.lat && place.lng) {
    lat = parseFloat(place.lat)
    lng = parseFloat(place.lng)
  } else if (place.latitude && place.longitude) {
    lat = parseFloat(place.latitude)
    lng = parseFloat(place.longitude)
  } else {
    return null // No coordinates available
  }
  
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }
  
  return generateStaticMapUrl(lat, lng, {
    width: 400,
    height: 192, // Height of the place image container (h-48 = 192px)
    zoom: 15,
    radiusMiles: 0.25
  })
}

/**
 * Alternative: Generate a static map using a data URL approach
 * This creates a simple placeholder map image using canvas
 */
export function generatePlaceholderMapDataUrl(
  lat: number,
  lng: number,
  width: number = 400,
  height: number = 192
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  // Draw a simple map-like background
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#e8f4f8')
  gradient.addColorStop(1, '#d1e7dd')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Add some simple "map" elements
  ctx.strokeStyle = '#6c757d'
  ctx.lineWidth = 1
  
  // Draw grid lines to simulate map streets
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height)
    ctx.stroke()
  }
  
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(width, i)
    ctx.stroke()
  }
  
  // Add a marker at the center
  const centerX = width / 2
  const centerY = height / 2
  
  ctx.fillStyle = '#dc3545'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
  ctx.fill()
  
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
  ctx.fill()
  
  // Add coordinates text
  ctx.fillStyle = '#495057'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, centerX, height - 10)
  
  return canvas.toDataURL('image/png')
}

/**
 * Generate a simple embedded OpenStreetMap URL for iframe usage
 * This creates an interactive map that can be embedded if needed
 */
export function generateEmbeddedMapUrl(
  lat: number, 
  lng: number,
  zoom: number = 15
): string {
  // Calculate a small bounding box around the point (roughly 0.25 miles)
  const bbox = 0.01 // Approximately 0.25 miles in degrees
  const west = lng - bbox
  const south = lat - bbox
  const east = lng + bbox
  const north = lat + bbox
  
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`
}

/**
 * Convert miles to approximate degrees (rough approximation)
 * Used for calculating bounding boxes
 */
export function milesToDegrees(miles: number): number {
  // Very rough approximation: 1 mile ≈ 0.014 degrees at mid-latitudes
  return miles * 0.014
}

/**
 * Create a custom static map using client-side tile stitching
 * This is a more complex approach that could be implemented if needed
 */
export function createClientSideStaticMap(
  container: HTMLElement,
  lat: number,
  lng: number,
  zoom: number = 15,
  width: number = 400,
  height: number = 192
): void {
  // Clear the container
  container.innerHTML = ''
  
  // Calculate the number of tiles needed
  const tileSize = 256
  const numTilesX = Math.ceil(width / tileSize)
  const numTilesY = Math.ceil(height / tileSize)
  
  // Calculate the center tile
  const centerX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const centerY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  
  // Create a canvas or div to hold the tiles
  const mapDiv = document.createElement('div')
  mapDiv.style.position = 'relative'
  mapDiv.style.width = `${width}px`
  mapDiv.style.height = `${height}px`
  mapDiv.style.overflow = 'hidden'
  
  // Load and position tiles
  for (let x = 0; x < numTilesX; x++) {
    for (let y = 0; y < numTilesY; y++) {
      const tileX = centerX - Math.floor(numTilesX / 2) + x
      const tileY = centerY - Math.floor(numTilesY / 2) + y
      
      const img = document.createElement('img')
      img.src = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
      img.style.position = 'absolute'
      img.style.left = `${x * tileSize}px`
      img.style.top = `${y * tileSize}px`
      img.style.width = `${tileSize}px`
      img.style.height = `${tileSize}px`
      
      mapDiv.appendChild(img)
    }
  }
  
  // Add a marker at the center
  const marker = document.createElement('div')
  marker.style.position = 'absolute'
  marker.style.left = `${width / 2 - 10}px`
  marker.style.top = `${height / 2 - 20}px`
  marker.style.width = '20px'
  marker.style.height = '20px'
  marker.style.backgroundColor = 'red'
  marker.style.borderRadius = '50%'
  marker.style.border = '2px solid white'
  marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
  marker.style.zIndex = '1000'
  
  mapDiv.appendChild(marker)
  container.appendChild(mapDiv)
}

/**
 * Calculate optimal map view that avoids grey bars by considering container aspect ratio
 */
export function calculateOptimalMapView(
  places: Array<{ coordinates: { lat: number; lng: number } }>,
  containerWidth: number,
  containerHeight: number,
  minZoom: number = 3,
  maxZoom: number = 16
): { center: [number, number]; zoom: number } {
  if (places.length === 0) {
    return { center: [40.7128, -74.006], zoom: 13 }
  }

  if (places.length === 1) {
    return {
      center: [places[0].coordinates.lat, places[0].coordinates.lng],
      zoom: 15
    }
  }

  // Calculate bounds
  const lats = places.map(place => place.coordinates.lat)
  const lngs = places.map(place => place.coordinates.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  
  // Calculate the span of coordinates
  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng
  
  // Use more conservative padding (10% on each side instead of 20%)
  const paddedLatSpan = Math.max(latSpan * 1.2, 0.01) // Minimum span to prevent over-zooming
  const paddedLngSpan = Math.max(lngSpan * 1.2, 0.01)
  
  // Calculate zoom based on the larger span, but be more conservative
  const latZoom = Math.log2(180 / paddedLatSpan) // Use 180 instead of 360 for more conservative zoom
  const lngZoom = Math.log2(360 / paddedLngSpan)
  
  // Take the more conservative (lower) zoom and apply reasonable bounds
  let zoom = Math.floor(Math.min(latZoom, lngZoom))
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom))
  
  // Apply additional constraints based on data spread
  const maxDiff = Math.max(latSpan, lngSpan)
  if (maxDiff > 10) zoom = Math.min(zoom, 5)  // Very spread out data
  else if (maxDiff > 5) zoom = Math.min(zoom, 7)   // Moderately spread out
  else if (maxDiff > 1) zoom = Math.min(zoom, 10)  // Regional spread
  else if (maxDiff > 0.1) zoom = Math.min(zoom, 13) // City-level spread
  
  return {
    center: [centerLat, centerLng],
    zoom
  }
}

/**
 * Calculate smart bounds fitting options for Leaflet maps
 */
export function calculateSmartFitBoundsOptions(
  bounds: any, // L.LatLngBounds
  containerWidth: number,
  containerHeight: number
): { padding: [number, number]; maxZoom: number } {
  // Calculate the aspect ratio of the bounds
  const boundsWidth = bounds.getEast() - bounds.getWest()
  const boundsHeight = bounds.getNorth() - bounds.getSouth()
  const boundsAspectRatio = boundsWidth / boundsHeight
  
  // Calculate container aspect ratio
  const containerAspectRatio = containerWidth / containerHeight
  
  // Use more conservative padding adjustments
  let paddingX = 40
  let paddingY = 40
  
  const aspectRatioDiff = Math.abs(boundsAspectRatio - containerAspectRatio)
  
  // Only adjust padding if there's a significant aspect ratio mismatch
  if (aspectRatioDiff > 0.5) {
    if (boundsAspectRatio > containerAspectRatio * 1.5) {
      // Bounds are much wider than container, reduce vertical padding slightly
      paddingY = Math.max(20, paddingY * 0.7)
    } else if (containerAspectRatio > boundsAspectRatio * 1.5) {
      // Container is much wider than bounds, reduce horizontal padding slightly
      paddingX = Math.max(20, paddingX * 0.7)
    }
  }
  
  // Calculate a reasonable max zoom based on bounds size
  const boundsSize = Math.max(boundsWidth, boundsHeight)
  let maxZoom = 16
  
  if (boundsSize > 10) maxZoom = 6      // Very large area
  else if (boundsSize > 5) maxZoom = 8  // Large area
  else if (boundsSize > 1) maxZoom = 12 // Medium area
  else if (boundsSize > 0.1) maxZoom = 15 // Small area
  
  return {
    padding: [paddingY, paddingX],
    maxZoom
  }
}

/**
 * Alternative approach: Calculate bounds with minimum zoom constraint
 */
export function calculateBoundsWithMinZoom(
  places: Array<{ coordinates: { lat: number; lng: number } }>,
  minZoom: number = 8,
  maxZoom: number = 16
): { center: [number, number]; zoom: number } | { bounds: any; options: any } {
  if (places.length === 0) {
    return { center: [40.7128, -74.006], zoom: 13 }
  }

  if (places.length === 1) {
    return {
      center: [places[0].coordinates.lat, places[0].coordinates.lng],
      zoom: 15
    }
  }

  // For multiple places, return bounds with constraints
  const lats = places.map(place => place.coordinates.lat)
  const lngs = places.map(place => place.coordinates.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // Create bounds object (this would be L.latLngBounds in actual usage)
  const bounds = {
    _southWest: { lat: minLat, lng: minLng },
    _northEast: { lat: maxLat, lng: maxLng }
  }
  
  return {
    bounds,
    options: {
      padding: [30, 30],
      maxZoom: Math.min(maxZoom, minZoom + 6) // Prevent too much zoom out
    }
  }
}

/**
 * Simple and reliable map view calculation (fallback approach)
 */
export function calculateSimpleMapView(
  places: Array<{ coordinates: { lat: number; lng: number } }>,
  isMobile: boolean = false
): { center: [number, number]; zoom: number } {
  if (places.length === 0) {
    return { center: [40.7128, -74.006], zoom: 13 }
  }

  if (places.length === 1) {
    return {
      center: [places[0].coordinates.lat, places[0].coordinates.lng],
      zoom: 15
    }
  }

  // Calculate bounds
  const lats = places.map(place => place.coordinates.lat)
  const lngs = places.map(place => place.coordinates.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  
  // Calculate the span of coordinates
  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng
  const maxSpan = Math.max(latSpan, lngSpan)
  
  // Simple zoom calculation based on span
  let zoom = 13
  if (maxSpan > 20) zoom = 4      // Continental
  else if (maxSpan > 10) zoom = 5  // Multi-country
  else if (maxSpan > 5) zoom = 6   // Country
  else if (maxSpan > 2) zoom = 8   // Large region
  else if (maxSpan > 1) zoom = 9   // Region
  else if (maxSpan > 0.5) zoom = 10 // Large city
  else if (maxSpan > 0.2) zoom = 11 // City
  else if (maxSpan > 0.1) zoom = 12 // City area
  else if (maxSpan > 0.05) zoom = 13 // Neighborhood
  else zoom = 14 // Local area
  
  // Adjust for mobile (slightly more zoomed out for better overview)
  if (isMobile && zoom > 10) {
    zoom = Math.max(8, zoom - 1)
  }
  
  return {
    center: [centerLat, centerLng],
    zoom
  }
}

/**
 * Simple bounds fitting with conservative padding
 */
export function calculateSimpleFitBoundsOptions(
  isMobile: boolean = false
): { padding: [number, number]; maxZoom: number } {
  const padding = isMobile ? 30 : 50
  const maxZoom = isMobile ? 14 : 16
  
  return {
    padding: [padding, padding],
    maxZoom
  }
} 