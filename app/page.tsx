import { Suspense } from "react"
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import { FarcasterReady } from "@/components/farcaster-ready"
import MapClientWrapper from "@/components/map/map-client-wrapper"

export default function HomePage() {
  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Keep FarcasterReady component to ensure miniapp functionality */}
      <FarcasterReady />

      {/* Map container with lower z-index */}
      <div className="w-full h-full relative z-0">
        <Suspense fallback={<MapLoadingFallback />}>
          <MapClientWrapper />
        </Suspense>
      </div>

      {/* Sidebar with higher z-index */}
      <div className="absolute top-0 left-0 h-full z-50">
        <SidebarWrapper />
      </div>
    </div>
  )
}

function MapLoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  )
}
