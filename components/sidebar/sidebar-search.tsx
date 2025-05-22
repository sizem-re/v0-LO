"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

export function SidebarSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        placeholder="Search places and lists..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full py-2 pl-9 pr-4 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
      />
      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    </form>
  )
}
