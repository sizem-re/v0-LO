"use client"

import { useState, useEffect } from "react"
import type { PlaceWithLists } from "@/types/database"
import { useAuth } from "@/lib/auth-context"

export function usePlaces(listId?: string) {
  const { isAuthenticated } = useAuth()
  const [places, setPlaces] = useState<PlaceWithLists[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlaces() {
      if (!isAuthenticated) {
        setPlaces([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const url = listId ? `/api/places?listId=${listId}` : "/api/places"
        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch places")
        }

        const data = await response.json()
        setPlaces(data)
      } catch (err) {
        console.error("Error fetching places:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [isAuthenticated, listId])

  async function createPlace(placeData: {
    name: string
    address: string
    description?: string
    type?: string
    website?: string
    lat: number
    lng: number
    image_url?: string
    listIds?: string[]
  }) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to create a place")
    }

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(placeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create place")
      }

      const newPlace = await response.json()
      setPlaces((prev) => [newPlace, ...prev])
      return newPlace
    } catch (err) {
      console.error("Error creating place:", err)
      throw err
    }
  }

  async function updatePlace(
    id: string,
    placeData: {
      name?: string
      address?: string
      description?: string
      type?: string
      website?: string
      lat?: number
      lng?: number
      image_url?: string
    },
  ) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to update a place")
    }

    try {
      const response = await fetch(`/api/places/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(placeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update place")
      }

      const updatedPlace = await response.json()
      setPlaces((prev) => prev.map((place) => (place.id === id ? { ...place, ...updatedPlace } : place)))
      return updatedPlace
    } catch (err) {
      console.error("Error updating place:", err)
      throw err
    }
  }

  async function deletePlace(id: string) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to delete a place")
    }

    try {
      const response = await fetch(`/api/places/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete place")
      }

      setPlaces((prev) => prev.filter((place) => place.id !== id))
      return true
    } catch (err) {
      console.error("Error deleting place:", err)
      throw err
    }
  }

  async function addPlaceToLists(placeId: string, listIds: string[]) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to add a place to lists")
    }

    try {
      const response = await fetch(`/api/places/${placeId}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add place to lists")
      }

      return true
    } catch (err) {
      console.error("Error adding place to lists:", err)
      throw err
    }
  }

  async function removePlaceFromLists(placeId: string, listIds: string[]) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to remove a place from lists")
    }

    try {
      const response = await fetch(`/api/places/${placeId}/lists`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove place from lists")
      }

      return true
    } catch (err) {
      console.error("Error removing place from lists:", err)
      throw err
    }
  }

  return {
    places,
    isLoading,
    error,
    createPlace,
    updatePlace,
    deletePlace,
    addPlaceToLists,
    removePlaceFromLists,
  }
}

export function usePlace(id: string) {
  const { isAuthenticated } = useAuth()
  const [place, setPlace] = useState<PlaceWithLists | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlace() {
      if (!isAuthenticated || !id) {
        setPlace(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/places/${id}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch place")
        }

        const data = await response.json()
        setPlace(data)
      } catch (err) {
        console.error("Error fetching place:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlace()
  }, [isAuthenticated, id])

  async function addToLists(listIds: string[]) {
    if (!isAuthenticated || !id) {
      throw new Error("You must be logged in to add a place to lists")
    }

    try {
      const response = await fetch(`/api/places/${id}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add place to lists")
      }

      // Refresh the place data
      const placeResponse = await fetch(`/api/places/${id}`)
      if (placeResponse.ok) {
        const updatedPlace = await placeResponse.json()
        setPlace(updatedPlace)
      }

      return true
    } catch (err) {
      console.error("Error adding place to lists:", err)
      throw err
    }
  }

  async function removeFromLists(listIds: string[]) {
    if (!isAuthenticated || !id) {
      throw new Error("You must be logged in to remove a place from lists")
    }

    try {
      const response = await fetch(`/api/places/${id}/lists`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove place from lists")
      }

      // Refresh the place data
      const placeResponse = await fetch(`/api/places/${id}`)
      if (placeResponse.ok) {
        const updatedPlace = await placeResponse.json()
        setPlace(updatedPlace)
      }

      return true
    } catch (err) {
      console.error("Error removing place from lists:", err)
      throw err
    }
  }

  return {
    place,
    isLoading,
    error,
    addToLists,
    removeFromLists,
  }
}
