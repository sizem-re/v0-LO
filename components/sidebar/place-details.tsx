"use client"

import { ChevronLeft } from "lucide-react"
import type { Place } from "@/types/place"

interface PlaceDetailsProps {
  place: Place | any
  onBack: () => void
}

export function PlaceDetails({ place, onBack }: PlaceDetailsProps) {
  // Ensure we have valid place data with fallbacks for all fields
  const safePlace = {
    id: place?.id || "unknown",
    name: place?.name || "Unknown Place",
    address: place?.address || "Address not available",
    coordinates: place?.coordinates || { lat: 47.6062, lng: -122.3321 },
    type: place?.type || "Place",
    description: place?.description || "",
    image: place?.image || null,
    website: place?.website || null,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-medium mb-2">{safePlace.name}</h2>
        <p className="text-sm text-gray-600 mb-3">{safePlace.address}</p>

        {safePlace.type && (
          <div className="mb-3">
            <span className="inline-block bg-gray-100 px-2 py-1 text-xs rounded">{safePlace.type}</span>
          </div>
        )}

        {safePlace.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">About</h3>
            <p className="text-sm">{safePlace.description}</p>
          </div>
        )}

        {safePlace.website && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Website</h3>
            <a
              href={safePlace.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {safePlace.website}
            </a>
          </div>
        )}

        {safePlace.image && (
          <div className="mb-4">
            <img
              src={safePlace.image || "/placeholder.svg"}
              alt={safePlace.name}
              className="w-full h-48 object-cover rounded"
            />
          </div>
        )}
      </div>
    </div>
  )
}
