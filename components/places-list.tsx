"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, Trash2 } from "lucide-react"

type Place = {
  id: string
  name: string
  type: string
  address: string
  coordinates: { lat: number; lng: number }
  notes?: string
  photos?: string[]
}

interface PlacesListProps {
  places: Place[]
}

export function PlacesList({ places }: PlacesListProps) {
  if (places.length === 0) {
    return (
      <Card className="brutalist-card p-6 text-center">
        <p className="mb-4">No places added to this list yet.</p>
        <Button className="bg-black text-white hover:bg-gray-800 rounded-none border border-black">
          ADD YOUR FIRST PLACE
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {places.map((place) => (
        <Card key={place.id} className="brutalist-card overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {place.photos && place.photos.length > 0 && (
              <div
                className="w-full md:w-1/3 h-32 md:h-auto bg-gray-200"
                style={{
                  backgroundImage: `url(${place.photos[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{place.name}</h3>
                  <span className="inline-block bg-gray-200 px-2 py-1 text-xs mb-2">{place.type}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-none">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-none">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center text-sm mb-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{place.address}</span>
              </div>

              {place.notes && <p className="text-sm mt-2">{place.notes}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
