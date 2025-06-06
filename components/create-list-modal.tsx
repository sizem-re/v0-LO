"use client"

import type React from "react"

import { useState } from "react"
import { X, Globe, Lock, ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

type ListPrivacy = "private" | "public" | "community"

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onListCreated?: (list: { id: string; title: string; description?: string }) => void
}

export function CreateListModal({ isOpen, onClose, onListCreated }: CreateListModalProps) {
  const { dbUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "private" as ListPrivacy,
  })
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVisibilityChange = (visibility: ListPrivacy) => {
    setFormData((prev) => ({ ...prev, visibility }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      visibility: "private",
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
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

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          ownerId: dbUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }

      const newList = await response.json()
      console.log("List created:", newList)

      // Call the callback with the new list if provided
      if (onListCreated) {
        onListCreated({
          id: newList.id,
          title: newList.title,
          description: newList.description,
        })
      }

      resetForm()
      onClose()
    } catch (err) {
      console.error("Error creating list:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">Create New List</h2>
          <button onClick={handleClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="title" className="block mb-1 font-medium">
                List Title*
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="border-black/20"
                placeholder="e.g. My Favorite Coffee Shops"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="block mb-1 font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="border-black/20"
                placeholder="What's this list about?"
              />
            </div>

            <div>
              <span className="block mb-2 font-medium">Visibility</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label
                  className={`border p-3 cursor-pointer ${
                    formData.visibility === "private" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === "private"}
                    onChange={() => handleVisibilityChange("private")}
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
                    formData.visibility === "public" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === "public"}
                    onChange={() => handleVisibilityChange("public")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <Globe className="h-5 w-5 mb-1" />
                    <div className="font-medium">Public</div>
                    <div className="text-xs text-black/70">Anyone can see</div>
                  </div>
                </label>

                <label
                  className={`border p-3 cursor-pointer ${
                    formData.visibility === "community" ? "border-black" : "border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="community"
                    checked={formData.visibility === "community"}
                    onChange={() => handleVisibilityChange("community")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <ListIcon className="h-5 w-5 mb-1" />
                    <div className="font-medium">Community</div>
                    <div className="text-xs text-black/70">Others can add</div>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-black/10 flex gap-3">
          <Button
            type="button"
            className="bg-transparent text-black border border-black/20 hover:bg-black/5"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-black text-white hover:bg-black/80"
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create List"}
          </Button>
        </div>
      </div>
    </div>
  )
}
