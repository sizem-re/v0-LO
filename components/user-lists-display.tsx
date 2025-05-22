"use client"

import { useState, useEffect } from "react"
import { ListIcon, Globe, Users, Lock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

interface List {
  id: string
  title: string
  description: string | null
  visibility: "public" | "community" | "private"
  places_count: number
}

interface UserListsDisplayProps {
  compact?: boolean
  onCreateList?: () => void
  onSelectList?: (listId: string) => void
}

export function UserListsDisplay({ compact = false, onCreateList, onSelectList }: UserListsDisplayProps) {
  const { user, isAuthenticated } = useAuth()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      if (!isAuthenticated || !user) {
        setLists([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/lists")

        if (!response.ok) {
          throw new Error(`Failed to fetch lists: ${response.status}`)
        }

        const data = await response.json()
        setLists(data.lists || [])
      } catch (err) {
        console.error("Error fetching lists:", err)
        setError(err instanceof Error ? err.message : "Failed to load lists")
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [user, isAuthenticated])

  const handleSelectList = (listId: string) => {
    if (onSelectList) {
      onSelectList(listId)
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe size={14} className="text-green-600" />
      case "community":
        return <Users size={14} className="text-blue-600" />
      case "private":
        return <Lock size={14} className="text-gray-600" />
      default:
        return <Globe size={14} className="text-green-600" />
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">Connect with Farcaster to create and manage lists</p>
        <Button className="bg-black text-white hover:bg-black/80">Connect</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-2 border border-transparent">
            <Skeleton className="h-10 w-10 rounded mr-3" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">You haven't created any lists yet</p>
        <Button className="bg-black text-white hover:bg-black/80" onClick={onCreateList}>
          <Plus size={16} className="mr-1" /> Create Your First List
        </Button>
      </div>
    )
  }

  return (
    <div>
      {!compact && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Your Lists ({lists.length})</h3>
          <Button
            className="bg-black text-white hover:bg-black/80 text-xs py-1 h-8 flex items-center"
            onClick={onCreateList}
          >
            <Plus size={14} className="mr-1" /> Create List
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className="p-2 border border-black/10 rounded hover:bg-black/5 cursor-pointer"
            onClick={() => handleSelectList(list.id)}
          >
            <div className="flex items-center">
              <div className="bg-black/5 rounded p-2 mr-3">
                <ListIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm truncate">{list.title}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-xs text-black/60">
                    {getVisibilityIcon(list.visibility)}
                    <span className="ml-1 hidden sm:inline">{list.visibility}</span>
                  </div>
                  <div className="text-xs text-black/60">
                    {list.places_count} {list.places_count === 1 ? "place" : "places"}
                  </div>
                </div>
              </div>
            </div>
            {!compact && list.description && (
              <p className="text-xs text-black/70 mt-1 ml-10 truncate">{list.description}</p>
            )}
          </div>
        ))}
      </div>

      {compact && (
        <div className="mt-4 text-center">
          <Button className="bg-black text-white hover:bg-black/80 w-full" onClick={onCreateList}>
            <Plus size={16} className="mr-1" /> Create List
          </Button>
        </div>
      )}
    </div>
  )
}
