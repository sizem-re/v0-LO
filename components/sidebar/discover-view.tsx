import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListCard } from "@/components/lists/list-card"
import { Plus, Search } from "lucide-react"
import { useLists } from "@/hooks/use-lists"
import { usePlaces } from "@/hooks/use-places"

interface Place {
  id: string
  name: string
  address: string
  type: string
  list_count?: Array<{ count: number }>
}

interface DiscoverViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onListClick: (list: any) => void
  onPlaceClick: (place: any) => void
  onAddPlace: () => void
}

export function DiscoverView({
  searchQuery,
  onSearchChange,
  onListClick,
  onPlaceClick,
  onAddPlace,
}: DiscoverViewProps) {
  // Get lists and places using our custom hooks
  const { lists: popularLists, isLoading: isLoadingLists } = useLists()
  const { places: allPlaces, isLoading: isLoadingPlaces } = usePlaces()

  // Type assertion for places
  const places = allPlaces as Place[]

  // Filter lists and places based on search query
  const filteredPopularLists = popularLists.filter(
    (list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredPlaces = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Add place button */}
      <Button onClick={onAddPlace} className="w-full bg-black text-white hover:bg-black/80">
        <Plus size={16} className="mr-2" />
        Add Place
      </Button>

      {/* Popular Lists */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-serif text-lg">Popular Lists</h2>
        </div>

        {isLoadingLists ? (
          <div className="text-center py-4">
            <p className="text-black/60">Loading lists...</p>
          </div>
        ) : filteredPopularLists.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-black/60">No lists found</p>
          </div>
        ) : (
          filteredPopularLists.map((list) => <ListCard key={list.id} list={list} onClick={onListClick} />)
        )}
      </div>

      {/* Popular Places */}
      <div>
        <div className="mt-6 mb-3">
          <h2 className="font-serif text-lg">Popular Places</h2>
        </div>

        {isLoadingPlaces ? (
          <div className="text-center py-4">
            <p className="text-black/60">Loading places...</p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-black/60">No places found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="p-3 border border-black/10 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onPlaceClick(place)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-medium text-sm mb-1 truncate">{place.name}</h3>
                    <p className="text-xs text-black/60 mb-1 truncate">{place.address}</p>
                    <div className="flex items-center text-xs text-black/50 mt-2">
                      <span>
                        In {place.list_count?.[0]?.count || 0} list{(place.list_count?.[0]?.count || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 