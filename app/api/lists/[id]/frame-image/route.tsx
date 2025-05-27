import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch list data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/lists/${params.id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return new ImageResponse(
        (
          <div
            style={{
              background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'system-ui',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 48, color: '#374151', margin: 0 }}>
                List Not Found
              </h1>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    }

    const list = await response.json()
    const listTitle = list.title || "Untitled List"
    const listDescription = list.description || ""
    const placeCount = list.places?.length || 0
    const ownerName = list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown"
    
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            fontFamily: 'system-ui',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          
          {/* Content */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '900px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* List Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#1f2937',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ffffff',
                  borderRadius: '8px',
                }}
              />
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 16px 0',
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              {listTitle}
            </h1>
            
            {/* Owner */}
            <p
              style={{
                fontSize: '28px',
                color: '#6b7280',
                margin: '0 0 24px 0',
              }}
            >
              by {ownerName}
            </p>
            
            {/* Description */}
            {listDescription && (
              <p
                style={{
                  fontSize: '24px',
                  color: '#4b5563',
                  margin: '0 0 32px 0',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                {listDescription.length > 120 
                  ? listDescription.substring(0, 120) + '...' 
                  : listDescription}
              </p>
            )}
            
            {/* Place Count */}
            <div
              style={{
                background: '#f3f4f6',
                borderRadius: '16px',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                }}
              >
                {placeCount}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: '#6b7280',
                }}
              >
                {placeCount === 1 ? 'place' : 'places'}
              </div>
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
    console.error('Error generating frame image:', error)
    
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 48, color: '#374151', margin: 0 }}>
              Error Loading List
            </h1>
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