"use client"

import { Card } from "./ui/card"
import { Button } from "./ui/button"
import Link from "next/link"

// Mock data for popular lists
const POPULAR_LISTS = [
  {
    id: "1",
    title: "Best Hiking Trails",
    places: 12,
    author: "hikerguy.eth",
    saves: 45,
  },
  {
    id: "2",
    title: "Hidden Cafes",
    places: 8,
    author: "coffeeexplorer.eth",
    saves: 32,
  },
  {
    id: "3",
    title: "Urban Parks",
    places: 15,
    author: "urbanist.eth",
    saves: 28,
  },
  {
    id: "4",
    title: "Vintage Bookstores",
    places: 6,
    author: "bookworm.eth",
    saves: 19,
  },
  {
    id: "5",
    title: "Rooftop Bars",
    places: 10,
    author: "nightlife.eth",
    saves: 37,
  },
]

export function PopularLists() {
  return (
    <div className="space-y-4">
      {POPULAR_LISTS.map((list) => (
        <Card key={list.id} className="brutalist-card p-4">
          <h3 className="font-bold">{list.title}</h3>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm">
              <div>{list.places} places</div>
              <div>by {list.author}</div>
              <div>{list.saves} saves</div>
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
