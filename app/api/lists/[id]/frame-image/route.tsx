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
      // Return error image
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundImage: 'linear-gradient(180deg, #fff, #f0f0f0)',
              fontSize: 60,
              letterSpacing: -2,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#ef4444' }}>List Not Found</div>
            <div style={{ fontSize: 30, color: '#6b7280', marginTop: 20 }}>
              The requested list could not be loaded
            </div>
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
    
    // Generate PNG image using ImageResponse
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundImage: 'linear-gradient(180deg, #fff, #f8fafc)',
            fontSize: 60,
            letterSpacing: -2,
            fontWeight: 700,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 60,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ 
              fontSize: 32, 
              fontWeight: 600, 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
            }}>
              🗺️ LO
            </div>
            <div style={{ 
              fontSize: 24, 
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '12px',
            }}>
              {places?.length || 0} places
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 40,
              maxWidth: 1000,
              padding: '0 60px',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                background: 'linear-gradient(90deg, #1f2937 0%, #374151 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.1,
                marginBottom: 30,
                textAlign: 'center',
              }}
            >
              {listName}
            </div>
            
            {list.description && (
              <div
                style={{
                  fontSize: 28,
                  color: '#6b7280',
                  lineHeight: 1.4,
                  textAlign: 'center',
                  maxWidth: 800,
                }}
              >
                {list.description.length > 120 
                  ? list.description.substring(0, 120) + '...' 
                  : list.description}
              </div>
            )}
            
            {list.farcaster_display_name && (
              <div
                style={{
                  fontSize: 22,
                  color: '#9ca3af',
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                by {list.farcaster_display_name}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 60,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ 
              fontSize: 20, 
              color: '#9ca3af',
              backgroundColor: '#f9fafb',
              padding: '12px 24px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
            }}>
              Tap to explore this curated list
            </div>
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
    
    // Return fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundImage: 'linear-gradient(180deg, #fff, #f0f0f0)',
            fontSize: 60,
            letterSpacing: -2,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#ef4444' }}>Error</div>
          <div style={{ fontSize: 30, color: '#6b7280', marginTop: 20 }}>
            Could not generate frame image
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