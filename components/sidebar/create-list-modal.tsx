"use client"

import type React from "react"

import { useState } from "react"
import { X, Globe, Lock, ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ListPrivacy = "private" | "open" | "closed"

interface CreateListModalProps {
  onClose: () => void
}

export function CreateListModal({ onClose }: CreateListModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    privacy: "private" as ListPrivacy,
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePrivacyChange = (privacy: ListPrivacy) => {
    setFormData((prev) => ({ ...prev, privacy }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    setIsCreating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsCreating(false)
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
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-1 font-medium">
                List Title
              </label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="border-black/20"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="border-black/20"
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
            <Button
              type="submit"
              className="flex-1 bg-black text-white hover:bg-black/80"
              disabled={!formData.title.trim() || isCreating}
            >
              {isCreating ? "CREATING..." : "CREATE LIST"}
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
