import { ListItem } from "@/components/list-item"

// Mock data for lists
const EXPLORE_LISTS = [
  {
    id: "5",
    title: "Hidden Gems in Brooklyn",
    author: "brooklynite.eth",
    description: "Lesser-known spots in Brooklyn that locals love but tourists rarely find.",
    timestamp: "Posted 2d ago",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "6",
    title: "Tokyo Coffee Tour",
    author: "coffeelover.eth",
    description: "A curated list of the best independent coffee shops across Tokyo neighborhoods.",
    timestamp: "Updated 1 week ago",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "7",
    title: "Berlin Underground Music Venues",
    author: "discussion in /berlin via Warpcast",
    description: "Lesser-known music venues in Berlin with great atmosphere and interesting performances.",
    timestamp: "Updated 3 weeks ago",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif mb-8">Explore</h1>

      <div className="space-y-0">
        {EXPLORE_LISTS.map((list) => (
          <ListItem key={list.id} list={list} />
        ))}
      </div>
    </div>
  )
}
