"use client"

import { useEffect } from "react"

// This component loads Leaflet from local files
export function LeafletSetup() {
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return

    // Don't load if already loaded
    if (window.L) return

    try {
      // Dynamically import Leaflet (this assumes you've added Leaflet to your project)
      import("leaflet").then((L) => {
        // Make Leaflet available globally
        window.L = L.default

        // Set up default icon paths
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "/images/marker-icon-2x.png",
          iconUrl: "/images/marker-icon.png",
          shadowUrl: "/images/marker-shadow.png",
        })

        console.log("Leaflet loaded successfully")
      })
    } catch (error) {
      console.error("Failed to load Leaflet:", error)
    }
  }, [])

  return null
}
