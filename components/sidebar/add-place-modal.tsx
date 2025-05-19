"use client"

import type React from "react"

import { useState } from "react"
import { X, MapPin, Camera, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateListModal } from "./create-list-modal"
import { LocationPickerModal } from "./location-picker-modal"
import { useLists } from "@/hooks/use-lists"
import { usePlaces } from "@/hooks/use-places"

interface AddPlaceModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function AddPlaceModal({ onClose, onSuccess }: AddPlaceModalProps) {
  const { lists, isLoading: listsLoading } = useLists()
  const { createPlace } = usePlaces()

  const [step, setStep] = useState<"details" | "lists">("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    type: "",
    website: "",
    coordinates: { lat: 0, lng: 0 },
    image: null as File | null,
  })
  const [selectedLists, setSelectedLists] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [hasSetLocation, setHasSetLocation] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Count how many lists are selected
  const selectedListCount = Object.values(selectedLists).filter(Boolean).length

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, image: e.target.files![0] }))
    }
  }

  const handleListToggle = (listId: string) => {
    setSelectedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }))

    // Clear list error if at least one list is selected
    if (errors.lists && !selectedLists[listId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.lists
        return newErrors
      })
    }
  }

  const handleNewListCreated = (listId: string) => {
    // Automatically select the new list
    setSelectedLists((prev) => ({
      ...prev,
      [listId]: true,
    }))
  }

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng },
      // Update address if provided from geocoding
      ...(location.address ? { address: location.address } : {}),
    }))
    setHasSetLocation(true)

    // Clear location error
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.location
        return newErrors
      })
    }
  }

  const validateDetailsForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.type.trim()) {
      newErrors.type = "Type is required"
    }

    if (!hasSetLocation) {
      newErrors.location = "Please set a location on the map"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateDetailsForm()) {
      setStep("lists")
    }
  }

  const handleBack = () => {
    setStep("details")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedListCount === 0) {
      setErrors((prev) => ({ ...prev, lists: "Please select at least one list" }))
      return
    }

    setIsSubmitting(true)

    try {
      // Get the list IDs that were selected
      const listIds = Object.entries(selectedLists)
        .filter(([_, isSelected]) => isSelected)
        .map(([listId]) => listId)

      // Upload image if provided
      let imageUrl = undefined
      if (formData.image) {
        // In a real app, you would upload the image to a storage service
        // and get back a URL. For this example, we'll just use a placeholder.
        imageUrl = "/placeholder.svg?height=200&width=300"
      }

      // Create the place
      await createPlace({
        name: formData.name,
        address: formData.address,
        description: formData.description || undefined,
        type: formData.type || undefined,
        website: formData.website || undefined,
        lat: formData.coordinates.lat,
        lng: formData.coordinates.lng,
        image_url: imageUrl,
        listIds,
      })

      setSuccessMessage(`${formData.name} has been added to ${selectedListCount} list(s)`)

      // Close after a short delay or show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Error creating place:", err)
      setErrors((prev) => ({
        ...prev,
        submit: err instanceof Error ? err.message : "Failed to create place",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">{step === "details" ? "Add New Place" : "Add to Lists"}</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {successMessage && (
            <div className="m-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">{successMessage}</div>
          )}

          {step === "details" ? (
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="block mb-1 font-medium">
                    Place Name*
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`border-black/20 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="e.g. Lighthouse Coffee"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="type" className="block mb-1 font-medium">
                    Type*
                  </Label>
                  <Input
                    type="text"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`border-black/20 ${errors.type ? "border-red-500" : ""}`}
                    placeholder="e.g. Cafe, Restaurant, Park"
                  />
                  {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="block mb-1 font-medium">
                    Address*
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`border-black/20 ${errors.address ? "border-red-500" : ""}`}
                    placeholder="e.g. 123 Main St, City"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="block mb-1 font-medium">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="border-black/20"
                    placeholder="Tell us about this place..."
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="block mb-1 font-medium">
                    Website (Optional)
                  </Label>
                  <Input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="border-black/20"
                    placeholder="e.g. https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="image" className="block mb-1 font-medium">
                    Add Photo (Optional)
                  </Label>
                  <div className="mt-1 flex items-center">
                    <label
                      htmlFor="image"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-black/20 rounded-md cursor-pointer hover:bg-black/5"
                    >
                      {formData.image ? (
                        <div className="w-full h-full relative">
                          <img
                            src={URL.createObjectURL(formData.image) || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="h-8 w-8 text-black/40" />
                          <span className="mt-2 text-sm text-black/60">Upload a photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="block mb-1 font-medium">Location*</Label>
                  <div
                    className={`h-40 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors ${
                      errors.location ? "border-2 border-red-500" : ""
                    }`}
                    onClick={() => setShowLocationPicker(true)}
                  >
                    {hasSetLocation ? (
                      <div className="text-center">
                        <div className="font-medium">Location set</div>
                        <div className="text-sm text-black/60">
                          {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                        </div>
                        <div className="mt-2 text-sm text-black/80 underline">Click to edit</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-black/60">
                        <MapPin className="h-6 w-6 mb-2" />
                        <span>Set location on map</span>
                      </div>
                    )}
                  </div>
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="mb-4">
                Select at least one list to add <strong>{formData.name}</strong> to:
              </p>

              {errors.lists && <p className="text-red-500 text-sm mb-4">{errors.lists}</p>}
              {errors.submit && <p className="text-red-500 text-sm mb-4">{errors.submit}</p>}

              {listsLoading ? (
                <div className="py-8 text-center text-black/60">Loading your lists...</div>
              ) : lists.length === 0 ? (
                <div className="text-center py-8 border border-black/10 rounded">
                  <p className="text-black/60 mb-4">You don't have any lists yet</p>
                  <Button
                    className="bg-black text-white hover:bg-black/80"
                    onClick={() => setShowCreateListModal(true)}
                  >
                    <Plus size={16} className="mr-1" /> Create Your First List
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {lists.map((list) => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={!!selectedLists[list.id]}
                        onCheckedChange={() => handleListToggle(list.id)}
                      />
                      <Label
                        htmlFor={`list-${list.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {list.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {lists.length > 0 && (
                <div className="border-t border-black/10 pt-4">
                  <Button
                    type="button"
                    className="bg-black text-white hover:bg-black/80 w-full flex items-center justify-center"
                    onClick={() => setShowCreateListModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create New List
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/10 flex gap-3">
          {step === "details" ? (
            <Button type="button" className="flex-1 bg-black text-white hover:bg-black/80" onClick={handleContinue}>
              Continue
            </Button>
          ) : (
            <>
              <Button
                type="button"
                className="bg-transparent text-black border border-black/20 hover:bg-black/5"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-black text-white hover:bg-black/80"
                onClick={handleSubmit}
                disabled={selectedListCount === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  "Adding..."
                ) : (
                  <>
                    Add to {selectedListCount} {selectedListCount === 1 ? "List" : "Lists"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {showCreateListModal && (
        <CreateListModal onClose={() => setShowCreateListModal(false)} onSuccess={handleNewListCreated} />
      )}

      {showLocationPicker && (
        <LocationPickerModal
          onClose={() => setShowLocationPicker(false)}
          initialLocation={hasSetLocation ? formData.coordinates : undefined}
          initialAddress={formData.address}
          onLocationSelect={handleLocationSelect}
        />
      )}
    </div>
  )
}
