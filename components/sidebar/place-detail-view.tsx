"use client"

import { useState } from "react"
import { ChevronLeft, MapPin, Globe, Calendar, Edit, Trash2, ExternalLink, Share2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EditPlaceModal } from "./edit-place-modal"

interface PlaceDetailViewProps {
  place: any
  listId: string
  onBack: () => void
  onPlaceUpdated?: (updatedPlace: any) => void
  onPlaceDeleted?: (placeId: string) => void
  onCenterMap?: (coordinates: { lat: number; lng: number }) => void
}

export function PlaceDetailView({
  place,
  listId,
  onBack,
  onPlaceUpdated,
  onPlaceDeleted,
  onCenterMap,
}: PlaceDetailViewProps) {
  const { dbUser } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Center map on the place when component mounts
  useState(() => {
    if (place?.coordinates && onCenterMap) {
      onCenterMap(place.coordinates)
    }
  })

  if (!place) {
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
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  const formattedDate = place.addedAt
    ? new Date(place.addedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  const isOwner = dbUser?.id === place.added_by_user_id

  const handleEditPlace = () => {
    setShowEditModal(true)
  }

  const handlePlaceUpdated = (updatedPlace: any) => {
    if (onPlaceUpdated) {
      onPlaceUpdated(updatedPlace)
    }
    toast({
      title: "Place updated",
      description: "The place details have been updated successfully.",
    })
  }

  const handleDeletePlace = async () => {
    try {
      setIsDeleting(true)
      console.log(`Deleting place with ID: ${place.id} from list: ${listId}`)

      const response = await fetch(`/api/list-places`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId,
          placeId: place.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete place")
      }

      console.log("Place deleted successfully")
      toast({
        title: "Place removed",
        description: `"${place.name}" has been removed from the list.`,
      })

      if (onPlaceDeleted) {
        onPlaceDeleted(place.id)
      }

      setShowDeleteConfirm(false)
      onBack() // Go back to the list view
    } catch (err) {
      console.error("Error deleting place:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete place",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSharePlace = () => {
    // Implement sharing functionality
    toast({
      title: "Share feature",
      description: "Sharing functionality will be implemented soon.",
    })
  }

  const handleFavoritePlace = () => {
    // Implement favorite functionality
    toast({
      title: "Favorite feature",
      description: "Favorite functionality will be implemented soon.",
    })
  }

  const handleCenterMap = () => {
    if (place.coordinates && onCenterMap) {
      onCenterMap(place.coordinates)
    }
  }

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
            <h2 className="font-serif text-xl truncate">{place.name}</h2>
          </div>
        </div>
      </div>

      {/* Place Image */}
      <div className="relative">
        <div
          className="w-full h-48 bg-gray-100"
          style={{
            backgroundImage: place.image ? `url(${place.image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {place.type && (
          <Badge className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white">{place.type}</Badge>
        )}
      </div>

      {/* Place Details */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleCenterMap}
            title="Center on map"
          >
            <MapPin size={14} /> Map
          </Button>
          {isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleEditPlace}
                title="Edit place"
              >
                <Edit size={14} /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
                title="Remove place"
              >
                <Trash2 size={14} /> Remove
              </Button>
            </>
          )}
          <div className="flex-grow"></div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleSharePlace}
            title="Share place"
          >
            <Share2 size={14} /> Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleFavoritePlace}
            title="Favorite place"
          >
            <Heart size={14} /> Save
          </Button>
        </div>

        {place.address && (
          <div className="flex items-start mb-3">
            <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            <p className="text-sm text-black/80">{place.address}</p>
          </div>
        )}

        {place.website && (
          <div className="flex items-start mb-3">
            <Globe size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              {place.website.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        )}

        {formattedDate && (
          <div className="flex items-start mb-3">
            <Calendar size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            <p className="text-sm text-black/70">Added {formattedDate}</p>
          </div>
        )}

        <Separator className="my-4" />

        {place.notes ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-sm text-black/80 whitespace-pre-wrap">{place.notes}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-black/60">
            <p className="text-sm">No notes for this place</p>
          </div>
        )}
      </div>

      {/* Edit Place Modal */}
      {showEditModal && (
        <EditPlaceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          place={place}
          listId={listId}
          onPlaceUpdated={handlePlaceUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this place?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{place.name}" from this list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeletePlace}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
