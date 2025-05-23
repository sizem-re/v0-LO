"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  MapPin,
  Globe,
  User,
  Edit,
  ExternalLink,
  Plus,
  Loader2,
  ListIcon,
  AlertCircle,
  Bug,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
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
  DialogClose,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PlaceDetailViewProps {
  place: any
  listId: string
  listOwnerId?: string
  onBack: () => void
  onPlaceUpdated?: (updatedPlace: any) => void
  onPlaceDeleted?: (placeId: string) => void
  onCenterMap?: (coordinates: { lat: number; lng: number }) => void
  onNavigateToList?: (listId: string) => void
}

export function PlaceDetailView({
  place,
  listId,
  listOwnerId,
  onBack,
  onPlaceUpdated,
  onPlaceDeleted,
  onCenterMap,
  onNavigateToList,
}: PlaceDetailViewProps) {
  const { dbUser } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [connectedLists, setConnectedLists] = useState<any[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [listsError, setListsError] = useState<string | null>(null)
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoadingUserLists, setIsLoadingUserLists] = useState(false)
  const [listSearchQuery, setListSearchQuery] = useState("")
  const [filteredLists, setFilteredLists] = useState<any[]>([])
  const [isAddingToList, setIsAddingToList] = useState(false)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [createdByUser, setCreatedByUser] = useState<any>(null)
  const [isLoadingCreatedBy, setIsLoadingCreatedBy] = useState(false)
  const [currentList, setCurrentList] = useState<any>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [currentPlace, setCurrentPlace] = useState<any>(place)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [listPlaceId, setListPlaceId] = useState<string | null>(null)

  // Debug function
  const fetchDebugData = async () => {
    try {
      const response = await fetch(`/api/debug/place-user?placeId=${place.id}&listId=${listId}`)
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
        console.log("Debug data:", data)
      }
    } catch (error) {
      console.error("Error fetching debug data:", error)
    }
  }

  // Fetch the latest place data
  const fetchPlaceData = useCallback(async () => {
    if (!place?.id) return

    try {
      const response = await fetch(`/api/places/${place.id}?t=${Date.now()}`)
      if (response.ok) {
        const placeData = await response.json()
        console.log("Fetched updated place data:", placeData)
        setCurrentPlace(placeData)
      }
    } catch (error) {
      console.error("Error fetching place data:", error)
    }
  }, [place?.id])

  // Fetch place data on mount and when place changes
  useEffect(() => {
    fetchPlaceData()
  }, [fetchPlaceData])

  // Center map on the place when component mounts
  useEffect(() => {
    if (currentPlace?.coordinates && onCenterMap) {
      onCenterMap(currentPlace.coordinates)
    } else if (currentPlace?.lat && currentPlace?.lng && onCenterMap) {
      onCenterMap({
        lat: Number.parseFloat(currentPlace.lat),
        lng: Number.parseFloat(currentPlace.lng),
      })
    }
  }, [currentPlace, onCenterMap])

  // Fetch current list details to get owner information
  useEffect(() => {
    const fetchCurrentList = async () => {
      if (!listId) return

      try {
        const response = await fetch(`/api/lists/${listId}?t=${Date.now()}`)
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

  // Simplified user lookup - just use the creator_id from list_places
  const fetchCreatedByUser = useCallback(async () => {
    try {
      setIsLoadingCreatedBy(true)

      // Get the creator_id from the list_places relationship
      const listPlaceResponse = await fetch(`/api/debug/place-user?placeId=${currentPlace.id}&listId=${listId}`)
      if (!listPlaceResponse.ok) {
        setCreatedByUser({ farcaster_display_name: "Unknown User" })
        return
      }

      const debugData = await listPlaceResponse.json()
      const creatorId = debugData.listPlace?.creator_id

      if (!creatorId) {
        setCreatedByUser({ farcaster_display_name: "Unknown User" })
        return
      }

      // Fetch user data
      const userResponse = await fetch(`/api/users/${creatorId}`)
      if (!userResponse.ok) {
        setCreatedByUser({ farcaster_display_name: "Unknown User" })
        return
      }

      const userData = await userResponse.json()
      setCreatedByUser(userData)
    } catch (error) {
      console.error("Error fetching user who added the place:", error)
      setCreatedByUser({ farcaster_display_name: "Unknown User" })
    } finally {
      setIsLoadingCreatedBy(false)
    }
  }, [currentPlace?.id, listId])

  useEffect(() => {
    fetchCreatedByUser()
  }, [fetchCreatedByUser])

  // Fetch lists that contain this place
  const fetchConnectedLists = useCallback(async () => {
    if (!currentPlace?.id) return

    try {
      setIsLoadingLists(true)
      setListsError(null)

      const response = await fetch(`/api/places/${currentPlace.id}/lists?t=${Date.now()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(errorData.error || `Failed to fetch lists: ${response.status}`)
      }

      const lists = await response.json()

      // Make sure current list is included
      if (listId && !lists.some((list: any) => list.id === listId)) {
        try {
          const currentListResponse = await fetch(`/api/lists/${listId}?t=${Date.now()}`)
          if (currentListResponse.ok) {
            const currentList = await currentListResponse.json()
            lists.push(currentList)
          }
        } catch (error) {
          console.error("Error fetching current list:", error)
        }
      }

      // Fetch list_places ID for the current list
      if (listId) {
        try {
          const listPlacesResponse = await fetch(`/api/debug/place-user?placeId=${currentPlace.id}&listId=${listId}`)
          if (listPlacesResponse.ok) {
            const data = await listPlacesResponse.json()
            if (data.listPlace?.id) {
              setListPlaceId(data.listPlace.id)
              console.log("Found list_places ID:", data.listPlace.id)
            }
          }
        } catch (error) {
          console.error("Error fetching list_places ID:", error)
        }
      }

      setConnectedLists(lists)
    } catch (error) {
      console.error("Error fetching connected lists:", error)
      setListsError(error instanceof Error ? error.message : "Failed to load lists data")
      toast({
        title: "Error",
        description: "Failed to load lists containing this place",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLists(false)
    }
  }, [currentPlace?.id, listId])

  useEffect(() => {
    fetchConnectedLists()
  }, [fetchConnectedLists])

  // Fetch user's lists for adding the place to a new list
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!dbUser?.id) return

      try {
        setIsLoadingUserLists(true)
        const response = await fetch(`/api/lists?userId=${dbUser.id}&t=${Date.now()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch user lists: ${response.status}`)
        }

        const data = await response.json()
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

  if (!currentPlace) {
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
  const canEdit =
    dbUser &&
    (dbUser.id === currentPlace.created_by || dbUser.id === currentList?.owner_id || dbUser.id === listOwnerId)

  console.log("Place ownership check:", {
    dbUserId: dbUser?.id,
    placeCreatedBy: currentPlace.created_by,
    currentListOwnerId: currentList?.owner_id,
    listOwnerIdProp: listOwnerId,
    canEdit,
  })

  const handleEditPlace = () => {
    setShowEditModal(true)
  }

  const handlePlaceUpdated = (updatedPlace: any) => {
    console.log("Place updated:", updatedPlace)
    setCurrentPlace(updatedPlace)

    if (onPlaceUpdated) {
      onPlaceUpdated(updatedPlace)
    }
  }

  const handlePlaceRemoved = (placeId: string) => {
    if (onPlaceDeleted) {
      onPlaceDeleted(placeId)
    }
    onBack()
  }

  const handleCenterMap = () => {
    if (currentPlace.coordinates && onCenterMap) {
      onCenterMap(currentPlace.coordinates)
    } else if (currentPlace.lat && currentPlace.lng && onCenterMap) {
      onCenterMap({
        lat: Number.parseFloat(currentPlace.lat),
        lng: Number.parseFloat(currentPlace.lng),
      })
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
          place_id: currentPlace.id,
          added_by: dbUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

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

      const addedList = userLists.find((list) => list.id === listId)
      if (addedList) {
        setConnectedLists([...connectedLists, addedList])
      }

      setUserLists(userLists.filter((list) => list.id !== listId))
      setFilteredLists(filteredLists.filter((list) => list.id !== listId))

      toast({
        title: "Added to list",
        description: `"${currentPlace.name}" has been added to the list.`,
      })

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

  const handleListClick = (listId: string) => {
    if (onNavigateToList) {
      onNavigateToList(listId)
    } else {
      console.log("Navigate to list:", listId)
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col">
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
            <h2 className="font-serif text-xl truncate">{currentPlace.name}</h2>
          </div>
          {/* Debug button - only in development */}
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchDebugData()
                setShowDebug(!showDebug)
              }}
              className="text-xs"
            >
              <Bug size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Debug info - only in development */}
      {showDebug && debugData && process.env.NODE_ENV === "development" && (
        <div className="p-4 bg-yellow-50 border-b text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(debugData, null, 2)}</pre>
        </div>
      )}

      {/* Place Image */}
      <div className="relative">
        <div
          className="w-full h-48 bg-gray-100"
          style={{
            backgroundImage: currentPlace.image ? `url(${currentPlace.image})` : undefined,
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

          {canEdit && (
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

        {currentPlace.address && (
          <div className="flex items-start mb-3">
            <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            <p className="text-sm text-black/80">{currentPlace.address}</p>
          </div>
        )}

        {currentPlace.website_url && (
          <div className="flex items-start mb-3">
            <Globe size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
            <a
              href={currentPlace.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              {currentPlace.website_url.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        )}

        {/* Added By field */}
        <div className="flex items-start mb-3">
          <User size={16} className="mr-2 mt-0.5 flex-shrink-0 text-black/60" />
          {isLoadingCreatedBy ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <p className="text-sm text-black/70">
              Added by {createdByUser?.farcaster_display_name || "Unknown User"}
            </p>
          )}
        </div>

        {currentPlace.notes && (
          <>
            <Separator className="my-4" />
            <div className="mb-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-black/80 whitespace-pre-wrap">{currentPlace.notes}</p>
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
          ) : listsError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col">
                <span>Error loading lists: {listsError}</span>
                <Button variant="outline" size="sm" className="mt-2 self-start" onClick={fetchConnectedLists}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : connectedLists.length > 0 ? (
            <div className="space-y-2">
              {connectedLists.map((list) => (
                <Card
                  key={list.id}
                  className="overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleListClick(list.id)}
                >
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

      {/* Edit Place Modal */}
      {showEditModal && (
        <EditPlaceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          place={currentPlace}
          listId={listId}
          onPlaceUpdated={handlePlaceUpdated}
          onPlaceRemoved={handlePlaceRemoved}
        />
      )}

      {/* Add to List Dialog */}
      <Dialog open={showAddToListDialog} onOpenChange={setShowAddToListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>Add "{currentPlace.name}" to another one of your lists.</DialogDescription>
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
