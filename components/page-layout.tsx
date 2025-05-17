"use client"

import type React from "react"

import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { usePathname } from "next/navigation"

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if the current path is a map page
  const isMapPage = pathname?.startsWith("/map")

  if (isMapPage) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
