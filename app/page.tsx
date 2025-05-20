import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import { FarcasterReady } from "@/components/farcaster-ready"
import MapContainer from "@/components/map/map-container"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden">
      {/* Keep FarcasterReady component to ensure miniapp functionality */}
      <FarcasterReady />

      {/* Map container with lower z-index */}
      <div className="w-full h-full relative z-0">
        <MapContainer />
      </div>

      {/* Sidebar with higher z-index */}
      <div className="absolute top-0 left-0 h-full z-50">
        <SidebarWrapper />
      </div>
    </div>
  )
}
