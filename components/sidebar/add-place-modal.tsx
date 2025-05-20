"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AddPlaceModalProps {
  onClose: () => void
  userLists: any[]
}

export function AddPlaceModal({ onClose, userLists }: AddPlaceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    description: "",
    listId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implementation will be added later
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Add New Place</h2>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="block mb-1 font-medium">
                Place Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border-black/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="type" className="block mb-1 font-medium">
                Type
              </Label>
              <Input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="border-black/20"
                placeholder="Restaurant, Park, Museum, etc."
              />
            </div>

            <div>
              <Label htmlFor="address" className="block mb-1 font-medium">
                Address
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="border-black/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="block mb-1 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border-black/20"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="listId" className="block mb-1 font-medium">
                Add to List
              </Label>
              <select
                id="listId"
                name="listId"
                value={formData.listId}
                onChange={handleChange}
                className="w-full p-2 border border-black/20 rounded"
                required
              >
                <option value="">Select a list</option>
                {userLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-black text-white hover:bg-black/80"
              disabled={!formData.name || !formData.address || !formData.listId || isSubmitting}
            >
              {isSubmitting ? "ADDING..." : "ADD PLACE"}
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
