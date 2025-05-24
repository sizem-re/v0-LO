"use client"

import { useState, useEffect } from "react"
import type { Place } from "@/types/place"
import { fetchPlaces } from "@/lib/place-utils"

export function usePlaces(listId?: string) {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadPlaces = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // If listId is provided, fetch places for that specific list
        if (listId) {
          const response = await fetch(`/api/lists/${listId}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch list: ${response.status}`)
          }
          
          const listData = await response.json()
          const listPlaces = listData.places || []
          
          // Transform the list places to match the expected format
          const transformedPlaces: Place[] = listPlaces.map((place: any) => ({
            id: place.id,
            name: place.name,
            type: place.type,
            address: place.address || "",
            coordinates: place.coordinates || { lat: 0, lng: 0 },
            description: place.description || "",
            website: place.website || "",
          }))
          
          setPlaces(transformedPlaces)
          return
        }

        // Otherwise fetch all places using the utility function
        const placesData = await fetchPlaces()
        setPlaces(placesData)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch places"))
      } finally {
        setIsLoading(false)
      }
    }

    loadPlaces()
  }, [listId])

  return { places, isLoading, error }
}
