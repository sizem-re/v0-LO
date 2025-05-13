"use client"

import dynamic from "next/dynamic"
import type { Place } from "@/types/place"

// Mock data for places on the discover map
const DISCOVER_PLACES: Place[] = [
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
    id: "p6",
    name: "Pike Place Market",
    type: "Market",
    address: "85 Pike St, Seattle, WA 98101",
    coordinates: { lat: 47.6097, lng: -122.3422 },
    description: "Famous public market overlooking the Elliott Bay waterfront in Seattle.",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "p7",
    name: "Space Needle",
    type: "Landmark",
    address: "400 Broad St, Seattle, WA 98109",
    coordinates: { lat: 47.6205, lng: -122.3493 },
    description: "Iconic observation tower in Seattle.",
    image: "/placeholder.svg?height=200&width=300",
  },
]

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export function DiscoverMap() {
  return <VanillaMap places={DISCOVER_PLACES} height="600px" />
}
