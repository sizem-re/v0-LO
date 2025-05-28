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