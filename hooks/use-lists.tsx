"use client"

import { useState, useEffect } from "react"
import type { ListWithPlaces } from "@/types/database"
import { useAuth } from "@/lib/auth-context"

export function useLists(includePublic = false) {
  const { isAuthenticated } = useAuth()
  const [lists, setLists] = useState<ListWithPlaces[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLists() {
      if (!isAuthenticated) {
        setLists([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lists?includePublic=${includePublic}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch lists")
        }

        const data = await response.json()
        setLists(data)
      } catch (err) {
        console.error("Error fetching lists:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [isAuthenticated, includePublic])

  async function createList(listData: { title: string; description?: string; privacy?: string }) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to create a list")
    }

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }

      const newList = await response.json()
      setLists((prev) => [newList, ...prev])
      return newList
    } catch (err) {
      console.error("Error creating list:", err)
      throw err
    }
  }

  async function updateList(id: string, listData: { title?: string; description?: string; privacy?: string }) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to update a list")
    }

    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update list")
      }

      const updatedList = await response.json()
      setLists((prev) => prev.map((list) => (list.id === id ? { ...list, ...updatedList } : list)))
      return updatedList
    } catch (err) {
      console.error("Error updating list:", err)
      throw err
    }
  }

  async function deleteList(id: string) {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to delete a list")
    }

    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete list")
      }

      setLists((prev) => prev.filter((list) => list.id !== id))
      return true
    } catch (err) {
      console.error("Error deleting list:", err)
      throw err
    }
  }

  return {
    lists,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
  }
}

export function useList(id: string) {
  const { isAuthenticated } = useAuth()
  const [list, setList] = useState<ListWithPlaces | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchList() {
      if (!isAuthenticated || !id) {
        setList(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lists/${id}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch list")
        }

        const data = await response.json()
        setList(data)
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [isAuthenticated, id])

  return {
    list,
    isLoading,
    error,
  }
}
