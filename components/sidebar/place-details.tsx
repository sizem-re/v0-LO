"use client"

import { useState } from "react"
import { ChevronLeft, Globe, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToListDialog } from "@/components/add-to-list-dialog"
import { usePlace } from "@/hooks/use-places"

interface PlaceDetailsProps {
  placeId: string
  onBack: () => void
  onListClick?: (listId: string) => void
}

export function PlaceDetails({ placeId, onBack, onListClick }: PlaceDetailsProps) {
  const { place, isLoading, error } = usePlace(placeId)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <div className="animate-pulse">
            <div className="h-40 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>

            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !place) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b border-black/10">
          <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error || "Place not found"}</p>
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
      <div className="flex items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          {place.image_url && (
            <div
              className="h-40 bg-gray-200 rounded-md mb-4"
              style={{
                backgroundImage: `url(${place.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          )}

          <h2 className="text-xl font-serif mb-1">{place.name}</h2>
          <p className="text-sm text-black/70 mb-4">{place.type}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-black/60 mr-2 mt-0.5" />
              <div>
                <p className="text-sm">{place.address}</p>
                <p className="text-xs text-black/60 mt-1">
                  {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {place.website && (
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-black/60 mr-2" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {place.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>

          {place.description && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-2">Description:</h3>
              <p className="text-sm">{place.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">On these lists:</h3>
            <div className="flex flex-wrap gap-2">
              {place.lists && place.lists.length > 0 ? (
                <>
                  {place.lists.map((list) => (
                    <button
                      key={list.id}
                      className="bg-gray-100 px-2 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors"
                      onClick={() => onListClick && onListClick(list.id)}
                    >
                      {list.title}
                    </button>
                  ))}
                  <button
                    className="bg-black/5 text-black px-2 py-1 rounded-full text-xs flex items-center hover:bg-black/10 transition-colors"
                    onClick={() => setShowAddToListDialog(true)}
                  >
                    <Plus size={12} className="mr-1" /> Add to list
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <p className="text-sm text-black/60 mb-2">This place isn't on any lists yet.</p>
                  <Button
                    className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8"
                    onClick={() => setShowAddToListDialog(true)}
                  >
                    <Plus size={14} className="mr-1" /> Add to list
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddToListDialog && (
        <AddToListDialog place={{ id: place.id, name: place.name }} onClose={() => setShowAddToListDialog(false)} />
      )}
    </div>
  )
}
