"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { MapPin, Upload } from "lucide-react"

export default function AddPlacePage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [placeData, setPlaceData] = useState({
    name: "",
    type: "",
    address: "",
    website: "",
    notes: "",
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    // This would connect to your AI completion API
    // For now, we'll simulate a response after a delay
    setTimeout(() => {
      setIsSearching(false)
      if (searchQuery.toLowerCase().includes("cafe")) {
        setSearchResults([
          {
            name: "Urban Grind Cafe",
            type: "Cafe",
            address: "123 Main St, Seattle, WA",
            coordinates: { lat: 47.6062, lng: -122.3321 },
          },
          {
            name: "The Coffee Lab",
            type: "Cafe",
            address: "456 Pike St, Seattle, WA",
            coordinates: { lat: 47.6102, lng: -122.3426 },
          },
        ])
      } else {
        setSearchResults([])
      }
    }, 1500)
  }

  const selectPlace = (place: any) => {
    setPlaceData({
      name: place.name,
      type: place.type,
      address: place.address,
      website: "",
      notes: "",
    })
    setSearchResults([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlaceData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would connect to your backend API
    console.log("Place submitted:", placeData)
    // Redirect to the list page
  }

  return (
    <main className="min-h-screen p-4">
      <header className="border-b border-black pb-4 mb-8">
        <div className="flex items-center">
          <Link href={`/lists/${params.id}`} className="mr-4">
            <Button variant="outline" className="rounded-none border border-black">
              ← BACK
            </Button>
          </Link>
          <h1 className="text-4xl font-bold uppercase tracking-tight">ADD PLACE</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card className="brutalist-card mb-8">
          <form onSubmit={handleSearch} className="p-4">
            <Label htmlFor="search" className="text-lg font-bold block mb-2">
              SEARCH FOR A PLACE
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Cafe Allegro Seattle"
                className="brutalist-input flex-1"
              />
              <Button
                type="submit"
                disabled={isSearching || !searchQuery}
                className="bg-black text-white hover:bg-gray-800 rounded-none border border-black"
              >
                {isSearching ? "SEARCHING..." : "SEARCH"}
              </Button>
            </div>
            <p className="text-sm mt-2">Try searching for "cafe" to see demo results</p>
          </form>
        </Card>

        {searchResults.length > 0 && (
          <Card className="brutalist-card mb-8">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">SEARCH RESULTS</h2>
              <div className="space-y-4">
                {searchResults.map((place, index) => (
                  <div
                    key={index}
                    className="p-3 border-2 border-black cursor-pointer hover:bg-gray-100"
                    onClick={() => selectPlace(place)}
                  >
                    <h3 className="font-bold">{place.name}</h3>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{place.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="brutalist-card mb-8">
            <div className="p-4 space-y-6">
              <div>
                <Label htmlFor="name" className="text-lg font-bold block mb-2">
                  PLACE NAME
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={placeData.name}
                  onChange={handleChange}
                  placeholder="e.g., Cafe Allegro"
                  required
                  className="brutalist-input w-full"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-lg font-bold block mb-2">
                  TYPE
                </Label>
                <Input
                  id="type"
                  name="type"
                  value={placeData.type}
                  onChange={handleChange}
                  placeholder="e.g., Cafe, Restaurant, Park"
                  required
                  className="brutalist-input w-full"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-lg font-bold block mb-2">
                  ADDRESS
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={placeData.address}
                  onChange={handleChange}
                  placeholder="Full address"
                  required
                  className="brutalist-input w-full"
                />
              </div>

              <div>
                <Label htmlFor="website" className="text-lg font-bold block mb-2">
                  WEBSITE (OPTIONAL)
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={placeData.website}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="brutalist-input w-full"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-lg font-bold block mb-2">
                  NOTES (OPTIONAL)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={placeData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this place..."
                  className="brutalist-input w-full min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-lg font-bold block mb-2">PHOTOS (OPTIONAL)</Label>
                <div className="border-2 border-dashed border-black p-8 text-center">
                  <Upload className="mx-auto h-8 w-8 mb-2" />
                  <p>Drag & drop photos here or click to upload</p>
                  <Button type="button" variant="outline" className="mt-4 rounded-none border border-black">
                    UPLOAD PHOTOS
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href={`/lists/${params.id}`}>
              <Button type="button" variant="outline" className="rounded-none border border-black">
                CANCEL
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!placeData.name || !placeData.address}
              className="bg-black text-white hover:bg-gray-800 rounded-none border border-black"
            >
              ADD PLACE
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
