"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Import the map component only on the client side
const ClientMap = dynamic(() => import("./client-map"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
})

export default function MapContainer() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // On the server, render a placeholder
  if (!isClient) {
    return <MapLoadingPlaceholder />
  }

  // On the client, render the actual map
  return <ClientMap />
}

function MapLoadingPlaceholder() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-pulse mb-2">
          <div className="h-8 w-32 bg-gray-300 mx-auto rounded"></div>
        </div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  )
}
