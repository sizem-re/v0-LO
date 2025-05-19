"use client"

import { ChevronLeft, Edit, Share2, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ListDetailsProps {
  list: any
  places: any[]
  onBack: () => void
  onPlaceClick: (place: any) => void
}

export function ListDetails({ list, places, onBack, onPlaceClick }: ListDetailsProps) {
  if (!list) return null

  // Filter places that belong to this list
  const listPlaces = places.filter((place) => place.lists.includes(list.name || list.title))

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
          <h2 className="font-serif text-xl mb-1">{list.name || list.title}</h2>
          <p className="text-sm text-black/60 mb-2">
            by {list.author || "you"} • {list.count || list.placeCount} places
          </p>
          {list.description && <p className="text-sm text-black/80 mb-4">{list.description}</p>}

          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="font-medium">Places</h3>
            <Button className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8 flex items-center">
              <Plus size={14} className="mr-1" /> Add Place
            </Button>
          </div>

          {listPlaces.length > 0 ? (
            <div className="space-y-3">
              {listPlaces.map((place) => (
                <div
                  key={place.id}
                  className="p-2 border border-black/10 rounded hover:bg-black/5 cursor-pointer flex"
                  onClick={() => onPlaceClick(place)}
                >
                  <div
                    className="h-12 w-12 bg-gray-200 rounded mr-3"
                    style={{
                      backgroundImage: `url(${place.image})`,
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
              <Button className="bg-black text-white hover:bg-black/80">
                <Plus size={16} className="mr-1" /> Add Your First Place
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
