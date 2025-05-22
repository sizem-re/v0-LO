"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Loader2, Camera, Check, Trash2, Link } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface EditPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  place: any
  listId: string
  onPlaceUpdated?: (updatedPlace: any) => void
  onPlaceRemoved?: (placeId: string) => void
}

export function EditPlaceModal({
  isOpen,
  onClose,
  place,
  listId,
  onPlaceUpdated,
  onPlaceRemoved,
}: EditPlaceModalProps) {
  const { dbUser } = useAuth()

  // Place details state
  const [placeName, setPlaceName] = useState(place?.name || "")
  const [address, setAddress] = useState(place?.address || "")
  const [website, setWebsite] = useState(place?.website || "")
  const [notes, setNotes] = useState(place?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Photo placeholder state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(place?.image || null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update state when place changes
  useEffect(() => {
    if (place) {
      setPlaceName(place.name || "")
      setAddress(place.address || "")
      setWebsite(place.website || "")
      setNotes(place.notes || "")
      setPhotoPreview(place.image || null)
    }
  }, [place])

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

    if (website && !isValidUrl(website)) {
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
      let formattedWebsite = website
      if (website && !website.match(/^https?:\/\//)) {
        formattedWebsite = `https://${website}`
      }

      console.log("Updating place:", {
        name: placeName,
        address,
        website: formattedWebsite,
        notes,
      })

      // First, update the place details if needed
      if (placeName !== place.name || address !== place.address || formattedWebsite !== place.website) {
        const placeUpdateResponse = await fetch(`/api/places/${place.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: placeName,
            address,
            website: formattedWebsite,
          }),
        })

        if (!placeUpdateResponse.ok) {
          const errorData = await placeUpdateResponse.json()
          throw new Error(errorData.error || "Failed to update place")
        }
      }

      // Then, update the list-place relationship (notes)
      const listPlaceId = place.listPlaceId || place.list_place_id

      if (listPlaceId) {
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

      // TODO: Handle photo upload when backend is ready
      if (photoFile) {
        console.log("Photo will be uploaded in a future update:", photoFile.name)
      }

      toast({
        title: "Place updated",
        description: `${placeName} has been updated successfully.`,
      })

      // Call the callback with the updated place
      if (onPlaceUpdated) {
        onPlaceUpdated({
          ...place,
          name: placeName,
          address,
          website: formattedWebsite,
          notes,
          // image: photoPreview, // Will be added when photo upload is implemented
        })
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
      const listPlaceId = place.listPlaceId || place.list_place_id

      console.log(`Removing place with list_places ID: ${listPlaceId}`)

      const response = await fetch(`/api/list-places?id=${listPlaceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove place")
      }

      console.log("Place removed successfully")
      toast({
        title: "Place removed",
        description: `"${placeName}" has been removed from the list.`,
      })

      if (onPlaceRemoved) {
        onPlaceRemoved(place.id)
      }

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

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Place</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePlace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placeName">Name *</Label>
              <Input
                id="placeName"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Place name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-8"
                />
                <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this place..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (coming soon)</Label>
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
                      <span className="block text-xs mt-1">(Photo uploads will be available soon)</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from List
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
