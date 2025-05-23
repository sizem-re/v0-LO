"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [name, setName] = useState(place?.name || "")
  const [address, setAddress] = useState(place?.address || "")
  const [websiteUrl, setWebsiteUrl] = useState(place?.website_url || "")
  const [notes, setNotes] = useState(place?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (place) {
      setName(place.name || "")
      setAddress(place.address || "")
      setWebsiteUrl(place.website_url || "")
      setNotes(place.notes || "")
    }
  }, [place])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Place name is required")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare the update data
      const updateData: Record<string, any> = {
        name,
        address,
        notes,
      }

      // Only include website_url if it's not empty
      if (websiteUrl.trim()) {
        updateData.website_url = websiteUrl
      }

      console.log("Updating place with data:", updateData)

      const response = await fetch(`/api/places/${place.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        console.error("Error updating place:", errorData)

        // If there's an issue with the website_url field, try again without it
        if (errorData.message?.includes("website") || errorData.message?.includes("website_url")) {
          console.log("Retrying update without website_url field")

          // Remove website_url from the update data
          delete updateData.website_url

          const retryResponse = await fetch(`/api/places/${place.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          })

          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => ({ error: "Failed to parse error response" }))
            throw new Error(retryErrorData.error || retryErrorData.message || "Failed to update place")
          }

          const updatedPlace = await retryResponse.json()

          if (onPlaceUpdated) {
            onPlaceUpdated(updatedPlace)
          }

          toast({
            title: "Place updated",
            description: "The place has been updated successfully (without website URL).",
          })

          onClose()
          return
        }

        throw new Error(errorData.error || errorData.message || "Failed to update place")
      }

      const updatedPlace = await response.json()

      if (onPlaceUpdated) {
        onPlaceUpdated(updatedPlace)
      }

      toast({
        title: "Place updated",
        description: "The place has been updated successfully.",
      })

      onClose()
    } catch (err) {
      console.error("Error in handleSubmit:", err)
      setError(err instanceof Error ? err.message : "Failed to update place")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update place",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      const response = await fetch(`/api/list-places`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id: listId,
          place_id: place.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove place from list")
      }

      if (onPlaceRemoved) {
        onPlaceRemoved(place.id)
      }

      toast({
        title: "Place removed",
        description: "The place has been removed from the list.",
      })

      onClose()
    } catch (err) {
      console.error("Error in handleDelete:", err)
      setError(err instanceof Error ? err.message : "Failed to remove place")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove place",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Place</DialogTitle>
          <DialogDescription>Update the details for this place.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Place name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this place"
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                Remove from list
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Place</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this place from the list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
