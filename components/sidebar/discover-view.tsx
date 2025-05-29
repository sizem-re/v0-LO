"use client"

import { useState, useEffect } from "react"
import { MapPin, Globe, Users, Search, TrendingUp, Clock, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import type { List } from "@/types/database"
import { FarcasterProfileLink } from "@/components/ui/farcaster-profile-link"

interface DiscoverViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectList: (listId: string) => void
  onLogin: () => void
}

export function DiscoverView({ searchQuery, onSearchChange, onSelectList, onLogin }: DiscoverViewProps) {
  const [publicLists, setPublicLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'trending' | 'recent' | 'popular'>('trending')
  
  const { isAuthenticated } = useAuth()

  // Fetch public and community lists
  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/lists?visibility=public-community`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch lists")
        }
        
        const lists = await response.json()
        setPublicLists(lists)
      } catch (err) {
        console.error("Error fetching public lists:", err)
        setError(err instanceof Error ? err.message : "Failed to load discover content")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicLists()
  }, [])

  // Filter lists based on search query
  const filteredLists = publicLists.filter(list => 
    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (list.owner?.farcaster_display_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Sort lists based on active filter
  const sortedLists = [...filteredLists].sort((a, b) => {
    switch (activeFilter) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'popular':
        return (b.places?.length || 0) - (a.places?.length || 0)
      case 'trending':
      default:
        // For trending, we'll sort by a combination of recency and place count
        const aScore = (a.places?.length || 0) + (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7) // Weight recent activity
        const bScore = (b.places?.length || 0) + (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)
        return bScore - aScore
    }
  })

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe size={12} className="text-green-600" />
      case 'community':
        return <Users size={12} className="text-blue-600" />
      default:
        return <Globe size={12} className="text-green-600" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'community':
        return 'Community'
      default:
        return 'Public'
    }
  }

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="border-black/20"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex border border-black/10 rounded-lg overflow-hidden">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
            activeFilter === 'trending' 
              ? 'bg-black text-white' 
              : 'bg-white text-black/70 hover:text-black'
          }`}
          onClick={() => setActiveFilter('trending')}
        >
          <TrendingUp size={12} />
          Trending
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
            activeFilter === 'recent' 
              ? 'bg-black text-white' 
              : 'bg-white text-black/70 hover:text-black'
          }`}
          onClick={() => setActiveFilter('recent')}
        >
          <Clock size={12} />
          Recent
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
            activeFilter === 'popular' 
              ? 'bg-black text-white' 
              : 'bg-white text-black/70 hover:text-black'
          }`}
          onClick={() => setActiveFilter('popular')}
        >
          <Heart size={12} />
          Popular
        </button>
      </div>

      {/* Welcome message for unauthenticated users */}
      {!isAuthenticated && (
        <Card className="p-4 bg-black/5 border-black/10">
          <div className="text-center">
            <h3 className="font-serif text-lg mb-2">Welcome to LO</h3>
            <p className="text-sm text-black/70 mb-3">
              Discover amazing places shared by the community. Connect with Farcaster to create your own lists and start exploring.
            </p>
            <Button 
              onClick={onLogin}
              className="bg-black text-white hover:bg-black/80 text-sm"
            >
              Connect to Get Started
            </Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3 border-black/10">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : sortedLists.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? (
            <>
              <p className="text-black/60 mb-2">No lists found matching "{searchQuery}"</p>
              <p className="text-xs text-black/50">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-black/60 mb-2">No public lists available yet</p>
              <p className="text-xs text-black/50">Be the first to share a list with the community!</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Results count */}
          <div className="text-xs text-black/60 px-1">
            {searchQuery 
              ? `${sortedLists.length} lists found`
              : `${sortedLists.length} ${activeFilter} lists`
            }
          </div>

          {/* Lists */}
          {sortedLists.map((list) => (
            <Card
              key={list.id}
              className="p-3 border border-black/10 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectList(list.id)}
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h3 className="font-serif font-medium text-sm truncate flex-1 pr-2">
                    {list.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-black/60 flex-shrink-0">
                    {getVisibilityIcon(list.visibility)}
                    <span className="hidden sm:inline">{getVisibilityText(list.visibility)}</span>
                  </div>
                </div>

                {/* Description */}
                {list.description && (
                  <p className="text-xs text-black/70 truncate">
                    {list.description}
                  </p>
                )}

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs text-black/60">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{list.places?.length || 0} places</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{formatCreatedDate(list.created_at)}</span>
                    </div>
                  </div>
                  
                  {list.owner && (
                    <div className="flex items-center gap-1">
                      {list.owner.farcaster_pfp_url && (
                        <img
                          src={list.owner.farcaster_pfp_url}
                          alt={list.owner.farcaster_display_name || 'User'}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <FarcasterProfileLink 
                        username={list.owner.farcaster_username}
                        displayName={list.owner.farcaster_display_name || list.owner.farcaster_username || 'Anonymous'}
                        className="truncate max-w-20 text-xs text-black/60"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 