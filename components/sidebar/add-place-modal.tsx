"use client"

import type React from "react"

import { useState } from "react"
import { X, Search, MapPin, Plus, Loader2, Map, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
}

interface AddPlaceModalProps {
  listId: string
  onClose: () => void
  onPlaceAdded: (place: any) => void
}

export function AddPlaceModal({ listId, onClose, onPlaceAdded }: AddPlaceModalProps) {
  const { dbUser } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [note, setNote] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Manual place entry state
  const [manualPlace, setManualPlace] = useState<{
    name: string
    address: string
    lat: string
    lng: string
  }>({
    name: "",
    address: "",
    lat: "",
    lng: "",
  })

  // URL for AI extraction
  const [placeUrl, setPlaceUrl] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)

  // Search for places using Nominatim API
  const searchPlaces = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      setSearchError(null)
      setSearchResults([])

      console.log(`Searching for places with query: ${searchQuery}`)

      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "LO Place App (https://llllllo.com)",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Search results:", data)

      if (data.length === 0) {
        setSearchError("No places found. Try a different search term or add manually.")
        return
      }

      // Format the results
      const formattedResults = data.map((item: any) => ({
        name: item.display_name.split(",")[0],
        address: item.display_name,
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
        type: item.type,
      }))

      setSearchResults(formattedResults)
    } catch (err) {
      console.error("Error searching for places:", err)
      setSearchError(err instanceof Error ? err.message : "Failed to search for places")
    } finally {
      setIsSearching(false)
    }
  }

  // Handle place selection
  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
    setSearchResults([])
  }

  // Handle manual input change
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setManualPlace((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Extract place details from URL (placeholder for future AI implementation)
  const extractFromUrl = async () => {
    if (!placeUrl.trim()) return

    try {
      setIsExtracting(true)

      // This is a placeholder for future AI implementation
      // For now, we'll just show a toast message
      toast({
        title: "AI Extraction Coming Soon",
        description: "This feature will be implemented in a future update.",
      })

      // In the future, this would call an API endpoint that uses AI to extract place details
    } catch (err) {
      console.error("Error extracting place details:", err)
      toast({
        title: "Error",
        description: "Failed to extract place details from URL",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  // Add the selected place to the list
  const handleAddPlace = async (place: Place) => {
    if (!place || !listId || !dbUser) return

    try {
      setIsAdding(true)
      console.log(`Adding place to list ${listId}:`, place)

      // First, check if the place already exists in the database
      const checkResponse = await fetch(`/api/places?lat=${place.lat}&lng=${place.lng}`)

      let placeId: string

      if (checkResponse.ok) {
        const existingPlaces = await checkResponse.json()

        if (existingPlaces.length > 0) {
          // Use existing place
          placeId = existingPlaces[0].id
          console.log("Using existing place:", placeId)
        } else {
          // Create a new place
          const createPlaceResponse = await fetch("/api/places", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: place.name,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              type: place.type || "Place",
            }),
          })

          if (!createPlaceResponse.ok) {
            const errorData = await createPlaceResponse.json()
            throw new Error(errorData.error || "Failed to create place")
          }

          const newPlace = await createPlaceResponse.json()
          placeId = newPlace.id
          console.log("Created new place:", placeId)
        }

        // Now add the place to the list
        const addToListResponse = await fetch("/api/list-places", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            list_id: listId,
            place_id: placeId,
            note: note,
            added_by: dbUser.id,
          }),
        })

        if (!addToListResponse.ok) {
          const errorData = await addToListResponse.json()
          throw new Error(errorData.error || "Failed to add place to list")
        }

        const listPlaceData = await addToListResponse.json()
        console.log("Place added to list successfully:", listPlaceData)

        toast({
          title: "Place added",
          description: `${place.name} has been added to your list.`,
        })

        // Call the callback with the added place
        onPlaceAdded({
          ...place,
          id: placeId,
          listPlaceId: listPlaceData.id,
        })

        // Close the modal
        onClose()
      } else {
        throw new Error("Failed to check for existing places")
      }
    } catch (err) {
      console.error("Error adding place to list:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add place to list",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Handle adding a manually entered place
  const handleAddManualPlace = () => {
    // Validate inputs
    if (!manualPlace.name.trim()) {
      toast({
        title: "Error",
        description: "Place name is required",
        variant: "destructive",
      })
      return
    }

    if (!manualPlace.lat || !manualPlace.lng) {
      toast({
        title: "Error",
        description: "Coordinates are required",
        variant: "destructive",
      })
      return
    }

    // Parse coordinates
    const lat = Number.parseFloat(manualPlace.lat)
    const lng = Number.parseFloat(manualPlace.lng)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast({
        title: "Error",
        description: "Invalid coordinates format",
        variant: "destructive",
      })
      return
    }

    // Create place object
    const place: Place = {
      name: manualPlace.name,
      address: manualPlace.address || manualPlace.name,
      lat,
      lng,
      type: "Place",
    }

    // Add the place
    handleAddPlace(place)
  }

  // Handle form submission for search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery && !selectedPlace) {
      searchPlaces()
    } else if (selectedPlace) {
      handleAddPlace(selectedPlace)
    }
  }

  // Handle form submission for manual entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddManualPlace()
  }

  // Handle form submission for URL extraction
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    extractFromUrl()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[10vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg rounded-md overflow-hidden">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Add Place</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Map className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="search" className="p-4 pt-2">
            {!selectedPlace ? (
              <form onSubmit={handleSearchSubmit}>
                <div className="mb-4">
                  <label htmlFor="search" className="block text-sm font-medium mb-1">
                    Search for a place
                  </label>
                  <div className="relative">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Enter a place name or address"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {searchError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                    {searchError}
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("manual")}>
                        Add Manually
                      </Button>
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Search Results</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y">
                      {searchResults.map((place, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left p-3 hover:bg-gray-50 flex items-start"
                          onClick={() => handleSelectPlace(place)}
                        >
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{place.name}</div>
                            <div className="text-sm text-gray-500 truncate">{place.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-black/80"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddPlace(selectedPlace)
                }}
              >
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{selectedPlace.name}</div>
                      <div className="text-sm text-gray-500">{selectedPlace.address}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setSelectedPlace(null)}
                  >
                    Change place
                  </button>
                </div>

                <div className="mb-4">
                  <label htmlFor="note" className="block text-sm font-medium mb-1">
                    Add a note (optional)
                  </label>
                  <Textarea
                    id="note"
                    placeholder="Add any notes about this place..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-black text-white hover:bg-black/80" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to List
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="manual" className="p-4 pt-2">
            <form onSubmit={handleManualSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Place Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={manualPlace.name}
                    onChange={handleManualInputChange}
                    placeholder="e.g., My Favorite Coffee Shop"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={manualPlace.address}
                    onChange={handleManualInputChange}
                    placeholder="e.g., 123 Main St, City, Country"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude *</Label>
                    <Input
                      id="lat"
                      name="lat"
                      value={manualPlace.lat}
                      onChange={handleManualInputChange}
                      placeholder="e.g., 40.7128"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude *</Label>
                    <Input
                      id="lng"
                      name="lng"
                      value={manualPlace.lng}
                      onChange={handleManualInputChange}
                      placeholder="e.g., -74.0060"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manual-note">Note (optional)</Label>
                  <Textarea
                    id="manual-note"
                    placeholder="Add any notes about this place..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  <p>* Required fields</p>
                  <p className="mt-1">
                    Tip: You can find coordinates by right-clicking on Google Maps and selecting "What's here?"
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-black/80" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to List
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="url" className="p-4 pt-2">
            <form onSubmit={handleUrlSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">Place URL</Label>
                  <div className="relative">
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/place"
                      value={placeUrl}
                      onChange={(e) => setPlaceUrl(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Paste a URL to a place (e.g., Google Maps, Yelp, etc.)</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm">
                  <p className="font-medium">Coming Soon</p>
                  <p className="mt-1">
                    This feature will use AI to extract place details from URLs. For now, please use the Search or
                    Manual options.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-black/80" disabled={true}>
                  <Plus className="mr-2 h-4 w-4" />
                  Extract & Add
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
