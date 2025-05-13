import Link from "next/link"
import { ArrowRight, MapPin, ListIcon } from "lucide-react"
import { ListItem } from "../components/list-item"

// Mock data for lists
const FEATURED_LISTS = [
  {
    id: "1",
    title: "BEST (HIDDEN) FOOD IN TACOMA",
    author: "taylorbenthero.eth",
    description: "Some of my favorite restaurants in tacoma, nothing polished, just good honest food when your hungry.",
    timestamp: "Posted 5m ago",
    image: "/placeholder.svg?height=200&width=300",
    placeCount: 8,
  },
  {
    id: "2",
    title: "Core Skateshops of the World",
    author: "community list",
    description:
      "A list of what I consider to be Core shops, shops that support their community and live skateboarding. Please add shops that are missing, this is an open list.",
    timestamp: "Updated 5 months ago",
    image: "/placeholder.svg?height=200&width=300",
    placeCount: 12,
  },
  {
    id: "3",
    title: "Parks you'd eat lunch at",
    author: "discussion in /chicago via Warpcast",
    description: "A discussion about public parks with pleasant atmosphere and good seating options.",
    timestamp: "Updated 5 months ago",
    image: "/placeholder.svg?height=200&width=300",
    placeCount: 5,
  },
]

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="mb-16 border border-black p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6">
          Discover and share <br className="hidden md:block" />
          places that matter.
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl">
          LO is a community for discovering, sharing, and curating location-based lists. Find hidden gems, create
          personalized guides, and explore places through others' perspectives.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/map" className="lo-button flex items-center justify-center">
            <MapPin className="mr-2 h-5 w-5" />
            EXPLORE MAP
          </Link>
          <Link href="/explore" className="lo-button flex items-center justify-center">
            <ListIcon className="mr-2 h-5 w-5" />
            BROWSE LISTS
          </Link>
        </div>
      </section>

      {/* Featured lists section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif">New Lists</h2>
          <Link href="/explore" className="flex items-center text-sm hover:underline">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-0">
          {FEATURED_LISTS.map((list) => (
            <ListItem key={list.id} list={list} />
          ))}
        </div>
      </section>

      {/* How it works section */}
      <section className="mb-16">
        <h2 className="text-3xl font-serif mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-black/20 p-6">
            <div className="text-4xl font-serif mb-4">01</div>
            <h3 className="text-xl font-serif mb-2">Discover Places</h3>
            <p>Explore curated lists and maps created by the community to find interesting locations.</p>
          </div>
          <div className="border border-black/20 p-6">
            <div className="text-4xl font-serif mb-4">02</div>
            <h3 className="text-xl font-serif mb-2">Create Lists</h3>
            <p>Build your own collections of favorite places, hidden gems, or themed locations.</p>
          </div>
          <div className="border border-black/20 p-6">
            <div className="text-4xl font-serif mb-4">03</div>
            <h3 className="text-xl font-serif mb-2">Share & Connect</h3>
            <p>Share your lists with the community and connect with others through Farcaster.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
