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
    
    // Normalize base URL (remove trailing slash)
    baseUrl = baseUrl.replace(/\/+$/, '')
    
    // Fetch list data
    const response = await fetch(normalizeUrl(baseUrl, `/api/lists/${id}`), {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      // Return simple error SVG
      const errorSvg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#errorGrad)"/>
          <text x="600" y="300" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">📍</text>
          <text x="600" y="380" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold">List Not Found</text>
        </svg>
      `
      
      return new NextResponse(errorSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }

    const list = await response.json()
    const listTitle = (list.title || "Untitled List").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const ownerName = (list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const placeCount = list.places?.length || 0
    
    // Generate SVG frame image
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        
        <!-- Main content container -->
        <rect x="100" y="100" width="1000" height="430" rx="24" fill="rgba(255,255,255,0.95)" stroke="none" filter="drop-shadow(0 25px 50px rgba(0,0,0,0.25))"/>
        
        <!-- Location icon -->
        <text x="600" y="200" text-anchor="middle" fill="#1f2937" font-family="Arial, sans-serif" font-size="80">📍</text>
        
        <!-- List title -->
        <text x="600" y="280" text-anchor="middle" fill="#1f2937" font-family="Arial, sans-serif" font-size="48" font-weight="bold">${listTitle}</text>
        
        <!-- Owner name -->
        <text x="600" y="330" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="24">by ${ownerName}</text>
        
        <!-- Place count badge -->
        <rect x="450" y="370" width="300" height="60" rx="16" fill="#667eea"/>
        <text x="600" y="410" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">${placeCount} ${placeCount === 1 ? 'Place' : 'Places'}</text>
        
        <!-- App branding -->
        <text x="1150" y="610" text-anchor="end" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="18" font-weight="500">LO</text>
      </svg>
    `
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    })
    
  } catch (error) {
    console.error('Error generating frame image:', error)
    
    // Return simple error SVG
    const errorSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ef4444"/>
        <text x="600" y="300" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">📍</text>
        <text x="600" y="380" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold">Error Loading List</text>
      </svg>
    `
    
    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    })
  }
} 