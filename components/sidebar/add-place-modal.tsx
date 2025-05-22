"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Search, MapPin, Plus, Loader2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
}

interface AddressAutocompleteResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface AddPlaceModalProps {
  listId: string
  onClose: () => void
  onPlaceAdded: (place: any) => void
}

export function AddPlaceModal({ listId, onClose, onPlaceAdded }: AddPlaceModalProps) {
  const { dbUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [note, setNote] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isManualEntry, setIsManualEntry] = useState(false)

  // Manual entry form state
  const [manualName, setManualName] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<AddressAutocompleteResult[]>([])
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] = useState(false)
  const [manualLat, setManualLat] = useState<number | null>(null)
  const [manualLng, setManualLng] = useState<number | null>(null)
  const [manualType, setManualType] = useState("Place")

  // Refs
  const addressInputRef = useRef<HTMLInputElement>(null)
  const addressSuggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce timer for address autocomplete
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Switch to manual entry mode
  const handleSwitchToManualEntry = () => {
    setIsManualEntry(true)
    setSearchResults([])
    setSearchError(null)

    // If there was a search query, use it as the initial name
    if (searchQuery.trim()) {
      setManualName(searchQuery)
    }
  }

  // Get address suggestions for autocomplete
  const getAddressSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      setIsLoadingAddressSuggestions(true)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "LO Place App (https://llllllo.com)",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Address search failed with status: ${response.status}`)
      }

      const data = await response.json()
      setAddressSuggestions(data)
    } catch (err) {
      console.error("Error getting address suggestions:", err)
      setAddressSuggestions([])
    } finally {
      setIsLoadingAddressSuggestions(false)
    }
  }

  // Handle address input change with debounce
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualAddress(value)

    // Clear coordinates when address changes
    setManualLat(null)
    setManualLng(null)

    // Debounce the API call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      getAddressSuggestions(value)
    }, 300)
  }

  // Handle address suggestion selection
  const handleSelectAddressSuggestion = (suggestion: AddressAutocompleteResult) => {
    setManualAddress(suggestion.display_name)
    setManualLat(Number.parseFloat(suggestion.lat))
    setManualLng(Number.parseFloat(suggestion.lon))
    setAddressSuggestions([])
  }

  // Handle click outside address suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressSuggestionsRef.current &&
        !addressSuggestionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setAddressSuggestions([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Create a place from manual entry
  const createManualPlace = (): Place => {
    if (!manualName.trim() || !manualAddress.trim() || manualLat === null || manualLng === null) {
      throw new Error("Please fill in all required fields and select a valid address")
    }

    return {
      name: manualName.trim(),
      address: manualAddress.trim(),
      lat: manualLat,
      lng: manualLng,
      type: manualType,
    }
  }

  // Add the selected place to the list
  const handleAddPlace = async () => {
    try {
      setIsAdding(true)

      // Get the place data either from selection or manual entry
      const placeData = isManualEntry ? createManualPlace() : selectedPlace

      if (!placeData || !listId || !dbUser) {
        throw new Error("Missing required data")
      }

      console.log(`Adding place to list ${listId}:`, placeData)

      // First, check if the place already exists in the database
      const checkResponse = await fetch(`/api/places?lat=${placeData.lat}&lng=${placeData.lng}`)

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
              name: placeData.name,
              address: placeData.address,
              lat: placeData.lat,
              lng: placeData.lng,
              type: placeData.type || "Place",
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
          description: `${placeData.name} has been added to your list.`,
        })

        // Call the callback with the added place
        onPlaceAdded({
          ...placeData,
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isManualEntry) {
      handleAddPlace()
    } else if (searchQuery && !selectedPlace) {
      searchPlaces()
    } else if (selectedPlace) {
      handleAddPlace()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[10vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg rounded-md overflow-hidden">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">{isManualEntry ? "Add Place Manually" : "Add Place"}</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {!isManualEntry && !selectedPlace ? (
            <>
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
                  <button
                    type="button"
                    className="block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={handleSwitchToManualEntry}
                  >
                    <PlusCircle className="h-4 w-4 inline-block mr-1" />
                    Add place manually
                  </button>
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

                  <button
                    type="button"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    onClick={handleSwitchToManualEntry}
                  >
                    Can't find what you're looking for? Add manually
                  </button>
                </div>
              )}

              {!searchResults.length && !searchError && (
                <button
                  type="button"
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  onClick={handleSwitchToManualEntry}
                >
                  Can't find what you're looking for? Add manually
                </button>
              )}
            </>
          ) : isManualEntry ? (
            <>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Place Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Cozy Corner Cafe"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="address"
                      type="text"
                      placeholder="Start typing an address..."
                      value={manualAddress}
                      onChange={handleAddressChange}
                      onFocus={() => setIsAddressFocused(true)}
                      ref={addressInputRef}
                      required
                    />
                    {isLoadingAddressSuggestions && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}

                    {isAddressFocused && addressSuggestions.length > 0 && (
                      <div
                        ref={addressSuggestionsRef}
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            onClick={() => handleSelectAddressSuggestion(suggestion)}
                          >
                            {suggestion.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {manualAddress && !manualLat && !manualLng && (
                    <p className="text-amber-600 text-xs mt-1">Please select an address from the suggestions</p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">
                    Place Type
                  </label>
                  <Input
                    id="type"
                    type="text"
                    placeholder="e.g., Restaurant, Park, Shop"
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium mb-1">
                    Note (optional)
                  </label>
                  <Textarea
                    id="note"
                    placeholder="Add any notes about this place..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                {manualLat !== null && manualLng !== null && (
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-500">
                    Coordinates: {manualLat.toFixed(6)}, {manualLng.toFixed(6)}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setIsManualEntry(false)
                  setManualName("")
                  setManualAddress("")
                  setManualLat(null)
                  setManualLng(null)
                }}
              >
                Back to search
              </button>
            </>
          ) : selectedPlace ? (
            <>
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
            </>
          ) : null}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            {isManualEntry ? (
              <Button
                type="submit"
                className="bg-black text-white hover:bg-black/80"
                disabled={isAdding || !manualName || !manualAddress || manualLat === null || manualLng === null}
              >
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
            ) : selectedPlace ? (
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
            ) : (
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
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
