import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Use proper base URL for production
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   (process.env.NODE_ENV === 'production' ? 'https://llllllo.com' : 'http://localhost:3000'))
    
    // Fetch list data
    const response = await fetch(`${baseUrl}/api/lists/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      // Return a fallback image for not found
      const errorImageUrl = `https://via.placeholder.com/1200x630/f3f4f6/374151?text=${encodeURIComponent('List Not Found')}`
      return NextResponse.redirect(errorImageUrl)
    }

    const list = await response.json()
    const listTitle = list.title || "Untitled List"
    const ownerName = list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown"
    
    // Generate static map image URL if we have places with coordinates
    let mapImageUrl = null
    if (list.places && list.places.length > 0) {
      const validPlaces = list.places.filter((place: any) => 
        place.coordinates && 
        place.coordinates.lat && 
        place.coordinates.lng &&
        place.coordinates.lat !== 0 &&
        place.coordinates.lng !== 0
      )
      
      if (validPlaces.length > 0) {
        // Try OpenStreetMap static maps first (free alternative)
        try {
          // Calculate center point (simple average)
          const avgLat = validPlaces.reduce((sum: number, place: any) => sum + place.coordinates.lat, 0) / validPlaces.length
          const avgLng = validPlaces.reduce((sum: number, place: any) => sum + place.coordinates.lng, 0) / validPlaces.length
          
          // Determine zoom level based on number of places
          let zoom = 12
          if (validPlaces.length === 1) zoom = 15
          else if (validPlaces.length <= 3) zoom = 13
          else if (validPlaces.length > 10) zoom = 10
          
          // Option 1: Try MapQuest Open Static Maps (based on OpenStreetMap)
          // Create a simple marker list for MapQuest format
          const markers = validPlaces.slice(0, 10).map((place: any, index: number) => 
            `${place.coordinates.lat},${place.coordinates.lng}`
          ).join('|')
          
          // MapQuest Open Static Maps API (free for basic usage)
          mapImageUrl = `https://open.mapquestapi.com/staticmap/v5/map?` +
            `center=${avgLat},${avgLng}&` +
            `zoom=${zoom}&` +
            `size=1200,630&` +
            `type=map&` +
            `locations=${markers}&` +
            `format=png`
          
          // Alternative: Use Stadia Maps (has a free tier)
          // This is commented out but available as backup
          /*
          mapImageUrl = `https://tiles.stadiamaps.com/static/stamen_terrain/` +
            `${avgLng},${avgLat},${zoom}/` +
            `1200x630.png`
          */
          
        } catch (error) {
          console.log('OpenStreetMap static map generation failed:', error)
        }
        
        // Fallback to Google Maps if available and OSM failed
        if (!mapImageUrl) {
          const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
          if (googleApiKey) {
            // Create markers for each place
            const markers = validPlaces.slice(0, 10).map((place: any, index: number) => 
              `markers=color:red%7Clabel:${index + 1}%7C${place.coordinates.lat},${place.coordinates.lng}`
            ).join('&')
            
            // Calculate center point (simple average)
            const avgLat = validPlaces.reduce((sum: number, place: any) => sum + place.coordinates.lat, 0) / validPlaces.length
            const avgLng = validPlaces.reduce((sum: number, place: any) => sum + place.coordinates.lng, 0) / validPlaces.length
            
            // Determine zoom level based on number of places
            let zoom = 12
            if (validPlaces.length === 1) zoom = 15
            else if (validPlaces.length <= 3) zoom = 13
            else if (validPlaces.length > 10) zoom = 10
            
            // Generate static map URL
            mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
              `center=${avgLat},${avgLng}&` +
              `zoom=${zoom}&` +
              `size=1200x630&` +
              `maptype=roadmap&` +
              `${markers}&` +
              `key=${googleApiKey}`
          }
        }
      }
    }
    
    // Test if the map image is available
    if (mapImageUrl) {
      try {
        const mapResponse = await fetch(mapImageUrl, { method: 'HEAD' })
        if (mapResponse.ok) {
          return NextResponse.redirect(mapImageUrl)
        }
      } catch (error) {
        console.log('Map API not available, falling back to placeholder')
      }
    }
    
    // Create an informative fallback image with list details
    const placeCount = list.places?.length || 0
    const hasPlaces = placeCount > 0
    
    let fallbackText = `${listTitle}`
    if (ownerName && ownerName !== 'Unknown') {
      fallbackText += ` by ${ownerName}`
    }
    if (hasPlaces) {
      fallbackText += ` · ${placeCount} place${placeCount !== 1 ? 's' : ''}`
    }
    
    // Truncate if too long for the image
    if (fallbackText.length > 60) {
      fallbackText = fallbackText.substring(0, 57) + '...'
    }
    
    const fallbackImageUrl = `https://via.placeholder.com/1200x630/667eea/ffffff?text=${encodeURIComponent(fallbackText)}`
    
    return NextResponse.redirect(fallbackImageUrl)
    
  } catch (error) {
    console.error('Error generating frame image:', error)
    
    // Return a simple error image
    const errorImageUrl = `https://via.placeholder.com/1200x630/f3f4f6/374151?text=${encodeURIComponent('Error Loading List')}`
    return NextResponse.redirect(errorImageUrl)
  }
} 