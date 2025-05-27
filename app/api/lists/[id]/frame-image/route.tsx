import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Helper function to normalize URLs and avoid double slashes
function normalizeUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '') // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, '') // Remove leading slashes
  return `${cleanBase}/${cleanPath}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Use proper base URL for production - ensure no trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  (process.env.NODE_ENV === 'production' ? 'https://llllllo.com' : 'http://localhost:3000'))
    
    // Normalize base URL to avoid trailing slashes
    baseUrl = baseUrl.replace(/\/+$/, '')
    
    // Fetch list data from our API
    const listApiUrl = normalizeUrl(baseUrl, `/api/lists/${id}`)
    console.log('Frame Image: Fetching list data from:', listApiUrl)
    
    const response = await fetch(listApiUrl, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.error('Frame Image: Failed to fetch list data:', response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const listData = await response.json()
    
    // The API returns the list data directly with places as a property
    const listTitle = listData?.title || listData?.name || 'Untitled List'
    const listDescription = listData?.description || ''
    const ownerName = listData?.owner?.farcaster_display_name || listData?.owner?.farcaster_username || 'Unknown'
    const placeCount = listData?.places?.length || 0
    const places = listData?.places || []
    
    console.log('Frame Image Generation: Creating PNG image for list:', listTitle)
    
    // Get first few place names for preview
    const placePreview = places.slice(0, 3).map((place: any) => place.name).filter(Boolean)
    
    // Generate PNG image using ImageResponse with simplified, faster design
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            background: '#1e40af',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '40px 60px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' }}>
              <div style={{ marginRight: '12px', display: 'flex' }}>📍</div>
              <div style={{ display: 'flex' }}>LO</div>
            </div>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              {placeCount} {placeCount === 1 ? 'place' : 'places'}
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
              padding: '0 60px',
            }}
          >
            {/* Title */}
            <div
              style={{
                display: 'flex',
                fontSize: listTitle.length > 40 ? '36px' : '48px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: 'white',
                lineHeight: 1.2,
                textAlign: 'center',
                maxWidth: '900px',
              }}
            >
              {listTitle.length > 50 ? `${listTitle.substring(0, 50)}...` : listTitle}
            </div>

            {/* Description */}
            {listDescription && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '20px',
                  opacity: 0.9,
                  marginBottom: '24px',
                  lineHeight: 1.4,
                  maxWidth: '700px',
                  textAlign: 'center',
                }}
              >
                {listDescription.length > 80 ? `${listDescription.substring(0, 80)}...` : listDescription}
              </div>
            )}

            {/* Simple place count info */}
            <div
              style={{
                display: 'flex',
                fontSize: '18px',
                opacity: 0.8,
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {placeCount} curated places by {ownerName}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              background: 'rgba(0,0,0,0.2)',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Tap to explore → llllllo.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  } catch (error) {
    console.error('Error in frame image route:', error)
    
    // Fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
            📍 LO
          </div>
          <div style={{ display: 'flex', fontSize: '24px', opacity: 0.9 }}>
            Error loading list
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
} 