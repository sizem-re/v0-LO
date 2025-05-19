"use client"

import { useState } from "react"
import { ChevronLeft, Edit, Share2, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useList } from "@/hooks/use-lists"
import type { Place } from "@/types/database"

interface ListDetailsProps {
  listId: string
  onBack: () => void
  onPlaceClick: (place: Place) => void
  onAddPlace?: () => void
}

export function ListDetails({ listId, onBack, onPlaceClick, onAddPlace }: ListDetailsProps) {
  const { list, isLoading } = useList(listId)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>

            <div className="flex justify-between items-center mb-4">
              <div className="h-5 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-2 border border-black/10 rounded flex">
                  <div className="h-12 w-12 bg-gray-200 rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error || "List not found"}</p>
            <Button className="bg-black text-white hover:bg-black/80" onClick={onBack}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex gap-2">
          <button className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
            <Share2 size={16} />
          </button>
          <button className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
            <Edit size={16} />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{list.title}</h2>
          <p className="text-sm text-black/60 mb-2">
            {list.privacy === "private" ? "🔒 Private" : list.privacy === "public" ? "🌎 Public" : "🔓 Open"} •{" "}
            {list.place_count || 0} places
          </p>
          {list.description && <p className="text-sm text-black/80 mb-4">{list.description}</p>}

          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="font-medium">Places</h3>
            <Button
              className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8 flex items-center"
              onClick={onAddPlace}
            >
              <Plus size={14} className="mr-1" /> Add Place
            </Button>
          </div>

          {list.places && list.places.length > 0 ? (
            <div className="space-y-3">
              {list.places.map((place) => (
                <div
                  key={place.id}
                  className="p-2 border border-black/10 rounded hover:bg-black/5 cursor-pointer flex"
                  onClick={() => onPlaceClick(place)}
                >
                  <div
                    className="h-12 w-12 bg-gray-200 rounded mr-3"
                    style={{
                      backgroundImage: place.image_url ? `url(${place.image_url})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div>
                    <h4 className="font-medium">{place.name}</h4>
                    <div className="flex items-center text-black/60 text-xs">
                      <MapPin size={12} className="mr-1" />
                      {place.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-black/10 rounded">
              <p className="text-black/60 mb-4">No places in this list yet</p>
              <Button className="bg-black text-white hover:bg-black/80" onClick={onAddPlace}>
                <Plus size={16} className="mr-1" /> Add Your First Place
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
