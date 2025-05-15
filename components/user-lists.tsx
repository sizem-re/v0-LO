"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for user lists
const USER_LISTS = [
  {
    id: "1",
    title: "My Favorite Cafes",
    description: "The best places to get coffee in the city",
    places: 8,
    visibility: "public",
    saves: 12,
  },
  {
    id: "2",
    title: "Weekend Hikes",
    description: "Great trails within an hour of the city",
    places: 6,
    visibility: "public",
    saves: 8,
  },
  {
    id: "3",
    title: "Date Night Spots",
    description: "Romantic restaurants and bars",
    places: 10,
    visibility: "private",
    saves: 0,
  },
]

export function UserLists() {
  if (USER_LISTS.length === 0) {
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
      {USER_LISTS.map((list) => (
        <Card key={list.id} className="brutalist-card p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{list.title}</h3>
              <p className="text-sm">{list.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{list.places} places</span>
                <span>{list.visibility === "public" ? "🌎 Public" : "🔒 Private"}</span>
                {list.visibility === "public" && <span>{list.saves} saves</span>}
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
