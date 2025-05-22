"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { CreateListModal } from "./create-list-modal"

type ListPrivacy = "private" | "open" | "closed"

interface ListItem {
  id: string
  title: string
  description?: string
  privacy: ListPrivacy
  placeCount: number
  author: string
}

interface CreateListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onListCreated: (list: ListItem) => void
}

export function CreateListDialog({ open, onOpenChange, onListCreated }: CreateListDialogProps) {
  const { dbUser } = useAuth()
  const [showCreateListModal, setShowCreateListModal] = useState(false)

  if (!open) return null

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleListCreated = (list: { id: string; title: string; description?: string }) => {
    // Create a list item to pass back to the parent component
    const listItem: ListItem = {
      id: list.id,
      title: list.title,
      description: list.description,
      privacy: "private", // Default, could be improved
      placeCount: 0,
      author: dbUser?.farcaster_username || dbUser?.farcaster_display_name || "You",
    }

    onListCreated(listItem)
    onOpenChange(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
        <div className="bg-white w-full max-w-md border border-black shadow-lg">
          <div className="p-4 border-b border-black/10 flex items-center justify-between">
            <h2 className="text-lg font-medium">Create New List</h2>
            <button onClick={handleClose} className="p-1" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={() => {
                handleClose()
                setShowCreateListModal(true)
              }}
              className="w-full bg-black text-white hover:bg-black/80 py-2 px-4 rounded"
            >
              Create a New List
            </button>
          </div>
        </div>
      </div>

      <CreateListModal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onListCreated={handleListCreated}
      />
    </>
  )
}
