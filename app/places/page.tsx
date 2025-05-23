"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, MapPin, Calendar, Globe, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useDebounce } from "use-debounce"

interface Place {
  id: string
  name: string
  type?: string
  address?: string
  lat: string
  lng: string
  description?: string
  website_url?: string
  created_at: string
  lists?: Array<{
    id: string
    title: string
    type: string
  }>
  addedAt?: string
  notes?: string
}

interface PlacesResponse {
  places: Place[]
  total: number
  hasMore: boolean
}

const PLACE_TYPES = [
  "Restaurant",
  "Cafe",
  "Bar",
  "Shop",
  "Park",
  "Museum",
  "Gallery",
  "Theater",
  "Landmark",
  "Hotel",
  "Other",
]

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)

  const fetchPlaces = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset

      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      setError(null)

      try {
        const params = new URLSearchParams({
          limit: "20",
          offset: currentOffset.toString(),
        })

        if (debouncedSearchQuery) {
          params.append("search", debouncedSearchQuery)
        }

        if (selectedType !== "all") {
          params.append("type", selectedType)
        }

        const response = await fetch(`/api/places?${params}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch places: ${response.status}`)
        }

        const data: PlacesResponse = await response.json()

        if (reset) {
          setPlaces(data.places)
          setOffset(data.places.length)
        } else {
          setPlaces((prev) => [...prev, ...data.places])
          setOffset((prev) => prev + data.places.length)
        }

        setHasMore(data.hasMore)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch places")
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [debouncedSearchQuery, selectedType, offset],
  )

  // Reset and fetch when search or filter changes
  useEffect(() => {
    setOffset(0)
    fetchPlaces(true)
  }, [debouncedSearchQuery, selectedType])

  // Initial load
  useEffect(() => {
    fetchPlaces(true)
  }, [])

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPlaces(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading places...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Places</h1>
          <p className="text-gray-600">Discover places added by the community</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search places by name, address, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PLACE_TYPES.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          <div className="flex flex-wrap gap-2">
            {debouncedSearchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {debouncedSearchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  ×
                </button>
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                <button onClick={() => setSelectedType("all")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchPlaces(true)} variant="outline" className="mt-4">
              Try Again
            </Button>
          </Card>
        )}

        {/* Places Grid */}
        {places.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {place.website_url && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="bg-white/90">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </Badge>
                      </div>
                    )}
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/places/${place.id}`}>
                        <h3 className="font-semibold text-lg hover:underline line-clamp-1">{place.name}</h3>
                      </Link>
                      {place.type && (
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {place.type}
                        </Badge>
                      )}
                    </div>

                    {place.address && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{place.address}</span>
                      </div>
                    )}

                    {place.website_url && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Globe className="h-4 w-4 mr-1 flex-shrink-0" />
                        <a
                          href={place.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {place.website_url.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}

                    {place.addedAt && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Added {formatDate(place.addedAt)}</span>
                      </div>
                    )}

                    {place.notes && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.notes}</p>}

                    {place.lists && place.lists.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {place.lists.slice(0, 2).map((list) => (
                          <Link key={list.id} href={`/lists/${list.id}`}>
                            <Badge variant="secondary" className="text-xs hover:bg-gray-200 cursor-pointer">
                              {list.title}
                            </Badge>
                          </Link>
                        ))}
                        {place.lists.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{place.lists.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline" className="min-w-32">
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Places"
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : !isLoading ? (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No places found</h3>
            <p className="text-gray-600 mb-4">
              {debouncedSearchQuery || selectedType !== "all"
                ? "Try adjusting your search or filters"
                : "No places have been added yet"}
            </p>
            {(debouncedSearchQuery || selectedType !== "all") && (
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType("all")
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : null}

        {/* Results Summary */}
        {places.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {places.length} places
            {hasMore && " (load more to see all)"}
          </div>
        )}
      </div>
    </div>
  )
}
