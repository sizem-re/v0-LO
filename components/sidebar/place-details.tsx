"use client"

import { ChevronLeft, MapPin, Globe, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlaceDetailsProps {
  place: any
  onBack: () => void
}

export function PlaceDetails({ place, onBack }: PlaceDetailsProps) {
  if (!place) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <button className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
          <Share2 size={16} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{place.name}</h2>
          <p className="text-sm text-black/70 mb-2">{place.type || "Place"}</p>

          {place.image && (
            <div
              className="w-full h-48 bg-gray-100 mb-4 rounded-md"
              style={{
                backgroundImage: `url(${place.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          <div className="space-y-3">
            {place.address && (
              <div className="flex items-start">
                <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                <p className="text-sm">{place.address}</p>
              </div>
            )}

            {place.website && (
              <div className="flex items-start">
                <Globe size={16} className="mr-2 mt-1 flex-shrink-0" />
                <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                  {place.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {place.description && <p className="text-sm mt-4">{place.description}</p>}

            <div className="pt-4">
              <Button className="w-full">ADD TO LIST</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
