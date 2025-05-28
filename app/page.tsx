"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import { FarcasterReady } from "@/components/farcaster-ready"
import type { Place } from "@/types/place"
import { fetchPlaces } from "@/lib/place-utils"
import { useAuth } from "@/lib/auth-context"

// Dynamically import the map component with no SSR
const VanillaMap = dynamic(() => import("@/components/map/vanilla-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

function MapPageContent() {
  const searchParams = useSearchParams()
  const { dbUser } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialListId, setInitialListId] = useState<string | null>(null)

  // Function to load places
  const loadPlaces = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Pass user ID to include their private list places if authenticated
      const placesData = await fetchPlaces({ 
        userId: dbUser?.id 
      })
      console.log(`Loaded ${placesData.length} places from database`)
      setPlaces(placesData)
    } catch (err) {
      console.error("Error fetching places:", err)
      setError(err instanceof Error ? err.message : "Failed to load places")
    } finally {
      setIsLoading(false)
      setIsMounted(true)
    }
  }

  useEffect(() => {
    // Check for list parameter in URL - use multiple methods for reliability
    const listId = searchParams?.get('list')
    
    // Fallback: parse URL manually in case searchParams doesn't work in Mini App
    let fallbackListId = null
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      fallbackListId = urlParams.get('list')
    }
    
    const finalListId = listId || fallbackListId
    
    console.log('URL search params:', searchParams?.toString())
    console.log('List ID from searchParams:', listId)
    console.log('List ID from fallback:', fallbackListId)
    console.log('Final list ID:', finalListId)
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    console.log('Is Mini App context:', typeof window !== 'undefined' ? window.self !== window.top : false)
    
    // Always set initialListId - either to the list ID or null if no list parameter
    setInitialListId(finalListId)
    console.log('Setting initial list ID:', finalListId)
  }, [searchParams])

  useEffect(() => {
    loadPlaces()
  }, [dbUser?.id]) // Re-fetch when user authentication changes

  // Listen for place addition events from the sidebar
  useEffect(() => {
    const handlePlaceAdded = () => {
      console.log('Received placeAdded event, refreshing map places...')
      loadPlaces()
    }

    const handlePlaceUpdated = () => {
      console.log('Received placeUpdated event, refreshing map places...')
      loadPlaces()
    }

    const handlePlaceDeleted = () => {
      console.log('Received placeDeleted event, refreshing map places...')
      loadPlaces()
    }

    window.addEventListener('placeAdded', handlePlaceAdded)
    window.addEventListener('placeUpdated', handlePlaceUpdated)
    window.addEventListener('placeDeleted', handlePlaceDeleted)

    return () => {
      window.removeEventListener('placeAdded', handlePlaceAdded)
      window.removeEventListener('placeUpdated', handlePlaceUpdated)
      window.removeEventListener('placeDeleted', handlePlaceDeleted)
    }
  }, [dbUser?.id])

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
        <FarcasterReady />
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
        <FarcasterReady />
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading places</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Keep FarcasterReady component to ensure miniapp functionality */}
      <FarcasterReady />

      {/* Map container with lower z-index */}
      <div className="w-full h-full relative z-0">
        <VanillaMap 
          places={places} 
          height="100%" 
          onPlaceSelect={(place) => {
            console.log("Selected place:", place)
            // You can add additional functionality here like opening a place details modal
          }}
        />
      </div>

      {/* Sidebar with higher z-index */}
      <div className="absolute top-0 left-0 h-full z-50">
        <SidebarWrapper initialListId={initialListId} />
      </div>
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
        <FarcasterReady />
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  )
}
