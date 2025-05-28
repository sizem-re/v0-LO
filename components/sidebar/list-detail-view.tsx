"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, MapPin, Globe, Users, Lock, Plus, ExternalLink, Share2, Edit3, Trash2, Check, Copy, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { EditListModal } from "./edit-list-modal"
import { AddPlaceModal } from "./add-place-modal"
import { toast } from "@/components/ui/use-toast"

// Farcaster icon component
const FarcasterIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="currentColor"/>
    <path d="M128.889 253.333L157.778 253.333C157.778 253.333 157.778 253.333 157.778 253.333L157.778 746.667C157.778 746.667 157.778 746.667 157.778 746.667L128.889 746.667V253.333Z" fill="currentColor"/>
    <path d="M842.222 253.333L871.111 253.333V746.667L842.222 746.667C842.222 746.667 842.222 746.667 842.222 746.667L842.222 253.333C842.222 253.333 842.222 253.333 842.222 253.333Z" fill="currentColor"/>
  </svg>
)

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
  const [linkCopied, setLinkCopied] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

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

  // Reset linkCopied state after 2 seconds
  useEffect(() => {
    if (linkCopied) {
      const timer = setTimeout(() => {
        setLinkCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [linkCopied])

  // Close share options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareOptions) {
        const target = event.target as HTMLElement
        const shareContainer = target.closest('.share-container')
        if (!shareContainer) {
          setShowShareOptions(false)
        }
      }
    }

    if (showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareOptions])

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
    console.log("Place added:", place)
    fetchListDetails() // Refresh the list to show the new place
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const baseUrl = window.location.origin
      const listUrl = `${baseUrl}/?list=${listId}`
      
      // Always copy to clipboard for simplicity
      await navigator.clipboard.writeText(listUrl)
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard.",
      })
      setLinkCopied(true)
      setShowShareOptions(false) // Close share options after copying
    } catch (error) {
      console.error("Error copying link:", error)
      // Fallback for older browsers or if clipboard API fails
      try {
        const textArea = document.createElement('textarea')
        textArea.value = `${window.location.origin}/?list=${listId}`
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast({
          title: "Link copied!",
          description: "The shareable link has been copied to your clipboard.",
        })
        setLinkCopied(true)
        setShowShareOptions(false) // Close share options after copying
      } catch (fallbackError) {
        toast({
          title: "Copy failed",
          description: "Unable to copy link. Please copy the URL manually.",
          variant: "destructive",
        })
      }
    }
  }

  const handleShareToFarcaster = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const baseUrl = window.location.origin
      // Add trailing slash for Farcaster frame URL
      const frameUrl = `${baseUrl}/lists/${listId}/frame/`
      const listTitle = list?.title || "Check out this list"
      const listDescription = list?.description || "A curated list of amazing places"
      const placeCount = list?.places?.length || 0
      const ownerName = list?.owner?.farcaster_display_name || list?.owner?.farcaster_username || "someone"
      
      // Create more engaging Farcaster share text
      const placeText = placeCount === 1 ? "place" : "places"
      const emoji = placeCount > 10 ? "🗺️" : placeCount > 5 ? "📍" : "✨"
      
      let shareText = `${emoji} ${listTitle}`
      
      // Add description if available and not too long
      if (listDescription && listDescription !== "A curated list of amazing places") {
        const truncatedDescription = listDescription.length > 60 
          ? `${listDescription.substring(0, 60)}...` 
          : listDescription
        shareText += `\n\n${truncatedDescription}`
      }
      
      // Add simple place count
      shareText += `\n\n📍 ${placeCount} ${placeText}`
      
      // Add frame URL on its own line
      shareText += `\n${frameUrl}`
      
      // Try to open Warpcast app first, fallback to web
      const warpcastAppUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
      
      // Check if we're in a mobile environment
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // Try to open the Warpcast app
        window.open(warpcastAppUrl, '_blank')
      } else {
        // On desktop, open Warpcast web
        window.open(warpcastAppUrl, '_blank')
      }
      
      toast({
        title: "Opening Farcaster",
        description: "Redirecting to Warpcast to share your list...",
      })
      setShowShareOptions(false) // Close share options after sharing
    } catch (error) {
      console.error("Error sharing to Farcaster:", error)
      toast({
        title: "Share failed",
        description: "Unable to open Farcaster. Please try again.",
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
            {/* Share Button - visible for owners and public lists */}
            {(isOwner || list.visibility === "public") && (
              <div className="relative share-container">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 transition-colors ${linkCopied ? 'bg-green-100 text-green-600 hover:bg-green-200' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowShareOptions(!showShareOptions)
                  }}
                  title="Share options"
                >
                  {linkCopied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                </Button>
                
                {/* Share options - inline expansion */}
                {showShareOptions && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 shadow-lg rounded-md py-1 z-50 min-w-[140px]">
                    <button 
                      onClick={handleCopyLink} 
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <Link size={14} />
                      Copy Link
                    </button>
                    <button 
                      onClick={handleShareToFarcaster} 
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <FarcasterIcon size={14} />
                      Share to Farcaster
                    </button>
                  </div>
                )}
              </div>
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
