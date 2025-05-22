"use client"

import { ChevronLeft } from "lucide-react"

interface PlaceDetailsProps {
  place: any
  onBack: () => void
}

export function PlaceDetails({ place, onBack }: PlaceDetailsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-black/10">
        <button className="flex items-center text-black hover:bg-black/5 p-1 rounded" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>
      <div className="flex-grow p-4">
        <h2 className="text-xl font-medium mb-2">{place?.name || "Place Details"}</h2>
        <p className="text-sm text-gray-600">{place?.address || "Address not available"}</p>
      </div>
    </div>
  )
}
