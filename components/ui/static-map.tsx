"use client"

/**
 * StaticMap Component
 * 
 * A React component that renders a static map using OpenStreetMap tiles.
 * Used as a placeholder image for places without photos in the sidebar place detail view.
 * 
 * Features:
 * - Renders multiple map tiles to create a seamless map view
 * - Shows a red marker at the specified coordinates
 * - Displays a 0.25 mile radius view (zoom level 15)
 * - Includes OpenStreetMap attribution for compliance
 * - Handles loading states and errors gracefully
 * - Rate limits tile requests to be respectful to OSM servers
 */

import { useState, useEffect, useRef } from "react"
import { MapPin } from "lucide-react"

interface StaticMapProps {
  lat: number
  lng: number
  width?: number
  height?: number
  zoom?: number
  className?: string
}

export function StaticMap({ 
  lat, 
  lng, 
  width = 400, 
  height = 192, 
  zoom = 15,
  className = ""
}: StaticMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.innerHTML = '' // Clear previous content
    setIsLoading(true)
    setHasError(false)

    // Add a small delay to avoid overwhelming the tile server
    const timeout = setTimeout(() => {
      try {
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setHasError(true)
          setIsLoading(false)
          return
        }

        // Calculate the tile coordinates for the center point
        const centerTileX = (lng + 180) / 360 * Math.pow(2, zoom)
        const centerTileY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)

        // Calculate how many tiles we need
        const tileSize = 256
        const tilesX = Math.ceil(width / tileSize) + 1
        const tilesY = Math.ceil(height / tileSize) + 1

        // Create the map container
        const mapDiv = document.createElement('div')
        mapDiv.style.position = 'relative'
        mapDiv.style.width = `${width}px`
        mapDiv.style.height = `${height}px`
        mapDiv.style.overflow = 'hidden'
        mapDiv.style.background = '#f3f4f6'

        // Calculate the offset to center the map
        const offsetX = (centerTileX - Math.floor(centerTileX)) * tileSize
        const offsetY = (centerTileY - Math.floor(centerTileY)) * tileSize

        let loadedTiles = 0
        let totalTiles = 0
        let hasErrors = false

        // Load tiles around the center
        for (let x = -Math.floor(tilesX / 2); x <= Math.floor(tilesX / 2); x++) {
          for (let y = -Math.floor(tilesY / 2); y <= Math.floor(tilesY / 2); y++) {
            const tileX = Math.floor(centerTileX) + x
            const tileY = Math.floor(centerTileY) + y

            // Skip invalid tiles
            if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, zoom) || tileY >= Math.pow(2, zoom)) {
              continue
            }

            totalTiles++

            const img = document.createElement('img')
            img.style.position = 'absolute'
            img.style.left = `${(x * tileSize) + (width / 2) - offsetX}px`
            img.style.top = `${(y * tileSize) + (height / 2) - offsetY}px`
            img.style.width = `${tileSize}px`
            img.style.height = `${tileSize}px`
            img.style.border = 'none'
            img.style.display = 'block'

            img.onload = () => {
              loadedTiles++
              if (loadedTiles === totalTiles) {
                setIsLoading(false)
                if (hasErrors) {
                  setHasError(true)
                }
              }
            }

            img.onerror = () => {
              loadedTiles++
              hasErrors = true
              if (loadedTiles === totalTiles) {
                setIsLoading(false)
                setHasError(true)
              }
            }

            // Add some random delay to avoid overwhelming the server
            setTimeout(() => {
              img.src = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
            }, Math.random() * 100)
            
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
        marker.style.backgroundColor = '#ef4444'
        marker.style.borderRadius = '50% 50% 50% 0'
        marker.style.border = '2px solid white'
        marker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
        marker.style.transform = 'rotate(-45deg)'
        marker.style.zIndex = '1000'

        // Add a white dot in the center of the marker
        const markerDot = document.createElement('div')
        markerDot.style.position = 'absolute'
        markerDot.style.top = '4px'
        markerDot.style.left = '4px'
        markerDot.style.width = '8px'
        markerDot.style.height = '8px'
        markerDot.style.backgroundColor = 'white'
        markerDot.style.borderRadius = '50%'
        markerDot.style.transform = 'rotate(45deg)'
        marker.appendChild(markerDot)

        mapDiv.appendChild(marker)
        container.appendChild(mapDiv)

        // If no tiles, show error
        if (totalTiles === 0) {
          setHasError(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error creating static map:', error)
        setHasError(true)
        setIsLoading(false)
      }
    }, 100) // Small delay to avoid overwhelming tile servers

    return () => clearTimeout(timeout)
  }, [lat, lng, width, height, zoom])

  if (hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <MapPin size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Map unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        Map View
      </div>
      <div className="absolute bottom-2 left-2 bg-white/80 text-gray-700 text-xs px-1 py-0.5 rounded">
        © OpenStreetMap
      </div>
    </div>
  )
} 