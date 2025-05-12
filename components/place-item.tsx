"use client"

interface PlaceItemProps {
  place: {
    id: string
    name: string
    type: string
    address: string
    description: string
    image: string
  }
  isSelected?: boolean
  onClick?: () => void
}

export function PlaceItem({ place, isSelected = false, onClick }: PlaceItemProps) {
  return (
    <article
      className={`border p-6 ${isSelected ? "border-black" : "border-black/10"} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 lg:w-1/4">
          <div
            className="aspect-[4/3] bg-gray-100"
            style={{
              backgroundImage: `url(${place.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-serif mb-1">{place.name}</h3>
          <p className="text-sm text-black/70 mb-3">{place.type}</p>
          <p className="mb-3">{place.description}</p>
          <p className="text-sm text-black/70">{place.address}</p>
        </div>
      </div>
    </article>
  )
}
