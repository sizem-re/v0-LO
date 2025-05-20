"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "./sidebar"

export function SidebarWrapper() {
  const searchParams = useSearchParams()
  const [initialState, setInitialState] = useState({
    activeTab: "discover",
    showListDetails: false,
    showPlaceDetails: false,
    selectedListId: null,
    selectedPlaceId: null,
    showAddPlaceToList: false,
  })
  const [isReady, setIsReady] = useState(false)
  const [hasProcessedParams, setHasProcessedParams] = useState(false)

  useEffect(() => {
    if (hasProcessedParams) return

    const tab = searchParams.get("tab")
    const listId = searchParams.get("list")
    const placeId = searchParams.get("place")
    const action = searchParams.get("action")

    const newState = {
      activeTab: tab || "discover",
      showListDetails: !!listId && action !== "addPlace",
      showPlaceDetails: !!placeId,
      selectedListId: listId,
      selectedPlaceId: placeId,
      showAddPlaceToList: !!listId && action === "addPlace",
    }

    setInitialState(newState)
    setIsReady(true)
    setHasProcessedParams(true)
  }, [searchParams, hasProcessedParams])

  if (!isReady) {
    return <div className="h-full w-full bg-white"></div>
  }

  return <Sidebar initialState={initialState} />
}
