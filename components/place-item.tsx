"use client"

import { MapPin, Globe } from "lucide-react"
import Image from "next/image"
import type { Place } from "@/types/place"

interface PlaceItemProps {
  place: Place
  isSelected?: boolean
  onClick?: () => void
}

export function PlaceItem({ place, isSelected = false, onClick }: PlaceItemProps) {
  // Format the address to be more readable
  const formatAddress = (address: string) => {
    if (!address) return ""
    // If the address is too long, truncate it
    return address.length > 60 ? address.substring(0, 60) + "..." : address
  }

  // Get a placeholder image if no image is provided
  const getImageUrl = () => {
    if (place.image) return place.image
    if (place.image_url) return place.image_url
    return `/placeholder.svg?height=200&width=300&query=place ${place.name}`
  }

  return (
    <div
      className={`border border-black/10 rounded-md overflow-hidden transition-all ${
        isSelected ? "ring-2 ring-black" : "hover:border-black/30"
      }`}
      onClick={onClick}
    >
      <div className="grid grid-cols-3 md:grid-cols-4">
        <div className="col-span-1">
          <div className="aspect-square relative">
            <Image
              src={getImageUrl() || "/placeholder.svg"}
              alt={place.name}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-3 p-4">
          <h3 className="font-serif text-lg mb-1">{place.name}</h3>
          <div className="flex items-center text-sm text-black/60 mb-2">
            <MapPin size={14} className="mr-1" />
            {formatAddress(place.address)}
          </div>

          {place.notes && <p className="text-sm mb-2">{place.notes}</p>}

          {place.website && (
            <div className="flex items-center text-sm text-black/60">
              <Globe size={14} className="mr-1" />
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {new URL(place.website).hostname}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
