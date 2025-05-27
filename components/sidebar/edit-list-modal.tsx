"use client"

import type React from "react"

import { useState } from "react"
import { X, Globe, Lock, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type ListVisibility = "private" | "public" | "community"

interface EditListModalProps {
  isOpen: boolean
  onClose: () => void
  list: {
    id: string
    title: string
    description?: string
    visibility: ListVisibility
  }
  onListUpdated?: (list: { id: string; title: string; description?: string; visibility: ListVisibility }) => void
  onListDeleted?: () => void
}

export function EditListModal({ isOpen, onClose, list, onListUpdated, onListDeleted }: EditListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    title: list.title || "",
    description: list.description || "",
    visibility: list.visibility || "private",
  })
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVisibilityChange = (visibility: ListVisibility) => {
    setFormData((prev) => ({ ...prev, visibility }))
  }

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update list")
      }

      const updatedList = await response.json()
      console.log("List updated:", updatedList)

      // Call the callback with the updated list if provided
      if (onListUpdated) {
        onListUpdated({
          id: updatedList.id,
          title: updatedList.title,
          description: updatedList.description,
          visibility: updatedList.visibility,
        })
      }

      onClose()
    } catch (err) {
      console.error("Error updating list:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete list")
      }

      console.log("List deleted successfully")
      
      // Call the callback if provided
      if (onListDeleted) {
        onListDeleted()
      }

      onClose()
    } catch (err) {
      console.error("Error deleting list:", err)
      setError(err instanceof Error ? err.message : "Failed to delete list")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">Edit List</h2>
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
                    <Users className="h-5 w-5 mb-1" />
                    <div className="font-medium">Community</div>
                    <div className="text-xs text-black/70">Others can add</div>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-black/10">
          {/* Main Actions */}
          <div className="flex gap-3 mb-4">
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          
          {/* Delete Section */}
          <div className="pt-4 border-t border-red-100">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Danger Zone</p>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 size={14} className="mr-2" />
                Delete List
              </Button>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="font-semibold text-lg mb-2">Delete List?</h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete "{list.title}" and all its places. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
