"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, MapPin, Globe, Users, Lock, Edit, Trash2, Plus, ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [showListInfo, setShowListInfo] = useState(false)

  useEffect(() => {
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

    if (listId) {
      fetchListDetails()
    }
  }, [listId])

  const handleEditList = () => {
    if (onEditList && list) {
      onEditList(list)
    }
  }

  const handleDeleteList = () => {
    if (onDeleteList && list) {
      onDeleteList(list)
      setShowDeleteConfirm(false)
    }
  }

  const handleAddPlace = () => {
    if (onAddPlace && listId) {
      onAddPlace(listId)
    }
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
        return "Public - Anyone can view"
      case "community":
        return "Community - Anyone can add places"
      case "private":
        return "Private - Only you can view"
      default:
        return "Public"
    }
  }

  if (loading) {
    return (
      <div className="p-4">
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
        <div className="space-y-4 mt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
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
      <div className="p-4">
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
    <div className="p-4">
      {/* Header with minimal info */}
      <div className="flex items-center justify-between mb-4">
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
        <button
          className="p-1 rounded-full hover:bg-black/5"
          onClick={() => setShowListInfo(true)}
          aria-label="List info"
        >
          <Info size={18} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-black/70">
        <div className="flex items-center">
          {getVisibilityIcon()}
          <span className="ml-1">{list.visibility}</span>
        </div>
        <div className="flex items-center">
          <MapPin size={14} className="mr-1" />
          <span>{places.length} places</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        {isOwner && (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleEditList}>
              <Edit size={14} className="mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          </>
        )}
        {canAddPlaces && (
          <Button className="flex-1 bg-black text-white hover:bg-black/80" size="sm" onClick={handleAddPlace}>
            <Plus size={14} className="mr-1" /> Add Place
          </Button>
        )}
      </div>

      {/* Places */}
      <h3 className="font-medium mb-3">Places</h3>
      {places.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-black/20 rounded-md">
          <p className="text-black/70 mb-4">No places in this list yet</p>
          {canAddPlaces && (
            <Button className="bg-black text-white hover:bg-black/80" onClick={handleAddPlace}>
              <Plus size={14} className="mr-1" /> Add First Place
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {places.map((item: any) => {
            const place = item.place || {}
            return (
              <div
                key={item.id}
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
            )
          })}
        </div>
      )}

      {/* List Info Dialog */}
      <Dialog open={showListInfo} onOpenChange={setShowListInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{list.title}</DialogTitle>
            <DialogDescription>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  {getVisibilityIcon()}
                  <span className="ml-2">{getVisibilityText()}</span>
                </div>
                <div className="text-sm">Created by {ownerName}</div>
                {list.description && (
                  <div className="mt-4 text-sm">
                    <p>{list.description}</p>
                  </div>
                )}
                <div className="mt-4 text-sm">
                  <p>
                    <strong>{places.length}</strong> places in this list
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteList}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
