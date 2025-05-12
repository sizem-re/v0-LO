import Link from "next/link"
import { MapPin } from "lucide-react"

interface ListItemProps {
  list: {
    id: string
    title: string
    author: string
    description: string
    timestamp: string
    image: string
    placeCount?: number
  }
}

export function ListItem({ list }: ListItemProps) {
  return (
    <article className="border-t border-black/10 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Link href={`/lists/${list.id}`} className="block">
            <div
              className="aspect-[4/3] bg-gray-100 border border-black/10 hover:border-black transition-colors"
              style={{
                backgroundImage: `url(${list.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Link>
        </div>

        <div className="md:col-span-2">
          <Link href={`/lists/${list.id}`}>
            <h3 className="text-xl md:text-2xl font-serif mb-1 hover:underline">{list.title}</h3>
          </Link>
          <p className="text-sm text-black/70 mb-3">{list.author}</p>
          <p className="mb-4">{list.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60">{list.timestamp}</p>
            {list.placeCount && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {list.placeCount} places
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
