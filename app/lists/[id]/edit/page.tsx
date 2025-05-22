"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Globe, Users, Lock, Loader2 } from "lucide-react"
import Link from "next/link"

interface ListData {
  id: string
  title: string
  description: string | null
  visibility: string
  owner_id: string
}

export default function EditListPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [list, setList] = useState<ListData | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState("public")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/lists/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch list")
        }

        const data = await response.json()
        setList(data)
        setTitle(data.title)
        setDescription(data.description || "")
        setVisibility(data.visibility)
      } catch (err) {
        console.error("Error fetching list:", err)
        setError(err instanceof Error ? err.message : "Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchList()
    }
  }, [params.id])

  useEffect(() => {
    // Check if user is authenticated and is the owner of the list
    if (!loading && isAuthenticated && list && user?.id !== list.owner_id) {
      setError("You don't have permission to edit this list")
    }
  }, [loading, isAuthenticated, list, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/lists/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          visibility,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update list")
      }

      router.push(`/lists/${params.id}`)
    } catch (err) {
      console.error("Error updating list:", err)
      setError(err instanceof Error ? err.message : "Failed to update list")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading list...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error}</p>
            <Link href={`/lists/${params.id}`} className="text-red-700 underline mt-4 inline-block">
              Back to list
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/lists/${params.id}`} className="text-sm hover:underline mb-4 inline-block">
            ← Back to list
          </Link>

          <h1 className="text-3xl font-serif mb-6">Edit List</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Favorite Coffee Shops"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A collection of the best coffee shops in the city"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Visibility</Label>
              <RadioGroup value={visibility} onValueChange={setVisibility} className="space-y-3">
                <div className="flex items-center space-x-2 border border-black/10 rounded-md p-3 hover:bg-black/5">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    <div>
                      <span className="font-medium">Public</span>
                      <p className="text-sm text-black/60">Anyone can view this list</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border border-black/10 rounded-md p-3 hover:bg-black/5">
                  <RadioGroupItem value="community" id="community" />
                  <Label htmlFor="community" className="flex items-center cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <div>
                      <span className="font-medium">Community</span>
                      <p className="text-sm text-black/60">Anyone can view and add places to this list</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border border-black/10 rounded-md p-3 hover:bg-black/5">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex items-center cursor-pointer">
                    <Lock className="mr-2 h-4 w-4" />
                    <div>
                      <span className="font-medium">Private</span>
                      <p className="text-sm text-black/60">Only you can view this list</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Link href={`/lists/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  )
}
