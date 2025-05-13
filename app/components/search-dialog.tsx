"use client"

import { useState, useEffect } from "react"
import { Search, X, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Place } from "../types/place"

// Mock data for search results
const MOCK_PLACES: Place[] = [
  {
    id: "p1",
    name: "The Fish House Cafe",
    type: "Restaurant",
    address: "1814 Martin Luther King Jr Way, Tacoma, WA 98405",
    coordinates: { lat: 47.2529, lng: -122.4443 },
  },
  {
    id: "p2",
    name: "Vien Dong",
    type: "Vietnamese Restaurant",
    address: "3801 Yakima Ave, Tacoma, WA 98418",
    coordinates: { lat: 47.2209, lng: -122.4634 },
  },
]

const MOCK_LISTS = [
  {
    id: "1",
    title: "BEST (HIDDEN) FOOD IN TACOMA",
    author: "taylorbenthero.eth",
  },
  {
    id: "2",
    title: "Core Skateshops of the World",
    author: "community list",
  },
]

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ places: Place[]; lists: typeof MOCK_LISTS }>({
    places: [],
    lists: [],
  })
  const router = useRouter()

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  useEffect(() => {
    if (query.length > 1) {
      // In a real app, this would be an API call
      const filteredPlaces = MOCK_PLACES.filter(
        (place) =>
          place.name.toLowerCase().includes(query.toLowerCase()) ||
          place.address.toLowerCase().includes(query.toLowerCase()) ||
          place.type.toLowerCase().includes(query.toLowerCase()),
      )

      const filteredLists = MOCK_LISTS.filter(
        (list) =>
          list.title.toLowerCase().includes(query.toLowerCase()) ||
          list.author.toLowerCase().includes(query.toLowerCase()),
      )

      setResults({
        places: filteredPlaces,
        lists: filteredLists,
      })
    } else {
      setResults({ places: [], lists: [] })
    }
  }, [query])

  if (!open) return null

  const handlePlaceClick = (place: Place) => {
    router.push(`/places/${place.id}`)
    onOpenChange(false)
    setQuery("")
  }

  const handleListClick = (listId: string) => {
    router.push(`/lists/${listId}`)
    onOpenChange(false)
    setQuery("")
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-2xl border border-black/10 shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center">
          <Search className="h-5 w-5 mr-2 text-black/50" />
          <input
            type="text"
            placeholder="Search places, lists, users..."
            className="flex-1 outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={() => onOpenChange(false)} className="p-1" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.length > 1 ? (
            <>
              {results.places.length > 0 && (
                <div className="p-4 border-b border-black/10">
                  <h3 className="text-sm font-medium text-black/50 mb-2">PLACES</h3>
                  <div className="space-y-3">
                    {results.places.map((place) => (
                      <button
                        key={place.id}
                        className="w-full text-left flex items-start hover:bg-gray-50 p-2"
                        onClick={() => handlePlaceClick(place)}
                      >
                        <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{place.name}</div>
                          <div className="text-sm text-black/70">{place.address}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.lists.length > 0 && (
                <div className="p-4 border-b border-black/10">
                  <h3 className="text-sm font-medium text-black/50 mb-2">LISTS</h3>
                  <div className="space-y-3">
                    {results.lists.map((list) => (
                      <button
                        key={list.id}
                        className="w-full text-left hover:bg-gray-50 p-2"
                        onClick={() => handleListClick(list.id)}
                      >
                        <div className="font-medium">{list.title}</div>
                        <div className="text-sm text-black/70">by {list.author}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.places.length === 0 && results.lists.length === 0 && (
                <div className="p-8 text-center text-black/50">No results found for "{query}"</div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-black/50">Type to search places, lists, and users</div>
          )}
        </div>
      </div>
    </div>
  )
} 