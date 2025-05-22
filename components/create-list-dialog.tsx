"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const { dbUser } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    privacy: "private" as ListPrivacy,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleClose = () => {
    onOpenChange(false)
    setFormData({
      title: "",
      description: "",
      privacy: "private",
    })
    setError(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePrivacyChange = (privacy: ListPrivacy) => {
    setFormData((prev) => ({ ...prev, privacy }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    if (!dbUser?.id) {
      setError("You must be logged in to create a list")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Map privacy to visibility
      const visibility =
        formData.privacy === "open" ? "public" : formData.privacy === "closed" ? "community" : "private"

      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: visibility,
          ownerId: dbUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }

      const newList = await response.json()

      // Create a list item to pass back to the parent component
      const listItem: ListItem = {
        id: newList.id,
        title: newList.title,
        description: newList.description,
        privacy: formData.privacy,
        placeCount: 0,
        author: dbUser.farcaster_username || dbUser.farcaster_display_name || "You",
      }

      setIsCreating(false)
      onListCreated(listItem)
    } catch (err) {
      console.error("Error creating list:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsCreating(false)
    }
  }

  // Redirect to the create list page
  const handleRedirectToCreateList = () => {
    handleClose()
    router.push("/lists/create")
  }

  return (
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
            onClick={handleRedirectToCreateList}
            className="w-full bg-black text-white hover:bg-black/80 py-2 px-4 rounded"
          >
            Go to Create List Page
          </button>
        </div>
      </div>
    </div>
  )
}
