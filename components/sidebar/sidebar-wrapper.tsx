"use client"
import { Sidebar } from "./sidebar"

interface SidebarWrapperProps {
  initialListId?: string | null
}

export function SidebarWrapper({ initialListId }: SidebarWrapperProps) {
  return <Sidebar initialListId={initialListId} />
}
