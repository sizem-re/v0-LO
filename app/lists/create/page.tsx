"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, Lock } from "lucide-react"
import { ProtectedRoute } from "../../../components/protected-route"

function CreateListPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "private",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Handle form submission
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/lists" className="flex items-center text-sm hover:underline mb-8">
        <ArrowLeft size={16} className="mr-1" />
        Back to lists
      </Link>

      <h1 className="text-3xl md:text-4xl font-serif mb-8">Create a New List</h1>

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
          <button type="submit" className="lo-button">
            CREATE LIST
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
