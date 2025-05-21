"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddPlaceModalProps {
  onClose: () => void
  userLists: any[]
}

export function AddPlaceModal({ onClose, userLists }: AddPlaceModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Add Place</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="mb-4">Add place functionality coming soon.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
