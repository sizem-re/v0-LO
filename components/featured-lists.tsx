"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock data for featured lists
const FEATURED_LISTS = [
  {
    id: "1",
    title: "Best Hiking Trails",
    description: "My favorite hiking spots in the Pacific Northwest",
    places: 12,
    author: "hikerguy.eth",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "2",
    title: "Hidden Cafes",
    description: "Secret coffee spots with great ambiance",
    places: 8,
    author: "coffeeexplorer.eth",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "3",
    title: "Urban Parks",
    description: "Green spaces in the concrete jungle",
    places: 15,
    author: "urbanist.eth",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export function FeaturedLists() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURED_LISTS.map((list) => (
        <Card key={list.id} className="border-2 border-black bg-white p-0 overflow-hidden">
          <div
            className="h-40 bg-gray-200"
            style={{ backgroundImage: `url(${list.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="p-4">
            <h3 className="text-xl font-bold uppercase">{list.title}</h3>
            <p className="text-sm mb-2">{list.description}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                {list.places} places • by {list.author}
              </span>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none text-xs px-3 py-1">VIEW</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
