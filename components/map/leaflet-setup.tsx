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
      // Add Leaflet CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      // Dynamically import Leaflet
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
