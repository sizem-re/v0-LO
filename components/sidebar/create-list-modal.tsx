"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreateListModalProps {
  onClose: () => void
  onSuccess?: (list: any) => void
}

export function CreateListModal({ onClose, onSuccess }: CreateListModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSuccess) {
      onSuccess({
        id: "temp-id",
        title: "New List",
        description: null,
        visibility: "private",
        created_at: new Date().toISOString(),
        owner_id: "user-id",
        cover_image_url: null,
        places_count: 0,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Create New List</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <p className="mb-4">Create list functionality coming soon.</p>
          <div className="mt-6 flex gap-3">
            <Button type="submit" className="flex-1 bg-black text-white hover:bg-black/80">
              CREATE LIST
            </Button>
            <Button
              type="button"
              className="bg-transparent text-black border border-black/20 hover:bg-black/5"
              onClick={onClose}
            >
              CANCEL
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
