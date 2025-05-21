"use client"

import type { List } from "@/hooks/use-lists"

interface ListCardProps {
  list: List
  onClick?: (list: List) => void
}

export function ListCard({ list, onClick }: ListCardProps) {
  return (
    <div
      className="p-3 border border-black/10 rounded mb-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick?.(list)}
    >
      <h3 className="font-medium">{list.title}</h3>
      {list.description && <p className="text-sm text-black/70 mt-1">{list.description}</p>}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-black/60">{list.places_count} places</span>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
          {list.visibility === "public" ? "Public" : "Private"}
        </span>
      </div>
    </div>
  )
}
