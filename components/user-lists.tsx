"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { MapPin } from "lucide-react"

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

export function UserLists() {
  const { dbUser, isAuthenticated } = useAuth()
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      if (!dbUser?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch lists")
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
  }, [dbUser?.id])

  if (isLoading) {
    return (
      <Card className="brutalist-card p-6">
        <div className="flex justify-center items-center h-24">
          <p>Loading your lists...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="brutalist-card p-6">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Link href="/lists/create">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-none border border-black">
            TRY CREATING A LIST
          </Button>
        </Link>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="brutalist-card p-6 text-center">
        <p className="mb-4">Sign in to create and view your lists.</p>
        <Link href="/login">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-none border border-black">SIGN IN</Button>
        </Link>
      </Card>
    )
  }

  if (lists.length === 0) {
    return (
      <Card className="brutalist-card p-6 text-center">
        <p className="mb-4">You haven't created any lists yet.</p>
        <Link href="/lists/create">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-none border border-black">
            CREATE YOUR FIRST LIST
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {lists.map((list) => (
        <Card key={list.id} className="brutalist-card p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{list.title}</h3>
              {list.description && <p className="text-sm">{list.description}</p>}
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {list.places?.length || 0} places
                </span>
                <span>
                  {list.visibility === "public"
                    ? "🌎 Public"
                    : list.visibility === "community"
                      ? "👥 Community"
                      : "🔒 Private"}
                </span>
              </div>
            </div>
            <Link href={`/lists/${list.id}`}>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none text-xs px-3 py-1">VIEW</Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  )
}
