"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Loader2, Camera, Edit, Check, ChevronDown, RefreshCw, Link, Map, Search, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { LocationPicker } from "@/components/ui/location-picker"
import { SimpleMapPicker } from "@/components/ui/simple-map-picker"
import { PlaceSearch } from "@/components/place-search"
import { CompressionStatus } from "@/components/ui/compression-status"
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
import { CreateListModal } from "@/components/create-list-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatCoordinates } from "@/lib/geolocation-utils"

interface Place {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
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
  isOpen: boolean
  onClose: () => void
  listId?: string
  onPlaceAdded?: (place: any) => void
}

export function AddPlaceModal({ isOpen, onClose, listId, onPlaceAdded }: AddPlaceModalProps) {
  const { dbUser } = useAuth()

  // Place details state
  const [placeName, setPlaceName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Location state
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState("")
  const [locationSource, setLocationSource] = useState<string>("")
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [showPlaceSearch, setShowPlaceSearch] = useState(false)

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [compressionStatus, setCompressionStatus] = useState<{
    isCompressing: boolean
    originalSize?: number
    compressedSize?: number
    compressionRatio?: number
  }>({ isCompressing: false })

  // List selection state
  const [selectedLists, setSelectedLists] = useState<string[]>(listId ? [listId] : [])
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
  const [currentStep, setCurrentStep] = useState<"location" | "details">("location")

  // Create list modal state
  const [showCreateListModal, setShowCreateListModal] = useState(false)

  // Location input mode state
  const [locationInputMode, setLocationInputMode] = useState<"picker" | "map" | "search" | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listDropdownRef = useRef<HTMLDivElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPlaceName("")
      setWebsiteUrl("")
      setNotes("")
      setCoordinates(null)
      setAddress("")
      setLocationSource("")
      setPhotoFile(null)
      setPhotoPreview(null)
      setCompressionStatus({ isCompressing: false })
      setShowMapPicker(false)
      setShowPlaceSearch(false)
      setCurrentStep("location")
      setLocationInputMode(null)
    }
  }, [isOpen])

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
        const recent = lists.filter((list: List) => listId && list.id !== listId).slice(0, 3)
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

  // Handle location changes from LocationPicker
  const handleLocationChange = (location: { lat: number; lng: number } | null, newAddress?: string, source?: string) => {
    setCoordinates(location)
    if (newAddress) {
      setAddress(newAddress)
    }
    if (source) {
      setLocationSource(source)
    }
    
    // Close other location pickers
    setShowMapPicker(false)
    setShowPlaceSearch(false)
  }

  // Handle place selection from search
  const handlePlaceSelect = (place: any) => {
    setPlaceName(place.name || "")
    setAddress(place.address || "")
    setCoordinates(place.lat && place.lng ? { lat: place.lat, lng: place.lng } : null)
    setLocationSource("search")
    setShowPlaceSearch(false)
  }

  // Handle map picker
  const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
    setCoordinates(location)
    setLocationSource("map")
    setShowMapPicker(false)
    
    // Try to get address for the selected coordinates
    import("@/lib/geolocation-utils").then(({ reverseGeocode }) => {
      reverseGeocode(location.lat, location.lng).then(newAddress => {
        if (newAddress) {
          setAddress(newAddress)
        }
      })
    })
  }

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      
      // Reset compression status
      setCompressionStatus({ isCompressing: false })

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

  // Validate form
  const validateForm = () => {
    if (!placeName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the place.",
        variant: "destructive",
      })
      return false
    }

    if (!coordinates) {
      toast({
        title: "Missing location",
        description: "Please select a location for the place.",
        variant: "destructive",
      })
      return false
    }

    // Check for invalid coordinates (0,0 or invalid values)
    if (coordinates.lat === 0 && coordinates.lng === 0) {
      toast({
        title: "Invalid location",
        description: "The location appears to be invalid (0,0). Please try a different location source.",
        variant: "destructive",
      })
      return false
    }

    if (Math.abs(coordinates.lat) > 90 || Math.abs(coordinates.lng) > 180) {
      toast({
        title: "Invalid coordinates",
        description: "The coordinates are outside valid ranges. Please check the location.",
        variant: "destructive",
      })
      return false
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      toast({
        title: "Invalid website",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const isValidUrl = (url: string) => {
    if (!url) return true
    try {
      // Add https:// if no protocol is specified
      const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`
      new URL(urlWithProtocol)
      return true
    } catch (e) {
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("=== FORM SUBMISSION DEBUG ===")
    console.log("Form state:", {
      placeName: placeName.trim(),
      coordinates,
      address,
      locationSource,
      websiteUrl,
      notes,
      photoFile: photoFile ? `${photoFile.name} (${photoFile.size} bytes)` : null
    })

    if (!validateForm() || !dbUser) {
      console.log("Form validation failed or no user")
      return
    }

    const successfulAdds: any[] = []

    try {
      setIsSubmitting(true)

      // Format website URL if needed
      let formattedWebsite = websiteUrl
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//)) {
        formattedWebsite = `https://${websiteUrl}`
      }

      console.log("Creating place with data:", {
        name: placeName,
        address,
        coordinates,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        website_url: formattedWebsite,
        notes,
        locationSource
      })

      // Create the place
      const placeResponse = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: placeName,
          address,
          lat: coordinates!.lat,
          lng: coordinates!.lng,
          website_url: formattedWebsite,
          created_by: dbUser.id,
        }),
      })

      if (!placeResponse.ok) {
        const errorData = await placeResponse.json()
        throw new Error(errorData.error || "Failed to create place")
      }

      const place = await placeResponse.json()
      console.log("Place created:", place)
      const placeId = place.id
      successfulAdds.push({ place, placeId })

      // Add to list if listId is provided
      if (listId) {
        console.log("Adding place to list:", listId)
        const listResponse = await fetch("/api/list-places", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            list_id: listId,
            place_id: placeId,
            note: notes,
            added_by: dbUser.id,
          }),
        })

        if (!listResponse.ok) {
          const errorData = await listResponse.json()
          throw new Error(errorData.error || "Failed to add place to list")
        }

        console.log("Place added to list successfully")
      }

      // Handle photo upload if a file was selected
      if (photoFile && successfulAdds.length > 0) {
        try {
          // Import and use the compression hook
          const { compressImage, shouldCompress } = await import('@/lib/image-compression')
          
          console.log("Processing photo for place:", placeId)
          
          let fileToUpload = photoFile
          
          // Set initial compression status
          setCompressionStatus({
            isCompressing: shouldCompress(photoFile, 500),
            originalSize: photoFile.size
          })
          
          // Compress if needed
          if (shouldCompress(photoFile, 500)) {
            console.log("Compressing image...")
            try {
              const compressionResult = await compressImage(photoFile, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8,
                maxSizeKB: 500
              })
              
              fileToUpload = compressionResult.file
              
              // Update compression status
              setCompressionStatus({
                isCompressing: false,
                originalSize: compressionResult.originalSize,
                compressedSize: compressionResult.compressedSize,
                compressionRatio: compressionResult.compressionRatio
              })
              
              console.log('Image compression result:', {
                originalSize: `${Math.round(compressionResult.originalSize / 1024)}KB`,
                compressedSize: `${Math.round(compressionResult.compressedSize / 1024)}KB`,
                compressionRatio: `${compressionResult.compressionRatio}%`
              })
              
              // Show compression success toast
              toast({
                title: "Image compressed",
                description: `Reduced by ${compressionResult.compressionRatio}% (${Math.round(compressionResult.originalSize / 1024)}KB → ${Math.round(compressionResult.compressedSize / 1024)}KB)`,
                duration: 4000,
              })
            } catch (compressionError) {
              console.warn('Compression failed, uploading original:', compressionError)
              setCompressionStatus({
                isCompressing: false,
                originalSize: photoFile.size
              })
            }
          } else {
            setCompressionStatus({
              isCompressing: false,
              originalSize: photoFile.size
            })
          }
          
          console.log("Uploading photo for place:", placeId)
          
          const formData = new FormData()
          formData.append('image', fileToUpload)
          
          // Try the original endpoint first, then fallback
          let uploadResponse = await fetch(`/api/places/${placeId}/upload-image`, {
            method: 'POST',
            body: formData,
          })
          
          if (uploadResponse.status === 404) {
            console.log("Original endpoint not found, trying alternative...")
            uploadResponse = await fetch(`/api/upload-place-image?placeId=${placeId}`, {
              method: 'POST',
              body: formData,
            })
          }
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            console.log("Photo uploaded successfully:", uploadResult.imageUrl)
            
            toast({
              title: "Photo uploaded",
              description: "Place photo has been uploaded successfully.",
            })
          } else {
            const errorData = await uploadResponse.json()
            console.error("Photo upload failed:", errorData.error)
            
            toast({
              title: "Photo upload failed",
              description: errorData.error || "Failed to upload photo.",
              variant: "destructive",
            })
          }
        } catch (uploadError) {
          console.error("Error uploading photo:", uploadError)
          toast({
            title: "Photo upload failed",
            description: "Failed to upload photo.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Place added!",
        description: `${placeName} has been ${listId ? "added to the list" : "created"} successfully.`,
      })

      // Call the callback with the created place
      if (onPlaceAdded && successfulAdds.length > 0) {
        onPlaceAdded(successfulAdds[0].place)
      }

      onClose()
    } catch (err) {
      console.error("Error adding place:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add place",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen && !showMapPicker && !showPlaceSearch} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentStep === "location" && "Choose Location"}
              {currentStep === "details" && "Add Place Details"}
              <div className="ml-auto flex gap-1">
                <div className={`w-2 h-2 rounded-full ${currentStep === "location" ? "bg-blue-500" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === "details" ? "bg-blue-500" : "bg-gray-300"}`} />
              </div>
            </DialogTitle>
            <DialogDescription>
              {currentStep === "location" && "First, let's set the location for your place. You can use photos with GPS, current location, search, or enter an address manually."}
              {currentStep === "details" && "Now add the details about your place. Fill in the information below."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {currentStep === "location" && (
              <div className="space-y-4">
                {/* Location Selection */}
                <div className="space-y-4">
                  <LocationPicker
                    value={coordinates}
                    onLocationChange={handleLocationChange}
                    photoFile={photoFile}
                    disabled={isSubmitting}
                  />
                  
                  {/* Embedded Map and Search Options */}
                  {!coordinates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocationInputMode("map")}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        disabled={isSubmitting}
                      >
                        <Map className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">Interactive Map</div>
                          <div className="text-xs text-gray-500">Click on map to select</div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocationInputMode("search")}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        disabled={isSubmitting}
                      >
                        <Search className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">Search Places</div>
                          <div className="text-xs text-gray-500">Find via Google Places</div>
                        </div>
                      </Button>
                    </div>
                  )}

                  {/* Embedded Map Picker */}
                  {locationInputMode === "map" && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Pick Location on Map</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocationInputMode(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <SimpleMapPicker
                        initialLocation={coordinates}
                        onLocationSelect={(location) => {
                          handleMapLocationSelect(location)
                          setLocationInputMode(null)
                        }}
                        onCancel={() => setLocationInputMode(null)}
                      />
                    </div>
                  )}

                  {/* Embedded Place Search */}
                  {locationInputMode === "search" && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Search for Places</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocationInputMode(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <PlaceSearch
                        onPlaceSelect={(place) => {
                          handlePlaceSelect(place)
                          setLocationInputMode(null)
                        }}
                        placeholder="Search for restaurants, shops, landmarks..."
                      />
                    </div>
                  )}
                </div>

                {/* Photo Upload in Location Step */}
                <div className="space-y-2">
                  <Label>Photo (optional)</Label>
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
                          <span className="block text-xs mt-1">Photos with GPS will set location automatically</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Show compression status */}
                  {photoFile && (
                    <div className="mt-2">
                      <CompressionStatus
                        originalSize={compressionStatus.originalSize || 0}
                        compressedSize={compressionStatus.compressedSize}
                        compressionRatio={compressionStatus.compressionRatio}
                        isCompressing={compressionStatus.isCompressing}
                      />
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("details")}
                    disabled={!coordinates}
                    className="min-w-[120px]"
                  >
                    Next: Details
                    <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "details" && (
              <div className="space-y-4">
                {/* Location Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Location Set</span>
                  </div>
                  {address && (
                    <div className="text-sm text-green-700">{address}</div>
                  )}
                  <div className="text-xs text-green-600">
                    {coordinates && formatCoordinates(coordinates.lat, coordinates.lng)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep("location")}
                    className="mt-2 h-auto p-1 text-xs text-green-700 hover:text-green-800"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Change Location
                  </Button>
                </div>

                {/* Place Name */}
                <div className="space-y-2">
                  <Label htmlFor="placeName">Place Name *</Label>
                  <Input
                    id="placeName"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="Enter place name"
                    className="w-full min-w-0"
                    autoFocus
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full min-w-0"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes about this place..."
                    rows={3}
                    className="w-full min-w-0 resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("location")}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                    Back to Location
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !placeName.trim() || !coordinates} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Add Place
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
          <DialogContent className="sm:max-w-[800px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Pick Location on Map</DialogTitle>
              <DialogDescription>
                Click anywhere on the map to select a location for your place.
              </DialogDescription>
            </DialogHeader>
            <SimpleMapPicker
              initialLocation={coordinates}
              onLocationSelect={handleMapLocationSelect}
              onCancel={() => setShowMapPicker(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Place Search Modal */}
      {showPlaceSearch && (
        <Dialog open={showPlaceSearch} onOpenChange={setShowPlaceSearch}>
          <DialogContent className="sm:max-w-[600px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Search for Places</DialogTitle>
              <DialogDescription>
                Search for places using Google Places to quickly add them to your list.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <PlaceSearch
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for restaurants, shops, landmarks..."
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
