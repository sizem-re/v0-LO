"use client"

import { useState, useEffect } from "react"

export interface List {
  id: string
  title: string
  description: string | null
  visibility: string
  places_count: number
}

export function useLists(userId?: string) {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      if (!userId) {
        // If no userId, return sample data
        setLists([
          {
            id: "1",
            title: "Popular Restaurants",
            description: "Best places to eat",
            visibility: "public",
            places_count: 5,
          },
          {
            id: "2",
            title: "Weekend Getaways",
            description: "Perfect weekend trips",
            visibility: "public",
            places_count: 3,
          },
        ])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // In a real app, this would be an API call
        // For now, we'll just simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 500))

        setLists([
          {
            id: "3",
            title: "My Favorite Cafes",
            description: "Great coffee spots",
            visibility: "private",
            places_count: 4,
          },
          {
            id: "4",
            title: "Places to Visit",
            description: "Travel bucket list",
            visibility: "private",
            places_count: 7,
          },
        ])
      } catch (err) {
        console.error("Error fetching lists:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch lists"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [userId])

  return { lists, isLoading, error }
}
