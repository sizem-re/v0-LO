import Link from "next/link"
import Image from "next/image"
import { MapPin } from "lucide-react"
import type { Place } from "@/types/place"

interface ListPreviewCardProps {
  id: string
  title: string
  description: string
  author: string
  places: Place[]
  imageUrl?: string
}

export function ListPreviewCard({
  id,
  title,
  description,
  author,
  places,
  imageUrl = "/og-image.png",
}: ListPreviewCardProps) {
  return (
    <Link href={`/lists/${id}`} className="block no-underline">
      <div className="border border-black/20 hover:border-black transition-colors overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto relative">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="p-4 md:p-6 flex-1">
            <h3 className="text-xl md:text-2xl font-serif mb-2">{title}</h3>
            <p className="text-sm text-black/70 mb-3">{description}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm">by {author}</div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {places.length} places
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
