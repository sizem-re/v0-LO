"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Search, MapPin, Plus, Loader2, Camera, Edit, Check, ChevronDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
}

interface List {
  id: string
  title: string
  visibility: string
  owner_id: string
}

interface AddressComponents {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressAutocompleteResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface AddPlaceModalProps {
  listId: string
  onClose: () => void
  onPlaceAdded: (place: any) => void
  onRefreshList?: () => void
}

export function AddPlaceModal({ listId, onClose, onPlaceAdded, onRefreshList }: AddPlaceModalProps) {
  const { dbUser } = useAuth()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AddressAutocompleteResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Place details state
  const [placeName, setPlaceName] = useState("")
  const [note, setNote] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isAddingPlace, setIsAddingPlace] = useState(false)

  // Address components state
  const [addressComponents, setAddressComponents] = useState<AddressComponents>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })

  // Photo placeholder state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // List selection state
  const [selectedLists, setSelectedLists] = useState<string[]>([listId])
  const [userLists, setUserLists] = useState<List[]>([])
  const [currentList, setCurrentList] = useState<List | null>(null)
  const [recentLists, setRecentLists] = useState<List[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(true)
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false)
  const [listSearchQuery, setListSearchQuery] = useState("")
  const [filteredLists, setFilteredLists] = useState<List[]>([])

  // Error handling state
  const [duplicateError, setDuplicateError] = useState<{
    show: boolean
    message: string
    listId: string
    placeName: string
  }>({
    show: false,
    message: "",
    listId: "",
    placeName: "",
  })

  // Current step state
  const [currentStep, setCurrentStep] = useState<"search" | "details">("search")

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user's lists
  useEffect(() => {
    const fetchLists = async () => {
      if (!dbUser?.id) return

      try {
        setIsLoadingLists(true)
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch lists: ${response.status}`)
        }

        const lists = await response.json()
        setUserLists(lists)

        // Find the current list
        const current = lists.find((list: List) => list.id === listId)
        if (current) {
          setCurrentList(current)
        }

        // Set recent lists (excluding current list)
        // In a real app, you might want to track recently used lists in a separate API
        const recent = lists.filter((list: List) => list.id !== listId).slice(0, 3)
        setRecentLists(recent)

        // Initialize filtered lists
        setFilteredLists(lists)
      } catch (err) {
        console.error("Error fetching lists:", err)
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchLists()
  }, [dbUser?.id, listId])

  // Filter lists based on search query
  useEffect(() => {
    if (!listSearchQuery.trim()) {
      setFilteredLists(userLists)
      return
    }

    const query = listSearchQuery.toLowerCase()
    const filtered = userLists.filter((list) => list.title.toLowerCase().includes(query))
    setFilteredLists(filtered)
  }, [listSearchQuery, userLists])

  // Handle clicks outside the list dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target as Node)) {
        setIsListDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search for places
  const searchPlaces = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      setSearchError(null)
      setSearchResults([])

      console.log(`Searching for places with query: ${searchQuery}`)

      // Use Nominatim API for geocoding with address details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=5&addressdetails=1`,
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
        setSearchError("No places found. Try a different search term or add details manually.")
        return
      }

      setSearchResults(data)
    } catch (err) {
      console.error("Error searching for places:", err)
      setSearchError(err instanceof Error ? err.message : "Failed to search for places")
    } finally {
      setIsSearching(false)
    }
  }

  // Handle place selection from search results
  const handleSelectPlace = (place: AddressAutocompleteResult) => {
    // Extract the first part of the display name as the place name
    const nameComponents = place.display_name.split(",")
    const suggestedName = nameComponents[0].trim()

    setPlaceName(suggestedName)
    setCoordinates({
      lat: Number.parseFloat(place.lat),
      lng: Number.parseFloat(place.lon),
    })

    // Extract address components from the result
    const addr = place.address || {}

    setAddressComponents({
      street: [addr.house_number, addr.road].filter(Boolean).join(" ") || "",
      city: addr.city || addr.town || addr.village || "",
      state: addr.state || "",
      postalCode: addr.postcode || "",
      country: addr.country || "",
    })

    // Move to the details step
    setCurrentStep("details")
  }

  // Handle manual entry without search
  const handleManualEntry = () => {
    setPlaceName("")
    setCoordinates(null)
    setAddressComponents({
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    })
    setCurrentStep("details")
  }

  // Format address components into a single string
  const formatFullAddress = (): string => {
    const components = []

    if (addressComponents.street) components.push(addressComponents.street)
    if (addressComponents.city) components.push(addressComponents.city)
    if (addressComponents.state) components.push(addressComponents.state)
    if (addressComponents.postalCode) components.push(addressComponents.postalCode)
    if (addressComponents.country) components.push(addressComponents.country)

    return components.join(", ")
  }

  // Geocode the address when components change
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!isEditingAddress) return

      const addressString = formatFullAddress()
      if (!addressString) return

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
          {
            headers: {
              "Accept-Language": "en-US,en",
              "User-Agent": "LO Place App (https://llllllo.com)",
            },
          },
        )

        if (!response.ok) return

        const data = await response.json()
        if (data.length > 0) {
          setCoordinates({
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon),
          })
        }
      } catch (err) {
        console.error("Error geocoding address:", err)
      }
    }

    // Debounce the geocoding
    const timer = setTimeout(geocodeAddress, 1000)
    return () => clearTimeout(timer)
  }, [addressComponents, isEditingAddress])

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Trigger file input click
  const handlePhotoButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Toggle list selection
  const handleToggleList = (listId: string) => {
    setSelectedLists((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId)
      } else {
        return [...prev, listId]
      }
    })
  }

  // Get list title by ID
  const getListTitle = (id: string): string => {
    const list = userLists.find((l) => l.id === id)
    return list ? list.title : "Unknown List"
  }

  // Handle refreshing the list to show the place that's already there
  const handleRefreshList = () => {
    if (onRefreshList) {
      onRefreshList()
    }
    setDuplicateError({ show: false, message: "", listId: "", placeName: "" })
    onClose()
  }

  // Add the place to selected lists
  const handleAddPlace = async () => {
    if (!placeName.trim() || !coordinates || selectedLists.length === 0 || !dbUser) {
      toast({
        title: "Missing information",
        description: "Please provide a name, valid address, and select at least one list.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingPlace(true)

      const fullAddress = formatFullAddress()
      console.log(`Adding place to ${selectedLists.length} lists:`, {
        name: placeName,
        address: fullAddress,
        coordinates,
      })

      // First, check if the place already exists in the database
      const checkResponse = await fetch(`/api/places?lat=${coordinates.lat}&lng=${coordinates.lng}`)

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
              name: placeName,
              address: fullAddress,
              lat: coordinates.lat,
              lng: coordinates.lng,
              created_by: dbUser.id,
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

        // Add the place to all selected lists
        const addPromises = selectedLists.map(async (listId) => {
          try {
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

            const responseData = await addToListResponse.json()

            if (!addToListResponse.ok) {
              // Check if this is a duplicate error
              if (addToListResponse.status === 409 && responseData.alreadyExists) {
                console.log("Place already exists in list:", responseData)

                // If this is the only list we're adding to, show the duplicate error dialog
                if (selectedLists.length === 1) {
                  setDuplicateError({
                    show: true,
                    message: responseData.error || "This place is already in the list",
                    listId: listId,
                    placeName: placeName,
                  })
                  return { error: true, duplicate: true, listId }
                }

                // Otherwise just return the error but continue with other lists
                return { error: true, duplicate: true, listId }
              }

              throw new Error(responseData.error || `Failed to add place to list ${listId}`)
            }

            return responseData
          } catch (err) {
            console.error(`Error adding place to list ${listId}:`, err)
            return { error: true, message: err instanceof Error ? err.message : "Unknown error", listId }
          }
        })

        const results = await Promise.all(addPromises)
        console.log("Place add results:", results)

        // Check if we had any successful additions
        const successfulAdds = results.filter((result) => !result.error)
        const duplicates = results.filter((result) => result.error && result.duplicate)

        if (successfulAdds.length === 0 && duplicates.length > 0) {
          // If all were duplicates, show a message
          if (duplicates.length === 1) {
            setDuplicateError({
              show: true,
              message: `${placeName} is already in this list`,
              listId: duplicates[0].listId,
              placeName,
            })
            return
          } else {
            toast({
              title: "Already added",
              description: `${placeName} is already in all selected lists.`,
              action: (
                <Button variant="outline" size="sm" onClick={handleRefreshList}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              ),
            })
            onClose()
            return
          }
        }

        // TODO: Handle photo upload when backend is ready
        if (photoFile) {
          console.log("Photo will be uploaded in a future update:", photoFile.name)
        }

        // If we had some successful adds but also some duplicates
        if (successfulAdds.length > 0 && duplicates.length > 0) {
          toast({
            title: "Place added partially",
            description: `${placeName} was added to ${successfulAdds.length} list(s) but was already in ${duplicates.length} list(s).`,
          })
        } else if (successfulAdds.length > 0) {
          // All successful
          toast({
            title: "Place added",
            description:
              selectedLists.length === 1
                ? `${placeName} has been added to ${getListTitle(selectedLists[0])}.`
                : `${placeName} has been added to ${successfulAdds.length} lists.`,
          })
        }

        // Call the callback with the added place if we had at least one successful add
        if (successfulAdds.length > 0) {
          onPlaceAdded({
            id: placeId,
            name: placeName,
            address: fullAddress,
            coordinates,
            listPlaceId: successfulAdds[0].id, // Use the first result for the original list
          })
        }

        // Close the modal if we didn't show the duplicate error dialog
        if (!duplicateError.show) {
          onClose()
        }
      } else {
        throw new Error("Failed to check for existing places")
      }
    } catch (err) {
      console.error("Error adding place to lists:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add place to lists",
        variant: "destructive",
      })
    } finally {
      setIsAddingPlace(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep === "search") {
      searchPlaces()
    } else {
      handleAddPlace()
    }
  }

  // Render the search step
  const renderSearchStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">Search for a place</Label>
        <div className="relative mt-1">
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

      {searchError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{searchError}</div>}

      {searchResults.length > 0 && (
        <div>
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
                  <div className="font-medium">{place.display_name.split(",")[0]}</div>
                  <div className="text-sm text-gray-500 truncate">{place.display_name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <button type="button" className="text-sm text-blue-600 hover:text-blue-800" onClick={handleManualEntry}>
          Or add place details manually
        </button>
      </div>
    </div>
  )

  // Render the details step
  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="placeName">
          Place Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="placeName"
          type="text"
          placeholder="e.g., Cozy Corner Cafe"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label>
          Add to Lists <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1" ref={listDropdownRef}>
          <button
            type="button"
            className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
          >
            <span>
              {selectedLists.length === 0
                ? "Select lists"
                : selectedLists.length === 1
                  ? getListTitle(selectedLists[0])
                  : `${selectedLists.length} lists selected`}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {isListDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-200">
                <Input
                  type="text"
                  placeholder="Search lists..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {isLoadingLists ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading lists...
                  </div>
                ) : filteredLists.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No lists found</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {/* Current list (always shown at the top) */}
                    {currentList && (
                      <div className="p-2 bg-gray-50">
                        <label className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLists.includes(currentList.id)}
                            onChange={() => handleToggleList(currentList.id)}
                            className="mr-2"
                          />
                          <div>
                            <div className="font-medium">{currentList.title}</div>
                            <div className="text-xs text-gray-500">Current list</div>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Recent lists section */}
                    {recentLists.length > 0 && listSearchQuery === "" && (
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 px-2 py-1">Recent Lists</div>
                        {recentLists.map((list) => (
                          <label
                            key={list.id}
                            className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLists.includes(list.id)}
                              onChange={() => handleToggleList(list.id)}
                              className="mr-2"
                            />
                            <span>{list.title}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* All lists or search results */}
                    <div className="p-2">
                      {listSearchQuery !== "" && (
                        <div className="text-xs font-medium text-gray-500 px-2 py-1">Search Results</div>
                      )}
                      {filteredLists
                        .filter((list) => {
                          // Filter out the current list and recent lists when not searching
                          if (listSearchQuery === "") {
                            return (
                              (!currentList || list.id !== currentList.id) &&
                              !recentLists.some((recent) => recent.id === list.id)
                            )
                          }
                          return true
                        })
                        .map((list) => (
                          <label
                            key={list.id}
                            className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLists.includes(list.id)}
                              onChange={() => handleToggleList(list.id)}
                              className="mr-2"
                            />
                            <span>{list.title}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>
            Address <span className="text-red-500">*</span>
          </Label>
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => setIsEditingAddress(!isEditingAddress)}
          >
            {isEditingAddress ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Done
              </>
            ) : (
              <>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </>
            )}
          </button>
        </div>

        {isEditingAddress ? (
          <div className="grid grid-cols-1 gap-3 mt-1">
            <div>
              <Label htmlFor="street" className="text-xs">
                Street
              </Label>
              <Input
                id="street"
                type="text"
                placeholder="Street address"
                value={addressComponents.street}
                onChange={(e) => setAddressComponents({ ...addressComponents, street: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="city" className="text-xs">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={addressComponents.city}
                  onChange={(e) => setAddressComponents({ ...addressComponents, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-xs">
                  State/Province
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="State/Province"
                  value={addressComponents.state}
                  onChange={(e) => setAddressComponents({ ...addressComponents, state: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="postalCode" className="text-xs">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Postal/ZIP code"
                  value={addressComponents.postalCode}
                  onChange={(e) => setAddressComponents({ ...addressComponents, postalCode: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-xs">
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Country"
                  value={addressComponents.country}
                  onChange={(e) => setAddressComponents({ ...addressComponents, country: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-md mt-1">
            {formatFullAddress() || "No address provided"}
            {coordinates && (
              <div className="text-xs text-gray-500 mt-1">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          placeholder="Add any notes about this place..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Photo (coming soon)</Label>
        <div
          className={cn(
            "mt-1 border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors",
            photoPreview ? "border-gray-300" : "border-gray-200",
          )}
          onClick={handlePhotoButtonClick}
        >
          <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview || "/placeholder.svg"}
                alt="Place preview"
                className="mx-auto max-h-40 rounded-md"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Click to add a photo
                <span className="block text-xs mt-1">(Photo uploads will be available soon)</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[10vh]">
        <div className="bg-white w-full max-w-md border border-black/10 shadow-lg rounded-md overflow-hidden">
          <div className="p-4 border-b border-black/10 flex items-center justify-between">
            <h2 className="text-lg font-medium">{currentStep === "search" ? "Add Place" : "Place Details"}</h2>
            <button onClick={onClose} className="p-1" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {currentStep === "search" ? renderSearchStep() : renderDetailsStep()}

            <div className="flex justify-between gap-2 mt-6">
              {currentStep === "details" && (
                <Button type="button" variant="outline" onClick={() => setCurrentStep("search")}>
                  Back
                </Button>
              )}

              <div className={cn("flex gap-2", currentStep === "details" ? "ml-auto" : "w-full justify-end")}>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>

                {currentStep === "search" ? (
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
                ) : (
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-black/80"
                    disabled={isAddingPlace || !placeName.trim() || !coordinates || selectedLists.length === 0}
                  >
                    {isAddingPlace ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to List{selectedLists.length > 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Place Alert Dialog */}
      <AlertDialog
        open={duplicateError.show}
        onOpenChange={(open) => setDuplicateError({ ...duplicateError, show: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Place Already in List</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateError.message}. This place might not be visible in your list due to a synchronization issue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefreshList}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
