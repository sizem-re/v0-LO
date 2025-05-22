"use client"

import { useState } from "react"
import { ChevronLeft, MapPin, Link2 } from "lucide-react"
import type { Place } from "@/types"

interface PlaceDetailViewProps {
  place: Place
  onBack: () => void
  canEdit?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function PlaceDetailView({ place, onBack, canEdit, onEdit, onDelete }: PlaceDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { name, address, website } = place

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-black/10">
        <div className="flex items-center">
          <button
            className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold">{name}</h2>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{address}</p>
        </div>
        {website && (
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={14} className="text-muted-foreground" />
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              {website}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
