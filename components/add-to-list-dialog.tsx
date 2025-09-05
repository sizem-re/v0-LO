"use client"

import { useState } from "react"
import { X, Plus, Check } from "lucide-react"
import type { Place } from "@/types/place"

type ListPrivacy = "private" | "open" | "closed"

interface ListItem {
  id: string
  title: string
  description?: string
  privacy: ListPrivacy
  placeCount: number
  author: string
}

interface AddToListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  place: Place | null
  lists: ListItem[]
  onCreateList: () => void
}

export function AddToListDialog({ open, onOpenChange, place, lists, onCreateList }: AddToListDialogProps) {
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  if (!open || !place) return null

  const handleClose = () => {
    onOpenChange(false)
    setSelectedLists([])
    setAddSuccess(false)
  }

  const toggleList = (listId: string) => {
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter((id) => id !== listId))
    } else {
      setSelectedLists([...selectedLists, listId])
    }
  }

  const handleAddToLists = async () => {
    if (selectedLists.length === 0) return

    setIsAdding(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsAdding(false)
    setAddSuccess(true)

    // Reset after showing success message
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-md border border-black shadow-lg">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Add to List</h2>
          <button onClick={handleClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium">{place.name}</h3>
            <p className="text-sm text-black/70">{place.type}</p>
          </div>

          {addSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg">Added to selected lists!</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm">Select the lists you want to add this place to:</p>

              <div className="max-h-60 overflow-y-auto mb-4">
                {lists.length > 0 ? (
                  <div className="space-y-2">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-3 border cursor-pointer ${
                          selectedLists.includes(list.id)
                            ? "border-black bg-black/5"
                            : "border-black/20 hover:border-black/50"
                        }`}
                        onClick={() => toggleList(list.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{list.title}</h4>
                            <p className="text-xs text-black/70">{list.placeCount} places</p>
                          </div>
                          {selectedLists.includes(list.id) && <Check className="h-5 w-5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-black/70">You don't have any lists yet.</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  className="lo-button w-full"
                  onClick={handleAddToLists}
                  disabled={selectedLists.length === 0 || isAdding}
                >
                  {isAdding ? "ADDING..." : "ADD TO SELECTED LISTS"}
                </button>

                <button
                  className="lo-button w-full bg-transparent"
                  onClick={() => {
                    handleClose()
                    onCreateList()
                  }}
                >
                  <Plus size={16} className="mr-1 inline-block" />
                  CREATE NEW LIST
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
