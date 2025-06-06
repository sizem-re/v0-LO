import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"

interface Props {
  params: Promise<{ id: string }>
}

// Helper function to normalize URLs and avoid double slashes
function normalizeUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '') // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, '') // Remove leading slashes
  return `${cleanBase}/${cleanPath}`
}

// Function to detect if request is from a bot/crawler
function isBotRequest(userAgent: string): boolean {
  if (!userAgent) return false
  
  const botPatterns = [
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /farcaster/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /preview/i,
    /whatsapp/i,
    /telegram/i,
    /discord/i,
    /slack/i,
    /meta/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

// Generate metadata for the frame
export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
      return {
        title: 'List not found'
      }
    }

    const listData = await response.json()
    // Handle both the nested { list, places } structure and direct list structure
    const list = listData.list || listData
    const places = listData.places || []
    
    // Cache busting timestamp
    const timestamp = Date.now()
    const frameImageUrl = normalizeUrl(baseUrl, `/api/lists/${id}/frame-image?v=${timestamp}`)
    const appUrl = normalizeUrl(baseUrl, `/?list=${id}`)
    
    // Get the list name from either 'name' or 'title' property
    const listName = list.name || list.title || 'Untitled List'
    const listDescription = list.description || `Explore ${listName} on LO`
    
    // Generate frame metadata using proper Farcaster Mini App format
    const frameMetadata = {
      "version": "next",
      "imageUrl": frameImageUrl,
      "button": {
        "title": "Open in LO",
        "action": {
          "type": "launch_frame",
          "name": "LO",
          "url": appUrl,
          "splashImageUrl": frameImageUrl
        }
      }
    }
    
    return {
      title: `${listName} - LO`,
      description: listDescription,
      openGraph: {
        title: `${listName} - LO`,
        description: listDescription,
        images: [
          {
            url: frameImageUrl,
            width: 1200,
            height: 630,
            alt: `${listName} preview`
          }
        ],
        siteName: "LO",
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: `${listName} - LO`,
        description: listDescription,
        images: [frameImageUrl]
      },
      other: {
        "fc:frame": JSON.stringify(frameMetadata),
        "fc:frame:image": frameImageUrl,
        "fc:frame:button:1": "Open in LO",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": appUrl
      }
    }
  } catch (error) {
    console.error('Error generating frame metadata:', error)
    return {
      title: 'LO - Location Lists'
    }
  }
}

// Main component for the frame page
export default async function ListFramePage({ params }: Props) {
  try {
    const { id } = await params
    
    // Get user agent for bot detection FIRST
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    
    console.log(`Frame page request for ${id} with user agent:`, userAgent)
    
    // For direct visits to frame URL, redirect to the main app with list parameter
    // Only redirect if it's NOT a bot/crawler request
    if (!isBotRequest(userAgent)) {
      console.log('Non-bot request detected, redirecting to main app:', userAgent)
      redirect(`/?list=${id}`)
      return null // This won't be reached, but TypeScript needs it
    }
    
    console.log('Bot request detected, serving frame content:', userAgent)
    
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
      notFound()
    }

    const listData = await response.json()
    // Handle both the nested { list, places } structure and direct list structure
    const list = listData.list || listData
    
    // Get the list name from either 'name' or 'title' property
    const listName = list.name || list.title || 'Untitled List'
    
    // This should only render for bots/crawlers for frame metadata
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{listName}</h1>
          <p className="text-gray-600 mb-6">{list.description || 'No description available'}</p>
          <a 
            href={`/?list=${id}`}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            View List
          </a>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading list:', error)
    
    // If it's a redirect error, let it bubble up
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    notFound()
  }
} 