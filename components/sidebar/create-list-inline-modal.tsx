"use client"

import type React from "react"

import { useState } from "react"
import { X, Lock, Globe, ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type ListPrivacy = "private" | "open" | "closed"

interface CreateListInlineModalProps {
  onClose: () => void
  onListCreated: (list: { id: string | number; name: string; isOwner: boolean }) => void
}

export function CreateListInlineModal({ onClose, onListCreated }: CreateListInlineModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    privacy: "private" as ListPrivacy,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handlePrivacyChange = (privacy: ListPrivacy) => {
    setFormData((prev) => ({ ...prev, privacy }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "List name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate a random ID for the new list
    const newListId = `l${Math.floor(Math.random() * 10000)}`

    // Call the callback with the new list
    onListCreated({
      id: newListId,
      name: formData.name,
      isOwner: true,
    })

    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">Create New List</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block mb-1 font-medium">
                List Name*
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`border-black/20 ${errors.name ? "border-red-500" : ""}`}
                placeholder="e.g. My Favorite Cafes"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
          </form>
        </div>

        <div className="p-4 border-t border-black/10 flex gap-3">
          <Button
            type="button"
            className="bg-transparent text-black border border-black/20 hover:bg-black/5"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-black text-white hover:bg-black/80"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create List"}
          </Button>
        </div>
      </div>
    </div>
  )
}
