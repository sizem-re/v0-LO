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
    
    // Clean any trailing slashes
    baseUrl = baseUrl.replace(/\/+$/, '')
    
    // Fetch list data
    const response = await fetch(normalizeUrl(baseUrl, `/api/lists/${id}`), {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      // Return simple error image
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'linear-gradient(180deg, #fff, #f0f0f0)',
              fontSize: 60,
              fontWeight: 700,
              color: '#ef4444',
            }}
          >
            List Not Found
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    }
    
    const listData = await response.json()
    // Handle both the nested { list, places } structure and direct list structure
    const list = listData.list || listData
    const places = listData.places || []
    
    // Get the list name from either 'name' or 'title' property
    const listName = list.name || list.title || 'Untitled List'
    
    console.log('Frame Image Generation: Creating PNG image for list:', listName)
    
    // Generate simple PNG image using ImageResponse
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            backgroundImage: 'linear-gradient(180deg, #fff, #f8fafc)',
            padding: '60px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              fontWeight: 600,
              color: '#1f2937',
              marginBottom: '40px',
            }}
          >
            🗺️ LO
          </div>
          
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 800,
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '30px',
              maxWidth: '900px',
            }}
          >
            {listName}
          </div>
          
          {list.description && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                color: '#6b7280',
                textAlign: 'center',
                maxWidth: '800px',
                marginBottom: '20px',
              }}
            >
              {list.description.length > 100 
                ? list.description.substring(0, 100) + '...' 
                : list.description}
            </div>
          )}
          
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: '#9ca3af',
              backgroundColor: '#f3f4f6',
              padding: '12px 24px',
              borderRadius: '12px',
            }}
          >
            {places?.length || 0} places
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
    
  } catch (error) {
    console.error('Error in frame image route:', error)
    
    // Return simple fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(180deg, #fff, #f0f0f0)',
            fontSize: 60,
            fontWeight: 700,
            color: '#ef4444',
          }}
        >
          Error
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
} 