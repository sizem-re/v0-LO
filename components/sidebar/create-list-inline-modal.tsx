"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CreateListInlineModalProps {
  onClose: () => void
  onListCreated: (list: { id: string | number; name: string; isOwner: boolean }) => void
}

export function CreateListInlineModal({ onClose, onListCreated }: CreateListInlineModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [isCreating, setIsCreating] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setErrors({ name: "List name is required" })
      return
    }

    setIsCreating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Generate a random ID for the new list
    const newList = {
      id: `new-${Date.now()}`,
      name: formData.name,
      isOwner: true,
    }

    onListCreated(newList)
    setIsCreating(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black/10 shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-serif">Create New List</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
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
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" className="flex-1 bg-black text-white hover:bg-black/80" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create List"}
            </Button>
            <Button
              type="button"
              className="bg-transparent text-black border border-black/20 hover:bg-black/5"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
