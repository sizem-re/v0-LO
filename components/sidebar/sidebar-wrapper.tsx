"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"
import { useSearchParams } from "next/navigation"

export function SidebarWrapper() {
  const searchParams = useSearchParams()
  const [initialState, setInitialState] = useState({
    activeTab: "discover",
    showListDetails: false,
    showPlaceDetails: false,
    selectedListId: null as string | null,
    selectedPlaceId: null as string | null,
    showAddPlaceToList: false,
  })

  // Use a separate state to track if we've processed the URL params
  const [hasProcessedParams, setHasProcessedParams] = useState(false)

  useEffect(() => {
    // Only process URL parameters once
    if (!hasProcessedParams) {
      // Parse URL parameters to set initial state
      const tab = searchParams.get("tab")
      const listId = searchParams.get("list")
      const placeId = searchParams.get("place")
      const action = searchParams.get("action")

      // Create a new state object based on URL parameters
      const newState = {
        activeTab: tab || "discover",
        showListDetails: !!listId && action !== "addPlace",
        showPlaceDetails: !!placeId,
        selectedListId: listId,
        selectedPlaceId: placeId,
        showAddPlaceToList: !!listId && action === "addPlace",
      }

      setInitialState(newState)
      setHasProcessedParams(true)
    }
  }, [searchParams, hasProcessedParams])

  return <Sidebar initialState={initialState} />
}
