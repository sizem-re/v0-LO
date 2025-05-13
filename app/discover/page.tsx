import { DiscoverMap } from "../../components/discover-map"
import { PopularLists } from "../../components/popular-lists"

export default function DiscoverPage() {
  return (
    <main className="min-h-screen p-4">
      <header className="border-b border-black pb-4 mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-tight">DISCOVER</h1>
        <p className="mt-2 text-lg">Explore places and lists shared by the community.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4 uppercase">EXPLORE MAP</h2>
          <DiscoverMap />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4 uppercase">POPULAR LISTS</h2>
          <PopularLists />
        </div>
      </div>
    </main>
  )
}
