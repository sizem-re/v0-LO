"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PageLayout } from "@/components/page-layout"
import Link from "next/link"
import { Loader2, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { v4 as uuidv4 } from "uuid"

// Dynamically import the location picker with no SSR
const VanillaLocationPicker = dynamic(() => import("@/components/map/vanilla-location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border border-black/10 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

interface ListData {
  id: string
  title: string
  owner_id: string
}

export default function AddPlaceToListPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [list, setList] = useState<ListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [placeName, setPlaceName] = useState("")
  const [placeType, setPlaceType] = useState("")
  const [placeDescription, setPlaceDescription] = useState("")
  const [placeWebsite, setPlaceWebsite] = useState("")
  const [placeNotes, setPlaceNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchList = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/lists/${params.id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch list: ${response.statusText}`)
        }

        const data = await response.json()
        setList(data)

        // Check if user is the owner
        if (data.owner.id !== user?.id) {
          setError("You don't have permission to add places to this list")
        }
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [params.id, isAuthenticated, router, user?.id])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      // Use Nominatim for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (err) {
      console.error("Error searching locations:", err)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectSearchResult = (result: any) => {
    setSelectedLocation({
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
      address: result.display_name,
    })
    setPlaceName(result.name || result.display_name.split(",")[0])
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLocation || !placeName || !user?.id) {
      return
    }

    try {
      setSubmitting(true)

      // 1. Create the place
      const placeId = uuidv4()
      const placeResponse = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: placeId,
          name: placeName,
          type: placeType,
          description: placeDescription,
          address: selectedLocation.address,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          website_url: placeWebsite,
          created_by: user.id,
        }),
      })

      if (!placeResponse.ok) {
        throw new Error("Failed to create place")
      }

      // 2. Add the place to the list
      const listPlaceResponse = await fetch("/api/list-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId: params.id,
          placeId: placeId,
          userId: user.id,
          note: placeNotes,
        }),
      })

      if (!listPlaceResponse.ok) {
        throw new Error("Failed to add place to list")
      }

      // 3. Redirect back to the list page
      router.push(`/lists/${params.id}`)
    } catch (err) {
      console.error("Error adding place to list:", err)
      alert("Failed to add place to list. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !list) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error || "Failed to load list"}</p>
            <Link href="/lists" className="text-red-700 underline mt-4 inline-block">
              Back to lists
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/lists/${params.id}`} className="text-sm hover:underline mb-4 inline-block">
          ← Back to list
        </Link>

        <h1 className="text-3xl font-serif mb-6">Add Place to "{list.title}"</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Search for a location</h2>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search for a place..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 border border-black/10 rounded-md overflow-hidden">
                  <ul>
                    {searchResults.map((result) => (
                      <li
                        key={result.place_id}
                        className="p-3 hover:bg-black/5 cursor-pointer border-b border-black/10 last:border-b-0"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <p className="font-medium">{result.name || result.display_name.split(",")[0]}</p>
                        <p className="text-sm text-black/60">{result.display_name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Select on map</h2>
              <VanillaLocationPicker
                height="400px"
                initialLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium mb-4">Place details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-1">
                  Type
                </label>
                <Input
                  id="type"
                  type="text"
                  placeholder="Restaurant, Park, Museum, etc."
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full p-2 border border-black/20 rounded-md"
                  rows={3}
                  value={placeDescription}
                  onChange={(e) => setPlaceDescription(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium mb-1">
                  Website
                </label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://..."
                  value={placeWebsite}
                  onChange={(e) => setPlaceWebsite(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="w-full p-2 border border-black/20 rounded-md"
                  rows={3}
                  placeholder="Your personal notes about this place..."
                  value={placeNotes}
                  onChange={(e) => setPlaceNotes(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={!selectedLocation || !placeName || submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Place to List
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
