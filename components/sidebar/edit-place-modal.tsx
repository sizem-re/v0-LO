"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Loader2, Camera, Check, Trash2, Link, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { CompressionStatus } from "@/components/ui/compression-status"
import { LocationPicker } from "@/components/ui/location-picker"
import { SimpleMapPicker } from "@/components/ui/simple-map-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  place: any
  listId: string
  listPlaceId?: string | null
  onPlaceUpdated?: (updatedPlace: any) => void
  onPlaceRemoved?: (placeId: string) => void
}

export function EditPlaceModal({
  isOpen,
  onClose,
  place,
  listId,
  listPlaceId,
  onPlaceUpdated,
  onPlaceRemoved,
}: EditPlaceModalProps) {
  const { dbUser } = useAuth()

  // Place details state
  const [placeName, setPlaceName] = useState(place?.name || "")
  const [address, setAddress] = useState(place?.address || "")
  const [websiteUrl, setWebsiteUrl] = useState(place?.website_url || "")
  const [notes, setNotes] = useState(place?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Location state
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    place?.lat && place?.lng ? { lat: Number.parseFloat(place.lat), lng: Number.parseFloat(place.lng) } : null,
  )

  // Photo placeholder state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(place?.image_url || null)
  const [compressionStatus, setCompressionStatus] = useState<{
    isCompressing: boolean
    originalSize?: number
    compressedSize?: number
    compressionRatio?: number
  }>({ isCompressing: false })

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update state when place changes
  useEffect(() => {
    if (place) {
      console.log("=== EDIT MODAL DEBUG ===")
      console.log("Place data received:", JSON.stringify(place, null, 2))

      setPlaceName(place.name || "")
      setAddress(place.address || "")
      setWebsiteUrl(place.website_url || "")
      setNotes(place.notes || "")
      setPhotoPreview(place.image_url || null)
      setCoordinates(
        place.lat && place.lng ? { lat: Number.parseFloat(place.lat), lng: Number.parseFloat(place.lng) } : null,
      )

      console.log("Initial form values:")
      console.log("- Name:", place.name || "")
      console.log("- Address:", place.address || "")
      console.log("- Website URL:", place.website_url || "")
      console.log("- Notes:", place.notes || "")
      console.log("- List Place ID:", place.listPlaceId || place.list_place_id)
    }
  }, [place])

  // Geocode the address when components change
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!showMapPicker) return

      const addressString = address
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
  }, [address, showMapPicker])

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

  // Update the place
  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !dbUser) {
      return
    }

    try {
      setIsSubmitting(true)

      // Format website URL if needed
      let formattedWebsite = websiteUrl
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//)) {
        formattedWebsite = `https://${websiteUrl}`
      }

      // Use the formatted address from components if editing address
      const finalAddress = address

      console.log("=== UPDATE PLACE DEBUG ===")
      console.log("Current form values:")
      console.log("- Name:", placeName)
      console.log("- Address:", finalAddress)
      console.log("- Website URL (raw):", websiteUrl)
      console.log("- Website URL (formatted):", formattedWebsite)
      console.log("- Notes:", notes)
      console.log("- Coordinates:", coordinates)

      console.log("Original place values:")
      console.log("- Name:", place.name)
      console.log("- Address:", place.address)
      console.log("- Website URL:", place.website_url)
      console.log("- Notes:", place.notes)

      // First, update the place details if needed
      const updateData: Record<string, any> = {
        name: placeName,
        address: finalAddress,
        website_url: formattedWebsite,
      }

      // Add coordinates if available
      if (coordinates) {
        updateData.lat = coordinates.lat.toString()
        updateData.lng = coordinates.lng.toString()
      }

      console.log("Update payload being sent:", JSON.stringify(updateData, null, 2))

      const placeUpdateResponse = await fetch(`/api/places/${place.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      console.log("API response status:", placeUpdateResponse.status)

      if (!placeUpdateResponse.ok) {
        const errorData = await placeUpdateResponse.json()
        console.error("API error response:", errorData)
        throw new Error(errorData.error || "Failed to update place")
      }

      const updatedPlaceData = await placeUpdateResponse.json()
      console.log("Updated place data from API:", JSON.stringify(updatedPlaceData, null, 2))

      // Then, update the list-place relationship (notes)
      const listPlaceId = place.listPlaceId || place.list_place_id

      if (listPlaceId && notes !== place.notes) {
        console.log("Updating list-place notes with ID:", listPlaceId)
        const listPlaceUpdateResponse = await fetch(`/api/list-places`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: listPlaceId,
            note: notes,
          }),
        })

        if (!listPlaceUpdateResponse.ok) {
          const errorData = await listPlaceUpdateResponse.json()
          throw new Error(errorData.error || "Failed to update place notes")
        }
      }

      // Handle photo upload if a file was selected
      if (photoFile) {
        try {
          // Import and use the compression utilities
          const { compressImage, shouldCompress } = await import('@/lib/image-compression')
          
          console.log("Processing photo for place:", place.id)
          
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
              
              // Show compression success toast with longer duration
              toast({
                title: "Image compressed successfully",
                description: `Reduced file size by ${compressionResult.compressionRatio}% (${Math.round(compressionResult.originalSize / 1024)}KB → ${Math.round(compressionResult.compressedSize / 1024)}KB)`,
                duration: 4000, // Show for 4 seconds
              })
            } catch (compressionError) {
              console.warn('Compression failed, uploading original:', compressionError)
              setCompressionStatus({
                isCompressing: false,
                originalSize: photoFile.size
              })
              // Continue with original file
            }
          } else {
            setCompressionStatus({
              isCompressing: false,
              originalSize: photoFile.size
            })
          }
          
          console.log("Uploading photo for place:", place.id)
          
          const formData = new FormData()
          formData.append('image', fileToUpload)
          
          // Try the original endpoint first, then fallback to the simpler one
          let uploadResponse = await fetch(`/api/places/${place.id}/upload-image`, {
            method: 'POST',
            body: formData,
          })
          
          // If 404, try the alternative endpoint
          if (uploadResponse.status === 404) {
            console.log("Original endpoint not found, trying alternative...")
            uploadResponse = await fetch(`/api/upload-place-image?placeId=${place.id}`, {
              method: 'POST',
              body: formData,
            })
          }
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            console.log("Photo uploaded successfully:", uploadResult.imageUrl)
            
            // Update the place object with the new image URL
            updatedPlaceData.image_url = uploadResult.imageUrl
            
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
        title: "Place updated",
        description: `${placeName} has been updated successfully.`,
      })

      // Create an updated place object with the new values
      const updatedPlace = {
        ...place,
        name: placeName,
        address: finalAddress,
        website_url: formattedWebsite,
        notes,
        // Preserve image_url from updatedPlaceData if it was updated
        image_url: updatedPlaceData.image_url || place.image_url,
      }

      if (coordinates) {
        updatedPlace.lat = coordinates.lat.toString()
        updatedPlace.lng = coordinates.lng.toString()
      }

      console.log("Final updated place object:", JSON.stringify(updatedPlace, null, 2))
      console.log("=== END UPDATE DEBUG ===")

      // Call the callback with the updated place
      if (onPlaceUpdated) {
        onPlaceUpdated(updatedPlace)
      }

      onClose()
    } catch (err) {
      console.error("Error updating place:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update place",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle place removal
  const handleRemovePlace = async () => {
    try {
      setIsDeleting(true)

      console.log(`Removing place with list_places ID: ${listPlaceId}`)

      // If we don't have listPlaceId, try to find it
      let actualListPlaceId = listPlaceId
      
      if (!actualListPlaceId && listId && place?.id) {
        console.log("listPlaceId is null, attempting to find it...")
        
        try {
          const response = await fetch(`/api/list-places?listId=${listId}&placeId=${place.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data?.id) {
              actualListPlaceId = data.id
              console.log("Found listPlaceId via API lookup:", actualListPlaceId)
            }
          }
        } catch (error) {
          console.error("Error looking up listPlaceId:", error)
        }
      }

      if (!actualListPlaceId) {
        throw new Error("Cannot remove place: Unable to find the relationship between this place and list. The place may have already been removed or there may be a data inconsistency.")
      }

      const response = await fetch(`/api/list-places?id=${actualListPlaceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove place")
      }

      console.log("Place removed successfully")
      
      // Call the callback to update the parent component FIRST
      if (onPlaceRemoved) {
        onPlaceRemoved(place.id)
      }

      // Then show the toast
      toast({
        title: "Place removed",
        description: `"${placeName}" has been removed from the list.`,
      })

      // Finally close all dialogs
      setShowDeleteConfirm(false)
      onClose()
    } catch (err) {
      console.error("Error removing place:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove place",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle location change
  const handleLocationChange = (location: { lat: number; lng: number } | null, newAddress?: string, source?: string) => {
    setCoordinates(location)
    if (newAddress) {
      setAddress(newAddress)
    }
    setShowMapPicker(false)
  }

  // Handle map picker
  const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
    setCoordinates(location)
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

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Edit Place</DialogTitle>
            <DialogDescription>
              Update the place details, location, or add photos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePlace} className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="placeName">Name *</Label>
                <Input
                  id="placeName"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Place name"
                  className="w-full min-w-0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Location
                  </Label>
                </div>

                <LocationPicker
                  value={coordinates}
                  onLocationChange={handleLocationChange}
                  photoFile={photoFile}
                  disabled={isSubmitting}
                />
                
                {/* Quick action button for map picker */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapPicker(true)}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Open Map Picker
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Input
                    id="website"
                    value={websiteUrl}
                    onChange={(e) => {
                      console.log("Website URL changed to:", e.target.value)
                      setWebsiteUrl(e.target.value)
                    }}
                    placeholder="https://example.com"
                    className="pl-8 w-full min-w-0"
                  />
                  <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 break-all">Current value: "{websiteUrl}"</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this place..."
                  rows={3}
                  className="w-full min-w-0 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              <div
                className={cn(
                  "mt-1 border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors",
                  photoPreview ? "border-gray-300" : "border-gray-200",
                )}
                onClick={handlePhotoButtonClick}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />

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
                      <span className="block text-xs mt-1">JPEG, PNG, or WebP (max 5MB)</span>
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

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from List
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this place?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{placeName}" from this list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRemovePlace}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
          <DialogContent className="sm:max-w-[800px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Pick Location on Map</DialogTitle>
              <DialogDescription>
                Click anywhere on the map to update the location for this place.
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
    </>
  )
}
