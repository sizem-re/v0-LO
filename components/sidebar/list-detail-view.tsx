"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, MapPin, Globe, Users, Lock, Plus, ExternalLink, Share2, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { EditListModal } from "./edit-list-modal"
import { AddPlaceModal } from "./add-place-modal"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false)

  const fetchListDetails = useCallback(async () => {
    try {
      setError(null)

      console.log(`Fetching list details for ID: ${listId}`)
      const response = await fetch(`/api/lists/${listId}?_=${new Date().getTime()}`) // Add cache-busting parameter

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
  }, [listId])

  useEffect(() => {
    if (listId) {
      setLoading(true)
      fetchListDetails()
    }
  }, [listId, fetchListDetails])

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

  const handleAddPlace = () => {
    setShowAddPlaceModal(true)
  }

  const handlePlaceAdded = (place: any) => {
    // Refresh the list to show the new place
    fetchListDetails()
  }

  const handleFarcasterShare = async () => {
    try {
      const baseUrl = window.location.origin
      const frameUrl = `${baseUrl}/lists/${listId}/frame`
      
      console.log('Farcaster share URLs:', {
        baseUrl,
        frameUrl,
        listId
      })
      
      // Create a Farcaster cast URL with the frame
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`Check out this list: ${list.title}`)}&embeds[]=${encodeURIComponent(frameUrl)}`
      
      console.log('Final Farcaster URL:', farcasterUrl)
      
      // Open Farcaster in a new tab
      window.open(farcasterUrl, '_blank', 'noopener,noreferrer')
      
      toast({
        title: "Opening Farcaster",
        description: "Opening Farcaster to share your list.",
      })
    } catch (error) {
      console.error("Error opening Farcaster:", error)
      toast({
        title: "Error",
        description: "Failed to open Farcaster. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      const baseUrl = window.location.origin
      const listUrl = `${baseUrl}/?list=${listId}`
      
      console.log('Share URLs:', {
        baseUrl,
        listUrl,
        listId
      })
      
      if (navigator.share) {
        // Use Web Share API if available (mobile)
        await navigator.share({
          title: `${list.title} by ${ownerName}`,
          text: list.description || `A list of ${places.length} places`,
          url: listUrl
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(listUrl)
        toast({
          title: "Link copied!",
          description: "The shareable link has been copied to your clipboard.",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error",
        description: "Failed to share the list. Please try again.",
        variant: "destructive",
      })
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

          <div className="flex items-center gap-2">
            {/* Share Button - visible for public lists */}
            {(isOwner || list.visibility === "public") && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-white border border-gray-200 shadow-lg" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Share this list</p>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleShare}
                      >
                        <Share2 size={14} className="mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleFarcasterShare}
                      >
                        <ExternalLink size={14} className="mr-2" />
                        Share to Farcaster
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            {/* Edit Button - visible for owners */}
            {isOwner && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleEditList}
              >
                <Edit3 size={16} />
              </Button>
            )}
          </div>
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
                onClick={(e) => {
                  e.stopPropagation() // Stop event from bubbling up
                  onPlaceClick(place)
                }}
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
          onListDeleted={() => {
            if (onDeleteList) {
              onDeleteList(list)
            }
          }}
        />
      )}

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <AddPlaceModal
          listId={listId}
          onClose={() => setShowAddPlaceModal(false)}
          onPlaceAdded={handlePlaceAdded}
          onRefreshList={fetchListDetails}
        />
      )}
    </div>
  )
}
