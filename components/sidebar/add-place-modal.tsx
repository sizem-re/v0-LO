"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LocationPicker } from "../map/location-picker"

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
  zip: string
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
  onPlaceAdded: (place: any) => void
  listId?: string
}

export function AddPlaceModal({ isOpen, onClose, onPlaceAdded, listId }: AddPlaceModalProps) {
  const { dbUser } = useAuth()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [type, setType] = useState("Place")
  const [description, setDescription] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvancedAddress, setShowAdvancedAddress] = useState(false)
  const [addressComponents, setAddressComponents] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  })

  const handleLocationSelected = (location: { lat: number; lng: number; address?: string }) => {
    setCoordinates({ lat: location.lat, lng: location.lng })
    if (location.address) {
      setAddress(location.address)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  const handleAdvancedAddressChange = (field: keyof typeof addressComponents, value: string) => {
    setAddressComponents((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Update the main address field
    const { street, city, state, zip, country } = { ...addressComponents, [field]: value }
    const parts = [street, city, state, zip, country].filter(Boolean)
    setAddress(parts.join(", "))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dbUser?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add a place.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the place.",
        variant: "destructive",
      })
      return
    }

    if (!coordinates) {
      toast({
        title: "Location required",
        description: "Please select a location on the map.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // First, create the place
      const placeResponse = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          address,
          lat: coordinates.lat,
          lng: coordinates.lng,
          type,
          description,
          website_url: websiteUrl,
          created_by: dbUser.id, // Add the user ID as created_by
        }),
      })

      if (!placeResponse.ok) {
        const errorData = await placeResponse.json()
        throw new Error(errorData.error || "Failed to create place")
      }

      const place = await placeResponse.json()

      // If a listId is provided, add the place to that list
      if (listId) {
        const listPlaceResponse = await fetch("/api/list-places", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            list_id: listId,
            place_id: place.id,
            added_by: dbUser.id,
            notes: description,
          }),
        })

        if (!listPlaceResponse.ok) {
          const errorData = await listPlaceResponse.json()
          throw new Error(errorData.error || "Failed to add place to list")
        }
      }

      toast({
        title: "Place added",
        description: `${name} has been added successfully.`,
      })

      onPlaceAdded(place)
      onClose()
    } catch (error) {
      console.error("Error adding place:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add place",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Place</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter place name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="address">Address</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedAddress(!showAdvancedAddress)}
                className="text-xs"
              >
                {showAdvancedAddress ? "Simple Address" : "Advanced Address"}
              </Button>
            </div>

            {!showAdvancedAddress ? (
              <Input
                id="address"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter address"
                disabled={isLoading}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  id="street"
                  value={addressComponents.street}
                  onChange={(e) => handleAdvancedAddressChange("street", e.target.value)}
                  placeholder="Street"
                  disabled={isLoading}
                  className="mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="city"
                    value={addressComponents.city}
                    onChange={(e) => handleAdvancedAddressChange("city", e.target.value)}
                    placeholder="City"
                    disabled={isLoading}
                  />
                  <Input
                    id="state"
                    value={addressComponents.state}
                    onChange={(e) => handleAdvancedAddressChange("state", e.target.value)}
                    placeholder="State/Province"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="zip"
                    value={addressComponents.zip}
                    onChange={(e) => handleAdvancedAddressChange("zip", e.target.value)}
                    placeholder="ZIP/Postal Code"
                    disabled={isLoading}
                  />
                  <Input
                    id="country"
                    value={addressComponents.country}
                    onChange={(e) => handleAdvancedAddressChange("country", e.target.value)}
                    placeholder="Country"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Place type (e.g., Restaurant, Park)"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading}
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="border rounded-md overflow-hidden h-[200px]">
              <LocationPicker onLocationSelected={handleLocationSelected} />
            </div>
            {coordinates && (
              <p className="text-xs text-gray-500">
                Selected: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name || !coordinates}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Place"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
