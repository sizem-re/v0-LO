"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  MapPin,
  Globe,
  User,
  Edit,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  ListIcon,
  X,
  Check,
} from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { EditPlaceModal } from "./edit-place-modal"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PlaceDetailViewProps {
  place: any
  listId: string
  listOwnerId?: string
  onBack: () => void
  onPlaceUpdated?: (updatedPlace: any) => void
  onPlaceDeleted?: (placeId: string) => void
  onCenterMap?: (coordinates: { lat: number; lng: number }) => void
}

export function PlaceDetailView({
  place,
  listId,
  listOwnerId,
  onBack,
  onPlaceUpdated,
  onPlaceDeleted,
  onCenterMap,
}: PlaceDetailViewProps) {
  const { dbUser } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [connectedLists, setConnectedLists] = useState<any[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoadingUserLists, setIsLoadingUserLists] = useState(false)
  const [listSearchQuery, setListSearchQuery] = useState("")
  const [filteredLists, setFilteredLists] = useState<any[]>([])
  const [isAddingToList, setIsAddingToList] = useState(false)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [addedByUser, setAddedByUser] = useState<any>(null)
  const [isLoadingAddedBy, setIsLoadingAddedBy] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentList, setCurrentList] = useState<any>(null)

  // Center map on the place when component mounts
  useEffect(() => {
    if (place?.coordinates && onCenterMap) {
      onCenterMap(place.coordinates)
    }
  }, [place, onCenterMap])

  // Fetch current list details to get owner information
  useEffect(() => {
    const fetchCurrentList = async () => {
      if (!listId) return

      try {
        const response = await fetch(`/api/lists/${listId}`)
        if (response.ok) {
          const listData = await response.json()
          setCurrentList(listData)
        }
      } catch (error) {
        console.error("Error fetching current list:", error)
      }
    }

    fetchCurrentList()
  }, [listId])

  // Fetch user who added this place
  useEffect(() => {
    const fetchAddedByUser = async () => {
      if (!place?.addedBy && !place?.added_by) return

      try {
        setIsLoadingAddedBy(true)
        const userId = place.addedBy || place.added_by
        const response = await fetch(`/api/users/${userId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`)
        }

        const userData = await response.json()
        setAddedByUser(userData)
      } catch (error) {
        console.error("Error fetching user who added the place:", error)
      } finally {
        setIsLoadingAddedBy(false)
      }
    }

    fetchAddedByUser()
  }, [place?.addedBy, place?.added_by])

  // Fetch lists that contain this place
  useEffect(() => {
    const fetchConnectedLists = async () => {
      if (!place?.id) return

      try {
        setIsLoadingLists(true)

        // First, get all lists that contain this place
        const response = await fetch(`/api/places/${place.id}/lists`)
        let lists = []

        if (response.ok) {
          lists = await response.json()
        }

        // Make sure the current list is included
        if (!lists.some((list: any) => list.id === listId)) {
          // Fetch the current list details
          const currentListResponse = await fetch(`/api/lists/${listId}`)
          if (currentListResponse.ok) {
            const currentList = await currentListResponse.json()
            lists.push(currentList)
          }
        }

        setConnectedLists(lists)
      } catch (error) {
        console.error("Error fetching connected lists:", error)
        toast({
          title: "Error",
          description: "Failed to load lists containing this place",
          variant: "destructive",
        })
      } finally {
        setIsLoadingLists(false)
      }
    }

    fetchConnectedLists()
  }, [place?.id, listId])

  // Fetch user's lists for adding the place to a new list
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!dbUser?.id) return

      try {
        setIsLoadingUserLists(true)
        const response = await fetch(`/api/lists?userId=${dbUser.id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch user lists: ${response.status}`)
        }

        const data = await response.json()
        // Filter out lists that already contain this place
        const filteredData = data.filter(
          (list: any) => !connectedLists.some((connectedList) => connectedList.id === list.id),
        )
        setUserLists(filteredData)
        setFilteredLists(filteredData)
      } catch (error) {
        console.error("Error fetching user lists:", error)
      } finally {
        setIsLoadingUserLists(false)
      }
    }

    if (connectedLists.length >= 0) {
      fetchUserLists()
    }
  }, [dbUser?.id, connectedLists])

  // Filter lists based on search query
  useEffect(() => {
    if (!listSearchQuery.trim()) {
      setFilteredLists(userLists)
      return
    }

    const query = listSearchQuery.toLowerCase()
    const filtered = userLists.filter((list) => list.title.toLowerCase().includes(query))
    setFilteredLists(filtered)
  }, [listSearchQuery, userLists])

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

  // Check if user can edit/delete this place
  // User can edit if they added the place OR if they own the current list
  const canEdit =
    dbUser &&
    (dbUser.id === place.addedBy ||
      dbUser.id === place.added_by ||
      dbUser.id === currentList?.owner_id ||
      dbUser.id === listOwnerId)

  console.log("Place ownership check:", {
    dbUserId: dbUser?.id,
    placeAddedBy: place.addedBy,
    placeAddedByAlt: place.added_by,
    currentListOwnerId: currentList?.owner_id,
    listOwnerIdProp: listOwnerId,
    canEdit,
    place: place,
    currentList: currentList,
  })

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

      const response = await fetch(`/api/list-places?id=${place.listPlaceId}`, {
        method: "DELETE",
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

  const handleCenterMap = () => {
    if (place.coordinates && onCenterMap) {
      onCenterMap(place.coordinates)
    }
  }

  const handleAddToList = async (listId: string) => {
    if (!dbUser?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add this place to a list.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingToList(true)

      const response = await fetch("/api/list-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id: listId,
          place_id: place.id,
          added_by: dbUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle duplicate error gracefully
        if (response.status === 409) {
          toast({
            title: "Already in list",
            description: errorData.error || "This place is already in the selected list.",
          })
          return
        }

        throw new Error(errorData.error || "Failed to add place to list")
      }

      const result = await response.json()

      // Update the connected lists
      const addedList = userLists.find((list) => list.id === listId)
      if (addedList) {
        setConnectedLists([...connectedLists, addedList])
      }

      // Remove the list from available lists
      setUserLists(userLists.filter((list) => list.id !== listId))
      setFilteredLists(filteredLists.filter((list) => list.id !== listId))

      toast({
        title: "Added to list",
        description: `"${place.name}" has been added to the list.`,
      })

      // Close the dialog after successful addition
      setShowAddToListDialog(false)
    } catch (err) {
      console.error("Error adding place to list:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add place to list",
        variant: "destructive",
      })
    } finally {
      setIsAddingToList(false)
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-black/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <button
              className="flex items-center text-black hover:bg-black/5 p-2 rounded mr-2"
              onClick={isEditMode ? toggleEditMode : onBack}
              aria-label={isEditMode ? "Cancel" : "Back"}
            >
              {isEditMode ? <X size={16} /> : <ChevronLeft size={16} />}
            </button>
            <h2 className="font-serif text-xl truncate">{place.name}</h2>
          </div>

          {/* Edit mode toggle button */}
          {canEdit && !isEditMode && (
            <Button variant="ghost" size="sm" onClick={toggleEditMode} className="h-8 px-2">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}

          {/* Done button when in edit mode */}
          {isEditMode && (
            <Button variant="ghost" size="sm" onClick={toggleEditMode} className="h-8 px-2">
              <Check className="h-4 w-4 mr-1" />
              Done
            </Button>
          )}
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
      </div>

      {/* Place Details */}
      <div className="p-4 flex-grow">
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

          {canEdit && !isEditMode && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleEditPlace}
              title="Edit place details"
            >
              <Edit size={14} /> Edit Details
            </Button>
          )}

          {dbUser && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowAddToListDialog(true)}
              title="Add to another list"
            >
              <Plus size={14} /> Add to list
            </Button>
          )}
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

        {/* Added By field instead of Date Added */}
        {(place.addedBy || place.added_by) && (
          <div className="flex items-start mb-3">
            <User size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            {isLoadingAddedBy ? (
              <Skeleton className="h-4 w-24" />
            ) : addedByUser ? (
              <p className="text-sm text-black/70">
                Added by {addedByUser.display_name || addedByUser.username || "Unknown user"}
              </p>
            ) : (
              <p className="text-sm text-black/70">Added by a user</p>
            )}
          </div>
        )}

        {place.notes && (
          <>
            <Separator className="my-4" />
            <div className="mb-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-black/80 whitespace-pre-wrap">{place.notes}</p>
            </div>
          </>
        )}

        {/* Lists containing this place */}
        <Separator className="my-4" />
        <div className="mb-4">
          <h3 className="font-medium mb-2">In Lists</h3>

          {isLoadingLists ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-black/50" />
            </div>
          ) : connectedLists.length > 0 ? (
            <div className="space-y-2">
              {connectedLists.map((list) => (
                <Card key={list.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <ListIcon size={16} className="mr-2 text-black/60" />
                      <div>
                        <p className="font-medium text-sm">{list.title}</p>
                        <p className="text-xs text-black/60">
                          {list.place_count || 0} {(list.place_count || 0) === 1 ? "place" : "places"}
                        </p>
                      </div>
                    </div>
                    {list.id === listId && <div className="text-xs bg-black/10 px-2 py-1 rounded">Current</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/60 text-center py-2">This place is not in any lists yet.</p>
          )}
        </div>
      </div>

      {/* Remove button at the bottom - only visible in edit mode */}
      {isEditMode && canEdit && (
        <div className="p-4 border-t border-black/10 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} /> Remove from list
          </Button>
        </div>
      )}

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

      {/* Add to List Dialog */}
      <Dialog open={showAddToListDialog} onOpenChange={setShowAddToListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>Add "{place.name}" to another one of your lists.</DialogDescription>
          </DialogHeader>

          <div className="mb-3">
            <Input
              type="text"
              placeholder="Search your lists..."
              value={listSearchQuery}
              onChange={(e) => setListSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoadingUserLists ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-black/50" />
              </div>
            ) : filteredLists.length > 0 ? (
              <div className="space-y-2">
                {filteredLists.map((list) => (
                  <Card key={list.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <ListIcon size={16} className="mr-2 text-black/60" />
                        <p className="font-medium text-sm">{list.title}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => handleAddToList(list.id)}
                        disabled={isAddingToList}
                      >
                        <Plus size={16} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/60 text-center py-4">
                {listSearchQuery ? "No matching lists found" : "No other lists available"}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToListDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
