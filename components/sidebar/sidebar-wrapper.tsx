"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"

export function SidebarWrapper() {
  const searchParams = useSearchParams()
  const [initialState, setInitialState] = useState({
    activeTab: "discover",
    showListDetails: false,
    showPlaceDetails: false,
    selectedListId: null as string | null,
    selectedPlaceId: null as string | null,
  })

  useEffect(() => {
    // Get state from URL parameters
    const tab = searchParams.get("tab")
    const listId = searchParams.get("list")
    const placeId = searchParams.get("place")

    // Set initial state based on URL parameters
    if (tab) {
      setInitialState((prev) => ({ ...prev, activeTab: tab }))
    }

    if (listId) {
      setInitialState((prev) => ({ ...prev, showListDetails: true, selectedListId: listId }))
    }

    if (placeId) {
      setInitialState((prev) => ({ ...prev, showPlaceDetails: true, selectedPlaceId: placeId }))
    }
  }, [searchParams])

  return <Sidebar initialState={initialState} />
}
