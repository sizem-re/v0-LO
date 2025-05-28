"use client"

import { MapPin, Globe, Calendar } from "lucide-react"
import Link from "next/link"
import type { Place } from "@/types/place"

interface PlaceItemProps {
  place: Place
  isSelected?: boolean
  onClick?: () => void
}

export function PlaceItem({ place, isSelected = false, onClick }: PlaceItemProps) {
  if (!place) {
    return null
  }

  const formattedDate = place.addedAt
    ? new Date(place.addedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <div
      className={`border ${
        isSelected ? "border-black" : "border-black/10"
      } p-4 rounded-md cursor-pointer hover:border-black/30 transition-colors`}
      onClick={onClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div
            className="aspect-[4/3] bg-gray-100 rounded-md"
            style={{
              backgroundImage: place.image_url ? `url(${place.image_url})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
        <div className="md:col-span-2">
          <Link href={`/places/${place.id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-1 hover:underline">{place.name || "Unnamed Place"}</h3>
          </Link>
          <p className="text-sm text-black/70 mb-2">{place.type || "Place"}</p>

          {place.address && (
            <div className="flex items-center text-sm text-black/60 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{place.address}</span>
            </div>
          )}

          {place.website && (
            <div className="flex items-center text-sm text-black/60 mb-2">
              <Globe className="h-4 w-4 mr-1" />
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {place.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center text-sm text-black/60 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Added {formattedDate}</span>
            </div>
          )}

          {place.notes && <p className="mt-2 text-sm border-t border-black/10 pt-2">{place.notes}</p>}
        </div>
      </div>
    </div>
  )
}
