"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"
import { useSearchParams } from "next/navigation"

export function SidebarWrapper() {
  const searchParams = useSearchParams()
  const [initialState, setInitialState] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Parse URL parameters to set initial state
    const tab = searchParams.get("tab")
    const listId = searchParams.get("list")
    const placeId = searchParams.get("place")
    const action = searchParams.get("action")

    const state: any = {
      activeTab: tab || "discover",
      showListDetails: !!listId && action !== "addPlace",
      showPlaceDetails: !!placeId,
      selectedListId: listId,
      selectedPlaceId: placeId,
      showAddPlaceToList: !!listId && action === "addPlace",
    }

    setInitialState(state)
    setIsReady(true)
  }, [searchParams])

  if (!isReady) {
    return null
  }

  return <Sidebar initialState={initialState} />
}
