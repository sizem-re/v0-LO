"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useMapSize } from "@/hooks/use-map-size"
import L from "leaflet"

interface MapBaseProps {
  center: [number, number]
  zoom: number
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  scrollWheelZoom?: boolean
  zoomControl?: boolean
  attributionControl?: boolean
  dragging?: boolean
  height?: string | number
}

export function MapBase({
  center,
  zoom,
  children,
  className = "",
  style = {},
  scrollWheelZoom = true,
  zoomControl = true,
  attributionControl = true,
  dragging = true,
  height = "400px",
}: MapBaseProps) {
  const [isMounted, setIsMounted] = useState(false)
  const mapSize = useMapSize()

  useEffect(() => {
    setIsMounted(true)

    // Fix for Leaflet marker icons in Next.js
    delete L.Icon.Default.prototype._getIconUrl

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })
  }, [])

  if (!isMounted) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ ...style, height }}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      zoomControl={false}
      attributionControl={attributionControl}
      dragging={dragging}
      className={`${className} z-0`}
      style={{ ...style, height }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="grayscale"
      />
      {zoomControl && <ZoomControl position="bottomright" />}
      {children}
    </MapContainer>
  )
}
