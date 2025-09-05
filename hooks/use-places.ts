"use client"

import { useState, useEffect } from "react"

export interface Place {
  id: string
  name: string
  address: string
  type: string
  coordinates: {
    lat: number
    lng: number
  }
  photo_url?: string
}

export function usePlaces(listId?: string) {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // In a real app, this would be an API call
        // For now, we'll just simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Sample data
        const samplePlaces: Place[] = [
          {
            id: "p1",
            name: "Central Park",
            address: "New York, NY",
            type: "Park",
            coordinates: { lat: 40.7812, lng: -73.9665 },
          },
          {
            id: "p2",
            name: "Empire State Building",
            address: "350 5th Ave, New York, NY 10118",
            type: "Landmark",
            coordinates: { lat: 40.7484, lng: -73.9857 },
          },
          {
            id: "p3",
            name: "Brooklyn Bridge",
            address: "Brooklyn Bridge, New York, NY 10038",
            type: "Landmark",
            coordinates: { lat: 40.7061, lng: -73.9969 },
          },
        ]

        // If listId is provided, filter places (in a real app, this would be done by the API)
        if (listId) {
          // For demo purposes, just return the first two places for any listId
          setPlaces(samplePlaces.slice(0, 2))
        } else {
          setPlaces(samplePlaces)
        }
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch places"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [listId])

  return { places, isLoading, error }
}
