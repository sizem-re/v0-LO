"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import Link from "next/link"

type SearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Focus the input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      
      // Add event listener to close dialog on ESC key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false)
        }
      }
      
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [open, onOpenChange])

  // Handle click outside to close
  useEffect(() => {
    if (!open) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onOpenChange])

  // Mock search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would fetch results from an API
    setResults([
      { id: "1", title: "The Fish House Cafe", type: "Restaurant", path: "/places/p1" },
      { id: "2", title: "Vien Dong", type: "Vietnamese Restaurant", path: "/places/p2" },
      { id: "3", title: "Tacoma Weekend Guide", type: "List", path: "/lists/1" },
    ])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-16 px-4">
      <div 
        ref={dialogRef}
        className="bg-white w-full max-w-2xl shadow-lg border border-black/10"
      >
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for places, lists, or users..."
            className="w-full p-4 pr-12 border-b border-black/10 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mr-2"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" aria-label="Search">
              <Search size={18} />
            </button>
          </div>
        </form>
        
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="divide-y divide-black/5">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.path}
                  className="block p-3 hover:bg-gray-50"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-black/70">{result.type}</div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-black/70">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-black/70">
              Type to start searching
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 