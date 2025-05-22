"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Save } from "lucide-react"

export default function EditListPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // In a real app, you would fetch the list data based on params.id
  const [formData, setFormData] = useState({
    title: "BEST (HIDDEN) FOOD IN TACOMA",
    description: "Some of my favorite restaurants in tacoma, nothing polished, just good honest food when your hungry.",
    isPrivate: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would update the list data here
    console.log("Updated list:", formData)

    // Redirect back to the list page
    router.push(`/lists/${params.id}`)
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>You must be logged in to edit lists.</p>
        <Link href="/login" className="lo-button mt-4">
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/lists/${params.id}`} className="text-sm hover:underline mb-4 inline-block flex items-center">
        <ArrowLeft size={16} className="mr-1" /> Back to list
      </Link>

      <h1 className="text-3xl md:text-4xl font-serif mb-6">Edit List</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            List Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-black/20 rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-black/20 rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input type="checkbox" checked={formData.isPrivate} onChange={handlePrivacyChange} className="mr-2" />
            <span className="text-sm">Make this list private</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="lo-button flex items-center gap-2">
            <Save size={18} />
            Save Changes
          </button>
          <Link href={`/lists/${params.id}`} className="lo-button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
