"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"

export function SearchBar() {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search
    console.log("Searching for:", query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full md:w-64">
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="lo-input pr-10"
      />
      <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-label="Search">
        <Search className="h-4 w-4" />
      </button>
    </form>
  )
}
