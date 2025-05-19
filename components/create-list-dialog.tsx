"use client"

import type React from "react"

import { useState } from "react"
import { X, Globe, Lock, ListIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Create New List</h2>
          <button onClick={handleClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-1 font-medium">
                List Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="lo-input border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 font-medium">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="lo-input border-black"
              />
            </div>

            <div>
              <span className="block mb-2 font-medium">Privacy</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label
                  className={`border p-3 cursor-pointer ${
                    formData.privacy === "private" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === "private"}
                    onChange={() => handlePrivacyChange("private")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <Lock className="h-5 w-5 mb-1" />
                    <div className="font-medium">Private</div>
                    <div className="text-xs text-black/70">Sharable via link</div>
                  </div>
                </label>

                <label
                  className={`border p-3 cursor-pointer ${
                    formData.privacy === "open" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value="open"
                    checked={formData.privacy === "open"}
                    onChange={() => handlePrivacyChange("open")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <Globe className="h-5 w-5 mb-1" />
                    <div className="font-medium">Open</div>
                    <div className="text-xs text-black/70">Anyone can add</div>
                  </div>
                </label>

                <label
                  className={`border p-3 cursor-pointer ${
                    formData.privacy === "closed" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value="closed"
                    checked={formData.privacy === "closed"}
                    onChange={() => handlePrivacyChange("closed")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <ListIcon className="h-5 w-5 mb-1" />
                    <div className="font-medium">Closed</div>
                    <div className="text-xs text-black/70">Only you can add</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="lo-button flex-1" disabled={!formData.title.trim() || isCreating}>
              {isCreating ? "CREATING..." : "CREATE LIST"}
            </button>
            <button type="button" className="lo-button bg-transparent" onClick={handleClose}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
