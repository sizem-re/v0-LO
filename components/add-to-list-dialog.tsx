"use client"

import { useState } from "react"
import { X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLists } from "@/hooks/use-lists"
import { usePlaces } from "@/hooks/use-places"
import Link from "next/link"

interface AddToListDialogProps {
  place: {
    id: string
    name: string
  }
  onClose: () => void
}

export function AddToListDialog({ place, onClose }: AddToListDialogProps) {
  const { lists, isLoading: listsLoading, createList } = useLists()
  const { addPlaceToLists } = usePlaces()
  const [selectedLists, setSelectedLists] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleListToggle = (listId: string) => {
    setSelectedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }))
  }

  const handleSubmit = async () => {
    const selectedListIds = Object.entries(selectedLists)
      .filter(([_, isSelected]) => isSelected)
      .map(([listId]) => listId)

    if (selectedListIds.length === 0) {
      setErrorMessage("Please select at least one list")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await addPlaceToLists(place.id, selectedListIds)
      setSuccessMessage(`Added ${place.name} to ${selectedListIds.length} list(s)`)

      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error adding place to lists:", error)
      setErrorMessage("Failed to add place to lists. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Add to List</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-4">
            Add <strong>{place.name}</strong> to your lists:
          </p>

          {errorMessage && <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">{errorMessage}</div>}

          {successMessage && (
            <div className="mb-4 p-2 bg-green-50 text-green-600 rounded-md text-sm flex items-center">
              <Check size={16} className="mr-2" />
              {successMessage}
            </div>
          )}

          {listsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading your lists...</div>
          ) : lists.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 mb-4">You don't have any lists yet.</p>
              <Link href="/lists/create" className="text-blue-600 hover:underline">
                Create your first list
              </Link>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center py-2 border-b border-gray-100">
                  <input
                    type="checkbox"
                    id={`list-${list.id}`}
                    checked={!!selectedLists[list.id]}
                    onChange={() => handleListToggle(list.id)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor={`list-${list.id}`} className="ml-2 block text-sm font-medium text-gray-700 flex-grow">
                    {list.title}
                    <span className="text-xs text-gray-500 block">
                      {list.place_count} {list.place_count === 1 ? "place" : "places"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <Button
              type="button"
              className="bg-white text-black border border-gray-300 hover:bg-gray-50 flex items-center"
              onClick={() => {
                // Navigate to create list page
                window.location.href = "/lists/create"
              }}
            >
              <Plus size={16} className="mr-2" />
              New List
            </Button>
            <Button
              type="button"
              className="bg-black text-white hover:bg-black/80"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.values(selectedLists).filter(Boolean).length === 0}
            >
              {isSubmitting ? "Adding..." : "Add to Lists"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
