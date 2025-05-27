"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Globe, Users, Lock, Edit, ListIcon, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useNeynarContext } from "@neynar/react"

interface List {
  id: string
  title: string
  description: string | null
  visibility: string
  created_at: string
  owner_id: string
  cover_image_url: string | null
  places: { id: string; place: any }[]
}

interface UserListsDisplayProps {
  compact?: boolean
  onCreateList?: () => void
  onSelectList?: (listId: string) => void
  className?: string
}

export function UserListsDisplay({
  compact = false,
  onCreateList,
  onSelectList,
  className = "",
}: UserListsDisplayProps) {
  const { dbUser } = useAuth()
  const { user, isAuthenticated: neynarAuthenticated } = useNeynarContext()
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      if (!dbUser?.id && !user?.fid) {
        console.log("UserListsDisplay: No user ID or FID available")
        setIsLoading(false)
        return
      }

      try {
        // Use fid if available, otherwise use dbUser.id
        const queryParam = user?.fid ? `fid=${user.fid}` : dbUser?.id ? `userId=${dbUser.id}` : ""

        if (!queryParam) {
          console.log("UserListsDisplay: No valid query parameter")
          setIsLoading(false)
          return
        }

        console.log(`UserListsDisplay: Fetching lists with query: ${queryParam}`)
        console.log("UserListsDisplay: dbUser:", dbUser)
        console.log("UserListsDisplay: neynar user:", user)
        
        const response = await fetch(`/api/lists?${queryParam}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch lists: ${response.status}`)
        }

        const data = await response.json()
        console.log("UserListsDisplay: Lists data received:", data)
        setLists(data || [])
      } catch (err) {
        console.error("UserListsDisplay: Error fetching lists:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [dbUser?.id, user?.fid])

  const handleSelectList = (listId: string) => {
    if (onSelectList) {
      onSelectList(listId)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={compact ? "p-2" : "p-3 border border-black/10 rounded-md"}>
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-md mr-3" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-red-500 mb-2">Error loading lists: {error}</p>
        <Button className="bg-black text-white hover:bg-black/80" onClick={onCreateList}>
          Create New List
        </Button>
      </div>
    )
  }

  if (!dbUser?.id && !neynarAuthenticated) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="mb-2">Sign in to view your lists</p>
        <Button className="bg-black text-white hover:bg-black/80">Sign In</Button>
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="mb-2">You haven't created any lists yet</p>
        <Button className="bg-black text-white hover:bg-black/80" onClick={onCreateList}>
          Create Your First List
        </Button>
      </div>
    )
  }

  // Compact view for sidebar and profile
  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {lists.map((list) => (
          <div
            key={list.id}
            className="flex items-center p-2 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
            onClick={() => handleSelectList(list.id)}
          >
            <div className="bg-black/5 rounded p-2 mr-3 flex-shrink-0">
              <ListIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{list.title}</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-xs text-black/60">
                  {list.visibility === "public" ? (
                    <Globe size={14} className="text-green-600 mr-1" />
                  ) : list.visibility === "community" ? (
                    <Users size={14} className="text-blue-600 mr-1" />
                  ) : (
                    <Lock size={14} className="text-gray-600 mr-1" />
                  )}
                  <span className="hidden sm:inline">{list.visibility}</span>
                </div>
                <div className="flex items-center text-xs text-black/60">
                  <MapPin size={12} className="mr-1" />
                  <span>{list.places?.length || 0} places</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <Button
          className="w-full mt-2 bg-transparent text-black border border-black/20 hover:bg-black/5 text-sm py-1 h-auto"
          onClick={onCreateList}
        >
          <Plus size={14} className="mr-1" /> New List
        </Button>
      </div>
    )
  }

  // Full view
  return (
    <div className={`space-y-3 ${className}`}>
      {lists.map((list) => (
        <Card key={list.id} className="p-3 border border-black/10">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg truncate">{list.title}</h3>
              {list.description && <p className="text-sm text-black/70 line-clamp-2">{list.description}</p>}
              <div className="flex gap-4 mt-2 text-xs text-black/70">
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {list.places?.length || 0} places
                </span>
                <span className="flex items-center">
                  {list.visibility === "public" ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" /> Public
                    </>
                  ) : list.visibility === "community" ? (
                    <>
                      <Users className="h-3 w-3 mr-1" /> Community
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" /> Private
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-1 ml-2 flex-shrink-0">
              <Button
                className="h-8 w-8 p-0 bg-transparent text-black hover:bg-black/5 border border-black/10"
                title="Edit List"
                onClick={() => handleSelectList(list.id)}
              >
                <Edit size={14} />
              </Button>
              <Button
                className="h-8 px-3 bg-black text-white hover:bg-black/80 text-xs"
                onClick={() => handleSelectList(list.id)}
              >
                View
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <div className="text-center pt-2">
        <Button className="bg-black text-white hover:bg-black/80" onClick={onCreateList}>
          <Plus size={16} className="mr-1" /> Create New List
        </Button>
      </div>
    </div>
  )
}
