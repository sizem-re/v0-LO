"use client"

import { useState } from "react"
import Link from "next/link"
import { PlaceItem } from "@/components/place-item"
import { useAuth } from "@/lib/auth-context"
import dynamic from "next/dynamic"
import type { Place } from "@/types/place"
import { useMiniApp } from "@/hooks/use-mini-app"
import { Edit, Share2 } from "lucide-react"
import { LinkPreviewCard } from "@/components/link-preview-card"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

// Mock data for a list
const mockList = {
  id: "1",
  title: "BEST (HIDDEN) FOOD IN TACOMA",
  author: "taylorbenthero.eth",
  description: "Some of my favorite restaurants in tacoma, nothing polished, just good honest food when your hungry.",
  timestamp: "Posted 5m ago",
  places: [
    {
      id: "p1",
      name: "The Fish House Cafe",
      type: "Restaurant",
      address: "1814 Martin Luther King Jr Way, Tacoma, WA 98405",
      coordinates: { lat: 47.2529, lng: -122.4443 },
      description: "No-frills spot for fried seafood & soul food sides in a tiny, counter-serve setting.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "p2",
      name: "Vien Dong",
      type: "Vietnamese Restaurant",
      address: "3801 Yakima Ave, Tacoma, WA 98418",
      coordinates: { lat: 47.2209, lng: -122.4634 },
      description: "Casual Vietnamese spot serving pho, rice plates & other traditional dishes in a simple setting.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "p3",
      name: "Burger Seoul",
      type: "Korean Fusion",
      address: "1750 S Prospect St, Tacoma, WA 98405",
      coordinates: { lat: 47.241, lng: -122.4556 },
      description: "Korean-inspired burgers and sides with unique flavors.",
      image: "/placeholder.svg?height=200&width=300",
    },
  ],
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the list data based on params.id
  const { isAuthenticated } = useAuth()
  const { isMiniApp } = useMiniApp()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/lists" className="text-sm hover:underline mb-4 inline-block">
          ← Back to lists
        </Link>

        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">{mockList.title}</h1>
            <p className="text-sm text-black/70 mb-4">by {mockList.author}</p>
            <p className="text-lg max-w-2xl mb-4">{mockList.description}</p>
            <p className="text-sm text-black/60">Posted 5m ago</p>
          </div>

          {isAuthenticated && (
            <div className="flex gap-2">
              <button className="lo-button flex items-center gap-2">
                <Share2 size={18} />
                Share
              </button>
              <Link href={`/lists/${params.id}/edit`} className="lo-button flex items-center gap-2">
                <Edit size={18} />
                Edit
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-serif mb-4">Places</h2>
          <div className="space-y-8">
            {mockList.places.map((place) => (
              <PlaceItem
                key={place.id}
                place={place}
                isSelected={selectedPlace?.id === place.id}
                onClick={() => setSelectedPlace(place)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif mb-4">Map</h2>
          <VanillaMap places={mockList.places} height="500px" onPlaceSelect={setSelectedPlace} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-serif mb-4">Related Lists</h2>
        <div className="space-y-4">
          <LinkPreviewCard
            title="More Places in Tacoma"
            description="Discover more hidden gems and local favorites in the Tacoma area."
            url="/lists/2"
          />
          <LinkPreviewCard
            title="Best Coffee Shops"
            description="A curated collection of the best places to get your caffeine fix."
            url="/lists/3"
          />
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
  )
}
