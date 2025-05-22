"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, MapPin, Globe, Users, Lock, MoreVertical, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { EditListModal } from "./edit-list-modal"
import { AddPlaceModal } from "./add-place-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

interface ListDetailViewProps {
  listId: string
  onBack: () => void
  onPlaceClick: (place: any) => void
  onEditList?: (list: any) => void
  onDeleteList?: (list: any) => void
  onAddPlace?: (listId: string) => void
}

export function ListDetailView({
  listId,
  onBack,
  onPlaceClick,
  onEditList,
  onDeleteList,
  onAddPlace,
}: ListDetailViewProps) {
  const { dbUser } = useAuth()
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchListDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching list details for ID: ${listId}`)
      const response = await fetch(`/api/lists/${listId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch list: ${response.status}`)
      }

      const data = await response.json()
      console.log("List details:", data)
      setList(data)
    } catch (err) {
      console.error("Error fetching list details:", err)
      setError(err instanceof Error ? err.message : "Failed to load list details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (listId) {
      fetchListDetails()
    }
  }, [listId])

  const handleEditList = () => {
    setShowEditModal(true)
  }

  const handleListUpdated = (updatedList: any) => {
    // Update the local list state with the updated data
    setList((prevList: any) => ({
      ...prevList,
      ...updatedList,
    }))

    // Call the parent callback if provided
    if (onEditList) {
      onEditList(updatedList)
    }
  }

  const handleDeleteList = async () => {
    if (!list) return

    try {
      setIsDeleting(true)
      console.log(`Deleting list with ID: ${list.id}`)

      const response = await fetch(`/api/lists/${list.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete list")
      }

      console.log("List deleted successfully")
      toast({
        title: "List deleted",
        description: `"${list.title}" has been deleted successfully.`,
      })

      // Call the parent callback if provided
      if (onDeleteList) {
        onDeleteList(list)
      }

      setShowDeleteConfirm(false)
    } catch (err) {
      console.error("Error deleting list:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete list",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddPlace = () => {
    setShowAddPlaceModal(true)
  }

  const handlePlaceAdded = (place: any) => {
    // Refresh the list to show the new place
    fetchListDetails()
  }

  const isOwner = dbUser?.id === list?.owner_id
  const canAddPlaces = isOwner || list?.visibility === "community"

  const getVisibilityIcon = () => {
    switch (list?.visibility) {
      case "public":
        return <Globe size={16} className="text-green-600" />
      case "community":
        return <Users size={16} className="text-blue-600" />
      case "private":
        return <Lock size={16} className="text-gray-600" />
      default:
        return <Globe size={16} className="text-green-600" />
    }
  }

  const getVisibilityText = () => {
    switch (list?.visibility) {
      case "public":
        return "Public"
      case "community":
        return "Community"
      case "private":
        return "Private"
      default:
        return "Public"
    }
  }

  if (loading) {
    return (
      <div className="p-4 w-full h-full overflow-y-auto">
        <div className="flex items-center mb-4">
          <button
            className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-12 w-12 rounded mr-3" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 w-full h-full overflow-y-auto">
        <div className="flex items-center mb-4">
          <button
            className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-serif text-xl">Error</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <Button className="mt-4 bg-black text-white hover:bg-black/80" onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="p-4 w-full h-full overflow-y-auto">
        <div className="flex items-center mb-4">
          <button
            className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-serif text-xl">List Not Found</h2>
        </div>
        <p className="text-black/70 mb-4">The list you're looking for doesn't exist or has been deleted.</p>
        <Button className="bg-black text-white hover:bg-black/80" onClick={onBack}>
          Go Back
        </Button>
      </div>
    )
  }

  const places = list.places || []
  const ownerName = list.owner?.farcaster_display_name || list.owner?.farcaster_username || "Unknown"

  return (
    <div className="w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-black/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <button
              className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
              onClick={onBack}
              aria-label="Back"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-serif text-xl truncate">{list.title}</h2>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditList}>Edit List</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center text-sm text-black/70 mb-2">
          <div className="flex items-center mr-4">
            {getVisibilityIcon()}
            <span className="ml-1">{getVisibilityText()}</span>
          </div>
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{places.length} places</span>
          </div>
        </div>

        {list.description && <p className="text-sm text-black/70 mb-2">{list.description}</p>}
        <div className="text-xs text-black/60">Created by {ownerName}</div>
      </div>

      {/* Add Place Button */}
      {canAddPlaces && (
        <div className="p-4 border-b border-black/10">
          <Button className="w-full bg-black text-white hover:bg-black/80" onClick={handleAddPlace}>
            <Plus size={14} className="mr-1" /> Add Place
          </Button>
        </div>
      )}

      {/* Places */}
      <div className="p-4">
        <h3 className="font-medium mb-3">Places</h3>
        {places.length === 0 ? (
          <div className="text-center py-8 text-black/70">
            <p className="mb-2">No places in this list yet</p>
            {canAddPlaces && (
              <Button className="bg-black text-white hover:bg-black/80 text-sm" onClick={handleAddPlace}>
                <Plus size={14} className="mr-1" /> Add First Place
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((place: any) => (
              <div
                key={place.id}
                className="border border-black/10 rounded-md p-3 hover:bg-black/5 cursor-pointer"
                onClick={() => onPlaceClick(place)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{place.name}</h4>
                    {place.address && <p className="text-xs text-black/70 truncate">{place.address}</p>}
                  </div>
                  <ExternalLink size={14} className="text-black/40 ml-2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit List Modal */}
      {showEditModal && list && (
        <EditListModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          list={list}
          onListUpdated={handleListUpdated}
        />
      )}

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <AddPlaceModal listId={listId} onClose={() => setShowAddPlaceModal(false)} onPlaceAdded={handlePlaceAdded} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the list "{list.title}" and remove it from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteList} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
