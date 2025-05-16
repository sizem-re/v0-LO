import Link from "next/link"
import Image from "next/image"

interface LinkPreviewCardProps {
  title: string
  description: string
  url: string
  imageUrl?: string
}

export function LinkPreviewCard({ title, description, url, imageUrl = "/og-image.png" }: LinkPreviewCardProps) {
  return (
    <Link href={url} className="block no-underline">
      <div className="border border-black/20 hover:border-black transition-colors overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-40 md:h-auto relative">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="p-4 md:p-6 flex-1">
            <h3 className="text-lg md:text-xl font-serif mb-2">{title}</h3>
            <p className="text-sm text-black/70 line-clamp-3">{description}</p>
            <div className="mt-2 text-xs text-black/60 truncate">{url.replace(/^https?:\/\//, "")}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
