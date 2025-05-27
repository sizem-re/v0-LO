import { Metadata } from "next"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

// Generate metadata for the frame
export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
      return {
        title: "List not found",
        description: "The requested list could not be found."
      }
    }
    
    const list = await response.json()
    const listTitle = list.title || "Untitled List"
    const listDescription = list.description || `A list of ${list.places?.length || 0} places`
    const ownerName = list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown"
    
    const frameImageUrl = `${baseUrl}/api/lists/${id}/frame-image`
    
    return {
      title: `${listTitle} by ${ownerName}`,
      description: listDescription,
      openGraph: {
        title: `${listTitle} by ${ownerName}`,
        description: listDescription,
        images: [frameImageUrl],
      },
      other: {
        // Farcaster Frame metadata
        "fc:frame": "vNext",
        "fc:frame:image": frameImageUrl,
        "fc:frame:image:aspect_ratio": "1.91:1",
        "fc:frame:button:1": "View List",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": `${baseUrl}/?list=${id}`,
        "fc:frame:button:2": "Open App",
        "fc:frame:button:2:action": "link", 
        "fc:frame:button:2:target": baseUrl,
      },
    }
  } catch (error) {
    console.error("Error generating frame metadata:", error)
    return {
      title: "List not found",
      description: "The requested list could not be found."
    }
  }
}

export default async function ListFramePage({ params }: Props) {
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
      notFound()
    }
    
    const list = await response.json()
    const ownerName = list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown"
    
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-serif font-bold text-gray-900">
            {list.title}
          </h1>
          
          <p className="text-lg text-gray-600">
            by {ownerName}
          </p>
          
          {list.description && (
            <p className="text-gray-700 max-w-xl mx-auto">
              {list.description}
            </p>
          )}
          
          <div className="bg-gray-50 rounded-lg p-6 inline-block">
            <p className="text-2xl font-semibold text-gray-900">
              {list.places?.length || 0} Places
            </p>
            <p className="text-gray-600">in this list</p>
          </div>
          
          <div className="space-y-4">
            <a
              href={`/?list=${id}`}
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View List
            </a>
            
            <br />
            
            <a
              href="/"
              className="inline-block text-gray-600 hover:text-gray-900 transition-colors"
            >
              Open App
            </a>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading list:", error)
    notFound()
  }
} 