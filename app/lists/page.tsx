"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Grid, ListIcon, MapPin } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { PageLayout } from "@/components/page-layout"
import { useAuth } from "@/lib/auth-context"

interface List {
  id: string
  title: string
  description: string | null
  visibility: string
  created_at: string
  owner_id: string
  cover_image_url: string | null
  places: { id: string; place: any }[]
  owner: {
    farcaster_username: string | null
    farcaster_display_name: string | null
    farcaster_pfp_url: string | null
  }
}

function ListsPage() {
  const { dbUser, isAuthenticated } = useAuth()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-serif">MY LISTS</h1>
        <div className="flex items-center gap-4">
          <div className="flex border border-black">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-black text-white" : "bg-white text-black"}`}
              aria-label="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-black text-white" : "bg-white text-black"}`}
              aria-label="List view"
            >
              <ListIcon size={20} />
            </button>
          </div>
          <Link href="/lists/create" className="lo-button flex items-center">
            <Plus size={18} className="mr-2" />
            NEW LIST
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your lists...</p>
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-red-700 rounded">
          <p>{error}</p>
          <Link href="/lists/create" className="underline mt-2 inline-block">
            Try creating a new list
          </Link>
        </div>
      ) : !isAuthenticated ? (
        <div className="border border-black p-8 text-center">
          <h2 className="text-2xl font-serif mb-4">SIGN IN TO VIEW YOUR LISTS</h2>
          <p className="mb-6">Sign in with your Farcaster account to create and view your lists.</p>
          <Link href="/login" className="lo-button">
            SIGN IN
          </Link>
        </div>
      ) : lists.length === 0 ? (
        <div className="border border-black p-8 text-center">
          <h2 className="text-2xl font-serif mb-4">YOU DON'T HAVE ANY LISTS YET</h2>
          <p className="mb-6">Create your first list to start collecting your favorite places.</p>
          <Link href="/lists/create" className="lo-button">
            CREATE YOUR FIRST LIST
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`} className="block group">
              <div className="border border-black/20 group-hover:border-black transition-colors h-full">
                <div
                  className="aspect-[4/3] bg-gray-100"
                  style={{
                    backgroundImage: `url(${list.cover_image_url || "/map-of-locations.png"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="p-4">
                  <h3 className="text-xl font-serif mb-1">{list.title}</h3>
                  <p className="text-sm text-black/70 mb-3 line-clamp-2">{list.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {list.places?.length || 0} places
                    </div>
                    <div className="text-sm">
                      {list.visibility === "public" ? (
                        <span className="text-black/70">🌎 Public</span>
                      ) : list.visibility === "community" ? (
                        <span className="text-black/70">👥 Community</span>
                      ) : (
                        <span className="text-black/70">🔒 Private</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <div key={list.id} className="border border-black/20 hover:border-black transition-colors p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
                  <Link href={`/lists/${list.id}`}>
                    <div
                      className="aspect-[4/3] bg-gray-100"
                      style={{
                        backgroundImage: `url(${list.cover_image_url || "/map-of-locations.png"})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </Link>
                </div>
                <div className="flex-1">
                  <Link href={`/lists/${list.id}`}>
                    <h3 className="text-xl font-serif mb-1 hover:underline">{list.title}</h3>
                  </Link>
                  <p className="text-sm text-black/70 mb-3">{list.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {list.places?.length || 0} places
                    </div>
                    <div>
                      {list.visibility === "public" ? (
                        <span className="text-black/70">🌎 Public</span>
                      ) : list.visibility === "community" ? (
                        <span className="text-black/70">👥 Community</span>
                      ) : (
                        <span className="text-black/70">🔒 Private</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Wrap the ListsPageWrapper with PageLayout
export default function ListsPageWrapper() {
  return (
    <PageLayout>
      <ProtectedRoute>
        <ListsPage />
      </ProtectedRoute>
    </PageLayout>
  )
}
