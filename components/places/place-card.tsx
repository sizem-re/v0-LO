"use client"

import type { Place } from "@/types/place"
import { MapPin } from "lucide-react"

interface PlaceCardProps {
  place: Place
  onClick?: (place: Place) => void
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <div
      className="p-3 border border-black/10 rounded mb-3 hover:bg-gray-50 cursor-pointer flex"
      onClick={() => onClick?.(place)}
    >
      <div
        className="h-12 w-12 bg-gray-200 rounded mr-3 flex items-center justify-center"
        style={{
          backgroundImage: place.image_url ? `url(${place.image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!place.image_url && <MapPin size={20} className="text-black/40" />}
      </div>
      <div>
        <h3 className="font-medium">{place.name}</h3>
        <p className="text-xs text-black/70">{place.address}</p>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{place.type}</span>
      </div>
    </div>
  )
}
