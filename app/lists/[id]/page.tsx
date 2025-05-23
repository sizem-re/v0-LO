"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlaceItem } from "@/components/place-item"
import { useAuth } from "@/lib/auth-context"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"
import { useMiniApp } from "@/hooks/use-mini-app"
import { Edit, Share2, Plus, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

interface ListOwner {
  id: string
  farcaster_id?: string
  farcaster_username?: string
  farcaster_display_name?: string
  farcaster_pfp_url?: string
}

interface ListData {
  id: string
  title: string
  description: string
  visibility: string
  cover_image_url?: string
  created_at: string
  updated_at: string
  owner: ListOwner
  places: Place[]
}

// Placeholder data for testing
const PLACEHOLDER_LIST: ListData = {
  id: "placeholder-list-1",
  title: "Best Coffee Shops in Seattle",
  description: "My favorite places to grab coffee and work in Seattle",
  visibility: "public",
  cover_image_url: "/cozy-corner-cafe.png",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: {
    id: "placeholder-user-1",
    farcaster_username: "coffeeexplorer",
    farcaster_display_name: "Coffee Explorer",
    farcaster_pfp_url: "/diverse-profile-avatars.png",
  },
  places: [
    {
      id: "place-1",
      name: "Analog Coffee",
      description: "Great pour-overs and minimalist vibe",
      address: "235 Summit Ave E, Seattle, WA 98102",
      latitude: 47.6205,
      longitude: -122.3252,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: "/cozy-coffee-shop.png",
    },
    {
      id: "place-2",
      name: "Victrola Coffee Roasters",
      description: "Spacious cafe with excellent espresso",
      address: "310 E Pike St, Seattle, WA 98122",
      latitude: 47.6142,
      longitude: -122.3266,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: "/coffee-roastery.png",
    },
    {
      id: "place-3",
      name: "Storyville Coffee",
      description: "Amazing views and great pastries",
      address: "94 Pike St #34, Seattle, WA 98101",
      latitude: 47.6088,
      longitude: -122.3404,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: "/cozy-coffee-shop-view.png",
    },
  ],
}

// Flag to use placeholder data (set to false for production)
const USE_PLACEHOLDER_DATA = false

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, user } = useAuth()
  const { isMiniApp } = useMiniApp()
  const router = useRouter()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [list, setList] = useState<ListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true)
        console.log(`Fetching list with ID: ${params.id}`)

        const response = await fetch(`/api/lists/${params.id}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || response.statusText
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("List data received:", data)
        setList(data)
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchList()
    } else {
      setError("List ID is missing")
      setLoading(false)
    }
  }, [params.id])

  const handleAddPlace = () => {
    router.push(`/lists/${params.id}/add-place`)
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading list...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !list) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error || "Failed to load list"}</p>
            <Link href="/lists" className="text-red-700 underline mt-4 inline-block">
              Back to lists
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Safely check if the user is the owner
  const isOwner = isAuthenticated && user?.id && list.owner && user.id === list.owner.id

  // Get owner display name safely
  const ownerName = list.owner
    ? list.owner.farcaster_display_name || list.owner.farcaster_username || "Unknown user"
    : "Unknown user"

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/lists" className="text-sm hover:underline mb-4 inline-block">
            ← Back to lists
          </Link>

          <div className="flex justify-between items-start mt-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif mb-2">{list.title}</h1>
              <p className="text-sm text-black/70 mb-4">by {ownerName}</p>
              {list.description && <p className="text-lg max-w-2xl mb-4">{list.description}</p>}
              <p className="text-sm text-black/60">
                {new Date(list.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: list.title,
                      text: list.description || `Check out this list: ${list.title}`,
                      url: window.location.href,
                    })
                  }
                }}
              >
                <Share2 size={18} />
                Share
              </Button>

              {isOwner && (
                <Link href={`/lists/${params.id}/edit`} className="lo-button flex items-center gap-2">
                  <Edit size={18} />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-serif">Places</h2>
              {isOwner && (
                <Button onClick={handleAddPlace} className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Place
                </Button>
              )}
            </div>

            {list.places && list.places.length > 0 ? (
              <div className="space-y-8">
                {list.places.map((place) => (
                  <PlaceItem
                    key={place.id}
                    place={place}
                    isSelected={selectedPlace?.id === place.id}
                    onClick={() => setSelectedPlace(place)}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-black/10 rounded-md p-8 text-center">
                <p className="text-black/60 mb-4">No places in this list yet</p>
                {isOwner && (
                  <Button onClick={handleAddPlace}>
                    <Plus size={16} className="mr-2" />
                    Add Your First Place
                  </Button>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-serif mb-4">Map</h2>
            {list.places && list.places.length > 0 ? (
              <VanillaMap places={list.places} height="500px" onPlaceSelect={setSelectedPlace} />
            ) : (
              <div className="h-[500px] border border-black/10 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">No places to display on the map</p>
              </div>
            )}
          </div>
        </div>

        {isMiniApp && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 flex justify-center">
            <Link href="/" className="lo-button">
              Explore More Lists
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
