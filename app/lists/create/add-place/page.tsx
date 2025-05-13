"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Textarea } from "../../../../components/ui/textarea"
import { Label } from "../../../../components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import the location picker with no SSR
const VanillaLocationPicker = dynamic(() => import("../../../../components/map/vanilla-location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export default function AddPlacePage() {
  const [placeData, setPlaceData] = useState({
    name: "",
    type: "",
    address: "",
    website: "",
    notes: "",
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlaceData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setPlaceData((prev) => ({
      ...prev,
      coordinates: location,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would connect to your backend API
    console.log("Place submitted:", placeData)
    // Redirect to the list page
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/lists/create" className="text-sm hover:underline mb-4 inline-block">
          ← Back to list creation
        </Link>
        <h1 className="text-3xl font-serif">Add a Place</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="block mb-2 font-medium">
                Place Name
              </Label>
              <Input
                id="name"
                name="name"
                value={placeData.name}
                onChange={handleChange}
                className="lo-input"
                required
              />
            </div>

            <div>
              <Label htmlFor="type" className="block mb-2 font-medium">
                Type
              </Label>
              <Input
                id="type"
                name="type"
                value={placeData.type}
                onChange={handleChange}
                className="lo-input"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="block mb-2 font-medium">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={placeData.address}
                onChange={handleChange}
                className="lo-input"
                required
              />
            </div>

            <div>
              <Label htmlFor="website" className="block mb-2 font-medium">
                Website (Optional)
              </Label>
              <Input
                id="website"
                name="website"
                value={placeData.website}
                onChange={handleChange}
                className="lo-input"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="block mb-2 font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={placeData.notes}
                onChange={handleChange}
                className="lo-input"
                rows={4}
              />
            </div>
          </div>

          <div>
            <Label className="block mb-2 font-medium">Location</Label>
            <p className="text-sm text-black/70 mb-4">Click on the map to set the location of this place.</p>
            <VanillaLocationPicker
              initialLocation={placeData.coordinates}
              onLocationChange={handleLocationChange}
              height="400px"
            />
            <div className="mt-2 text-sm text-black/70">
              Coordinates: {placeData.coordinates.lat.toFixed(6)}, {placeData.coordinates.lng.toFixed(6)}
            </div>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <Button type="submit" className="lo-button">
            Add Place
          </Button>
          <Link href="/lists/create">
            <Button type="button" className="lo-button bg-transparent">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
