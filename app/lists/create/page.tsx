"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Globe, Lock } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

function CreateListPage() {
  const router = useRouter()
  const { dbUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "private",
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

      // Redirect to the new list page
      router.push(`/lists/${newList.id}`)
    } catch (err) {
      console.error("Error creating list:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/lists" className="flex items-center text-sm hover:underline mb-8">
        <ArrowLeft size={16} className="mr-1" />
        Back to lists
      </Link>

      <h1 className="text-3xl md:text-4xl font-serif mb-8">Create a New List</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 font-medium">
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
            <label htmlFor="description" className="block mb-2 font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="lo-input border-black"
            />
          </div>

          <div>
            <span className="block mb-2 font-medium">Visibility</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="border border-black p-4 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === "private"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`flex items-start ${formData.visibility === "private" ? "text-black" : "text-black/70"}`}
                >
                  <Lock className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium mb-1">Private</div>
                    <div className="text-sm">Only you can see this list</div>
                  </div>
                </div>
              </label>
              <label className="border border-black p-4 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === "public"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`flex items-start ${formData.visibility === "public" ? "text-black" : "text-black/70"}`}
                >
                  <Globe className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium mb-1">Public</div>
                    <div className="text-sm">Anyone can see this list</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <button type="submit" className="lo-button" disabled={isSubmitting}>
            {isSubmitting ? "CREATING..." : "CREATE LIST"}
          </button>
          <Link href="/lists">
            <button type="button" className="lo-button bg-transparent">
              CANCEL
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function CreateListPageWrapper() {
  return (
    <ProtectedRoute>
      <CreateListPage />
    </ProtectedRoute>
  )
}
