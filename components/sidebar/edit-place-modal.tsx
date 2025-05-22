"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface EditPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  place: any
  listId: string
  onPlaceUpdated?: (updatedPlace: any) => void
}

export function EditPlaceModal({ isOpen, onClose, place, listId, onPlaceUpdated }: EditPlaceModalProps) {
  const [name, setName] = useState(place?.name || "")
  const [address, setAddress] = useState(place?.address || "")
  const [website, setWebsite] = useState(place?.website || "")
  const [notes, setNotes] = useState(place?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (place) {
      setName(place.name || "")
      setAddress(place.address || "")
      setWebsite(place.website || "")
      setNotes(place.notes || "")
    }
  }, [place])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (website && !isValidUrl(website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Format website URL if needed
      let formattedWebsite = website
      if (website && !website.match(/^https?:\/\//)) {
        formattedWebsite = `https://${website}`
      }

      const updateData = {
        listId,
        placeId: place.id,
        updates: {
          name,
          address,
          website: formattedWebsite,
          notes,
        },
      }

      console.log("Updating place:", updateData)

      const response = await fetch(`/api/list-places`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update place")
      }

      const updatedPlace = await response.json()
      console.log("Place updated successfully:", updatedPlace)

      if (onPlaceUpdated) {
        onPlaceUpdated({
          ...place,
          ...updateData.updates,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Place</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Place name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && <p className="text-red-500 text-xs">{errors.website}</p>}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
