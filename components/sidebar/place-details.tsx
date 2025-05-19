"use client"

import { ChevronLeft, Plus, MapPin, Globe, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AddToListDialog } from "@/components/add-to-list-dialog"

interface PlaceDetailsProps {
  place: any
  onBack: () => void
}

export function PlaceDetails({ place, onBack }: PlaceDetailsProps) {
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)

  if (!place) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <button className="text-black/70 hover:text-black hover:bg-black/5 p-1 rounded">
          <Edit size={16} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div
          className="h-48 bg-gray-200 relative"
          style={{
            backgroundImage: `url(${place.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 cursor-pointer hover:bg-gray-100">
            <Plus size={16} />
          </div>
          <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs">{place.photos} photos</div>
        </div>

        <div className="p-4">
          <h2 className="font-serif text-xl mb-1">{place.name}</h2>
          <div className="flex items-center text-black/60 text-sm mb-4">
            <MapPin size={14} className="mr-1" />
            {place.address}
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">On these lists:</h3>
            <div className="flex flex-wrap gap-2">
              {place.lists.map((list: string, idx: number) => (
                <button
                  key={idx}
                  className="bg-gray-100 px-2 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                  onClick={() => {
                    // Navigate to list or show list details
                    console.log(`Navigating to list: ${list}`)
                    // You can replace this with actual navigation logic
                    // For example: router.push(`/lists/${listId}`)
                  }}
                >
                  {list}
                </button>
              ))}
              <button
                className="bg-black/5 text-black px-2 py-1 rounded-full text-xs flex items-center hover:bg-black/10 transition-colors"
                onClick={() => setShowAddToListDialog(true)}
              >
                <Plus size={12} className="mr-1" /> Add to list
              </button>
            </div>
          </div>

          {place.description && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-2">About:</h3>
              <p className="text-sm text-black/80">{place.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Location:</h3>
            <div className="h-40 bg-gray-200 rounded-md flex items-center justify-center">
              <p className="text-black/60">Map preview</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-black text-white hover:bg-black/80 w-full">
              <MapPin size={16} className="mr-2" /> Get Directions
            </Button>
            {place.website && (
              <Button className="bg-transparent text-black border border-black/20 hover:bg-black/5">
                <Globe size={16} className="mr-2" /> Website
              </Button>
            )}
          </div>
        </div>
      </div>
      {showAddToListDialog && (
        <AddToListDialog
          open={showAddToListDialog}
          onOpenChange={setShowAddToListDialog}
          place={place}
          lists={[
            { id: "1", title: "Favorite Places", description: "", privacy: "private", placeCount: 5, author: "You" },
            { id: "2", title: "Want to Visit", description: "", privacy: "private", placeCount: 3, author: "You" },
          ]}
          onCreateList={() => {
            // Handle create list action
            console.log("Create new list")
            setShowAddToListDialog(false)
            // You can add navigation to create list page or open a create list modal
          }}
        />
      )}
    </div>
  )
}
