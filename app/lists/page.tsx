"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { Plus, Grid, ListIcon, MapPin } from "lucide-react"
import { ProtectedRoute } from "../../components/protected-route"

// Mock data for user lists
const USER_LISTS = [
  {
    id: "1",
    title: "My Favorite Cafes",
    description: "The best places to get coffee in the city",
    places: 8,
    visibility: "public",
    saves: 12,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "2",
    title: "Weekend Hikes",
    description: "Great trails within an hour of the city",
    places: 6,
    visibility: "public",
    saves: 8,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "3",
    title: "Date Night Spots",
    description: "Romantic restaurants and bars",
    places: 10,
    visibility: "private",
    saves: 0,
    image: "/placeholder.svg?height=200&width=300",
  },
]

function ListsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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

      {USER_LISTS.length === 0 ? (
        <div className="border border-black p-8 text-center">
          <h2 className="text-2xl font-serif mb-4">YOU DON'T HAVE ANY LISTS YET</h2>
          <p className="mb-6">Create your first list to start collecting your favorite places.</p>
          <Link href="/lists/create" className="lo-button">
            CREATE YOUR FIRST LIST
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USER_LISTS.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`} className="block group">
              <div className="border border-black/20 group-hover:border-black transition-colors h-full">
                <div
                  className="aspect-[4/3] bg-gray-100"
                  style={{
                    backgroundImage: `url(${list.image})`,
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
                      {list.places} places
                    </div>
                    <div className="text-sm">
                      {list.visibility === "public" ? (
                        <span className="text-black/70">🌎 Public</span>
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
          {USER_LISTS.map((list) => (
            <div key={list.id} className="border border-black/20 hover:border-black transition-colors p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
                  <Link href={`/lists/${list.id}`}>
                    <div
                      className="aspect-[4/3] bg-gray-100"
                      style={{
                        backgroundImage: `url(${list.image})`,
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
                      {list.places} places
                    </div>
                    <div>
                      {list.visibility === "public" ? (
                        <span className="text-black/70">🌎 Public</span>
                      ) : (
                        <span className="text-black/70">🔒 Private</span>
                      )}
                    </div>
                    {list.visibility === "public" && <div className="text-black/70">{list.saves} saves</div>}
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

export default function ListsPageWrapper() {
  return (
    <ProtectedRoute>
      <ListsPage />
    </ProtectedRoute>
  )
}
