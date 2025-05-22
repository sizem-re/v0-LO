"use client"

import type { ReactNode } from "react"
import { Footer } from "./footer"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function PageLayout({ children, className = "", fullWidth = false }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className={`flex-1 ${fullWidth ? "w-full" : "container"} mx-auto px-4 ${className}`}>{children}</main>
      <Footer />
    </div>
  )
}
