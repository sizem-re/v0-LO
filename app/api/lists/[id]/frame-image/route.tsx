import { NextRequest, NextResponse } from 'next/server'

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
    
    baseUrl = baseUrl.replace(/\/+$/, '') // Remove any trailing slashes
    
    // Fetch list data
    const response = await fetch(normalizeUrl(baseUrl, `/api/lists/${id}`), {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      // Return simple error SVG
      const errorSvg = `
        <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="630" fill="#f3f4f6"/>
          <text x="600" y="315" text-anchor="middle" font-family="Arial" font-size="32" fill="#374151">
            List not found
          </text>
        </svg>
      `
      return new NextResponse(errorSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      })
    }
    
    const list = await response.json()
    
    // Create clean text values
    const title = (list.title || 'Untitled List').substring(0, 40)
    const description = (list.description || '').substring(0, 80)
    const placeCount = list.places?.length || 0
    const ownerName = (list.owner?.farcaster_display_name || 'Unknown').substring(0, 20)
    
    console.log('Frame Image Generation: The SVG frame image is generating correctly with list information')
    
    // Generate SVG frame image
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="1200" height="630" fill="#ffffff"/>
        
        <!-- Header bar -->
        <rect width="1200" height="80" fill="#000000"/>
        <text x="60" y="50" font-family="serif" font-size="36" font-weight="bold" fill="#ffffff">LO</text>
        
        <!-- Main content -->
        <text x="60" y="180" font-family="Arial" font-size="48" font-weight="bold" fill="#000000">
          ${title}
        </text>
        
        <text x="60" y="240" font-family="Arial" font-size="24" fill="#666666">
          by ${ownerName}
        </text>
        
        <text x="60" y="320" font-family="Arial" font-size="20" fill="#333333">
          ${description}
        </text>
        
        <!-- Place count -->
        <rect x="60" y="380" width="200" height="80" fill="#f3f4f6" stroke="#e5e7eb"/>
        <text x="160" y="415" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="#000000">
          ${placeCount}
        </text>
        <text x="160" y="440" text-anchor="middle" font-family="Arial" font-size="16" fill="#666666">
          Places
        </text>
        
        <!-- Footer -->
        <text x="60" y="580" font-family="Arial" font-size="18" fill="#999999">
          Open in LO to explore this list
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
    
  } catch (error) {
    console.error('Error in frame image route:', error)
    
    // Return fallback SVG
    const fallbackSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#f3f4f6"/>
        <text x="600" y="315" text-anchor="middle" font-family="Arial" font-size="32" fill="#374151">
          LO - Location Lists
        </text>
      </svg>
    `
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    })
  }
} 